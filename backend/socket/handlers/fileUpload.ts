import type { Server, Socket } from "socket.io";
import crypto from "node:crypto";
import cloudinary from "../../utils/cloudinary";
import Message from "../../models/Message";
import { userSocketIds } from "../../server";
import NotDelivered from "../../models/NotDelivered";
import { formatBytes } from "../../utils/formatBytes";
import redisConnect from "../../config/redis_connect";
import User, { IUser } from "../../models/User";
import Conversation from "../../models/Conversation";

// Replace this with your actual database message service.

type UploadPayloadRequest = {
  name: string;
  receiver: string;
  size: number;
};

type UploadedFilePayload = {
  sender_id: string;
  receiver_id: string;
  parent?: string | null;
  message?: string;
  mainMessage?: string;
  url: string;
  thumbnail?: string | null;
  public_id: string;
  type: string;
  resource_type: "image" | "video" | "raw";
  format?: string;
  name: string;
  created_at?: string;
  size: number;
  tags?: string[];
};

const allowedResourceTypes = new Set(["image", "video", "raw"]);

// const allowedMimeTypes = new Set([
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "image/gif",
//   "video/mp4",
//   "video/webm",
//   "application/pdf",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   "application/vnd.ms-powerpoint",
//   "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//   "text/plain",
// ]);

const ackError = (ack: Function, message: string) => {
  return ack(null, {
    success: false,
    message,
  });
};

export function registerFileUploadHandlers(io: Server, socket: Socket) {
  // Your socket authentication middleware must set this.
  const authenticatedUserId = socket.data.userId as string | undefined;

  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }

  // 1. Generate a signed Cloudinary upload payload.
  socket.on(
    "request-file-payload",
    async (payload: UploadPayloadRequest, ack: Function) => {
      try {
        if (!payload?.name || typeof payload.name !== "string") {
          return ackError(ack, "Invalid filename");
        }
        if (!payload.receiver) {
          return ackError(ack, "Invalid Receiver");
        }
        const maxSize = Number(process.env?.ATTACHMENT_SIZE) || 10485760;
        if (!payload.size || payload.size > maxSize) {
          return ackError(ack, `Max Size allowed ${formatBytes(maxSize)}`);
        }
        const timestamp = Math.floor(Date.now() / 1000);
        // Give each upload a unique server-generated public ID.
        const publicId = crypto.randomUUID();
        // Keep uploads isolated by authenticated user.
        const folder = `${process.env.ROOT}/messages/${authenticatedUserId}/${payload.receiver}/attachments`;
        const tags = "status_pending";
        const evalString = `if (resource_info.bytes > ${maxSize}) { throw "File size limit exceeded"; }`;
        const paramsToSign = {
          timestamp,
          folder,
          public_id: publicId,
          tags,
          eval: evalString,
        };
        const signature = cloudinary.utils.api_sign_request(
          paramsToSign,
          process.env.CLOUDINARY_API_SECRET!,
        );

        ack(null, {
          success: true,
          signature,
          timestamp: String(timestamp),
          apiKey: process.env.CLOUDINARY_API_KEY!,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
          folder,
          publicId,
          eval: evalString,
          message: "Upload credentials generated",
        });
      } catch (error) {
        console.error("Cloudinary signature error:", error);
        ackError(ack, "Could not prepare file upload");
      }
    },
  );

  // 2. Receive uploaded asset metadata and create a message.
  socket.on(
    "upload-file",
    async (payload: UploadedFilePayload, ack: Function) => {
      try {
        if (
          !payload ||
          !payload.public_id ||
          !payload.url ||
          !payload.receiver_id
        ) {
          return ackError(ack, "Missing required file metadata");
        }

        // Never trust the sender ID supplied by the browser.
        if (payload.sender_id !== authenticatedUserId) {
          return ackError(ack, "Sender authentication mismatch");
        }

        if (!allowedResourceTypes.has(payload.resource_type)) {
          return ackError(ack, "Invalid resource type");
        }

        // if (!allowedMimeTypes.has(payload.type)) {
        //   return ackError(ack, "Unsupported file type");
        // }

        if (!Number.isFinite(payload.size) || payload.size <= 0) {
          return ackError(ack, "Invalid file size");
        }

        const expectedPrefix = `${process.env.ROOT}/messages/${authenticatedUserId}/${payload.receiver_id}/attachments`;

        if (!payload.public_id.startsWith(expectedPrefix)) {
          return ackError(ack, "Invalid upload ownership");
        }

        // Confirm that the asset really exists in Cloudinary.
        const asset = await cloudinary.uploader.explicit(payload.public_id, {
          resource_type: payload.resource_type,
          type: "upload",
          tags: ["status_approved"],
          action: "remove",
        });
        // Compare authoritative Cloudinary metadata.
        if (
          asset.public_id !== payload.public_id ||
          asset.secure_url !== payload.url ||
          asset.bytes !== payload.size
        ) {
          return ackError(ack, "Uploaded asset metadata could not be verified");
        }

        const receiverSocket = userSocketIds.get(payload.receiver_id);
        type CachedUser = Omit<
          IUser,
          "refreshToken" | "fid" | "createdAt" | "updatedAt"
        > & {
          _id: string;
        };
        const formatAndCacheUser = async (
          userDoc: any,
        ): Promise<CachedUser> => {
          const formatted: CachedUser = {
            _id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            phone: userDoc.phone,
            phoneCode: userDoc.phoneCode,
            pic: userDoc.pic || null,
            banner: userDoc.banner || null,
            bio: userDoc.bio,
            lastSeen: userDoc.lastSeen,
          };

          await redisConnect.set(
            `WhatsAppUserInfo-${formatted._id}`,
            JSON.stringify(formatted),
            "EX",
            7 * 24 * 60 * 60,
          );

          return formatted;
        };
        const getUsersFromCacheOrDB = async (userIds: string[]) => {
          const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];
          const keys = uniqueIds.map((id) => `WhatsAppUserInfo-${id}`);
          const cachedList = await redisConnect.mget(keys);

          const userMap = new Map<string, CachedUser>();
          const missingIds: string[] = [];

          uniqueIds.forEach((id, idx) => {
            if (cachedList[idx]) {
              userMap.set(id, JSON.parse(cachedList[idx]!));
            } else {
              missingIds.push(id);
            }
          });

          if (missingIds.length > 0) {
            const dbUsers = await User.find({
              _id: { $in: missingIds },
            }).lean();
            await Promise.all(
              dbUsers.map(async (u) => {
                const cached = await formatAndCacheUser(u);
                userMap.set(cached._id, cached);
              }),
            );
          }

          return userMap;
        };
        if (payload.parent) {
          const cachedParent = await redisConnect.get(
            `OnGoingUploadMessage-${payload.parent}`,
          );

          if (!cachedParent) {
            const exists = await Message.exists({
              _id: payload.parent,
              sender_id: payload.sender_id,
              receiver_id: payload.receiver_id,
            });
            if (!exists) {
              return ackError(ack, "Parent message not found or unauthorized.");
            }
          } else {
            const parsed = JSON.parse(cachedParent);
            if (
              parsed.sender_id.toString() !== payload.sender_id.toString() ||
              parsed.receiver_id.toString() !== payload.receiver_id.toString()
            ) {
              return ackError(ack, "Unauthorized parent message access.");
            }
          }
        }

        // Validate recipient, conversation membership, parent message,
        // and authorization inside this service as well.
        const attachment = {
          url: asset.secure_url,
          thumbnail: payload.thumbnail,
          public_id: asset.public_id,
          type: payload.type,
          resource_type: payload.resource_type,
          format: payload.format,
          name: payload.name,
          created_at: payload.created_at,
          size: payload.size,
          tags: payload.tags,
          message: payload.message,
        };

        let messageDoc;
        const isNewMessage = !payload.parent;
        if (!isNewMessage) {
          messageDoc = await Message.findOneAndUpdate(
            {
              _id: payload.parent,
            },
            {
              $push: {
                attachments: attachment,
              },
              ...(receiverSocket && {
                $set: {
                  seen: "semiseen",
                },
              }),
            },
            {
              returnDocument: "after",
            },
          );
          if (!messageDoc) {
            return ackError(ack, "Could not update the parent message.");
          }
        } else {
          const created = await Message.create({
            sender_id: payload.sender_id,
            receiver_id: payload.receiver_id,
            content: payload.mainMessage ? payload.mainMessage : null,
            attachments: [attachment],
            seen: receiverSocket ? "semiseen" : "unseen",
          });
          messageDoc = created.toObject();
        }
        const sortedParticipants = [
          payload.sender_id.toString(),
          payload.receiver_id.toString(),
        ].sort();
        const [, userMap] = await Promise.all([
          redisConnect.set(
            `OnGoingUploadMessage-${messageDoc._id}`,
            JSON.stringify(messageDoc),
            "EX",
            60 * 60,
          ),
          getUsersFromCacheOrDB([payload.sender_id, payload.receiver_id]),
          !receiverSocket && isNewMessage
            ? NotDelivered.updateOne(
                { message_id: messageDoc._id },
                {
                  $setOnInsert: {
                    sender_id: messageDoc.sender_id,
                    receiver_id: messageDoc.receiver_id,
                    message_id: messageDoc._id,
                  },
                },
                { upsert: true },
              )
            : Promise.resolve(),
          Conversation.findOneAndUpdate(
            { participants: sortedParticipants } as any,
            {
              $set: {
                [`lastMessage.${payload.sender_id.toString()}`]: messageDoc._id,
                [`lastMessage.${payload.receiver_id.toString()}`]:
                  messageDoc._id,
              },
              $setOnInsert: {
                participants: sortedParticipants,
                [`unreadCounts.${payload.sender_id}`]: [],
              },
              ...(isNewMessage && {
                $addToSet: {
                  [`unreadCounts.${payload.receiver_id}`]: messageDoc._id,
                },
              }),
            },
            { upsert: true },
          ),
        ]);

        const populateMessage = {
          ...messageDoc,
          sender_id: userMap.get(payload.sender_id.toString()),
          receiver_id: userMap.get(payload.receiver_id.toString()),
        };
        const messageData = {
          _id: messageDoc._id,
          sender_id: messageDoc.sender_id.toString(),
          receiver_id: messageDoc.receiver_id.toString(),
          content: messageDoc.content,
          seen: messageDoc.seen,
          attachments: messageDoc.attachments,
          createdAt: messageDoc.createdAt,
        };

        // Adapt these fields to the return shape of your DB service.
        ack(null, {
          success: true,
          messageData,
          extraData: {
            senderDetail: populateMessage.sender_id,
            receiverDetail: populateMessage.receiver_id,
          },
          parent: messageDoc._id.toString(),
        });

        // Notify the recipient using your existing socket delivery logic.
        // Do not broadcast globally; target the authenticated recipient's
        // socket room and use the event name expected by your client.
        if (receiverSocket) {
          for (const socketId of receiverSocket) {
            io.to(socketId).emit("newAttachment", {
              messageData,
              extraData: {
                senderDetail: populateMessage.sender_id,
                receiverDetail: populateMessage.receiver_id,
              },
            });
          }
        }
      } catch (error) {
        console.error("File message creation failed:", error);
        ackError(
          ack,
          error instanceof Error
            ? error.message
            : "Could not create file message",
        );
      }
    },
  );
}
