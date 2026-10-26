import type { Server, Socket } from "socket.io";
import crypto from "node:crypto";
import cloudinary from "../../utils/cloudinary";
import Message from "../../models/Message";
import { userSocketIds } from "../../server";
import NotDelivered from "../../models/NotDelivered";
import { formatBytes } from "../../utils/formatBytes";

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
        let existingMessage = null;
        if (payload.parent) {
          existingMessage = await Message.findOne({
            _id: payload.parent,
            sender_id: payload.sender_id,
            receiver_id: payload.receiver_id,
          });

          if (!existingMessage) {
            return ackError(ack, "Parent message not found or unauthorized.");
          }
        }
        const receiverSocket = userSocketIds.get(payload.receiver_id);

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
        if (existingMessage) {
          messageDoc = await Message.findOneAndUpdate(
            {
              _id: existingMessage._id,
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
          messageDoc = await Message.create({
            sender_id: payload.sender_id,
            receiver_id: payload.receiver_id,
            content: payload.message ?? "",
            attachments: [attachment],
            seen: receiverSocket ? "semiseen" : "unseen",
          });
        }
        if (!receiverSocket) {
          await NotDelivered.create({
            sender_id: messageDoc.sender_id,
            receiver_id: messageDoc.receiver_id,
            message_id: messageDoc._id,
          });
        }
        const populateMessage = await messageDoc.populate([
          {
            path: "sender_id",
            select: "_id name pic lastSeen",
          },
          {
            path: "receiver_id",
            select: "_id name pic lastSeen",
          },
        ]);
        const messageData = {
          _id: messageDoc._id,
          sender_id: messageDoc.sender_id._id,
          receiver_id: messageDoc.receiver_id._id,
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
