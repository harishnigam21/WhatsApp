import type { Server, Socket } from "socket.io";
import NotDelivered from "../../models/NotDelivered";
import Message from "../../models/Message";
import { userSocketIds } from "../../server";
import redisConnect from "../../config/redis_connect";
import { IUser } from "../../models/User";
import Conversation from "../../models/Conversation";

export function sendMessage(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("sendMessage", async (data, acknowledge) => {
    try {
      const { receiver_id, content } = data;
      const sender_id = authenticatedUserId;
      if (sender_id !== authenticatedUserId) {
        return acknowledge?.({
          sendMessage: {
            success: false,
            message: "You are not valid user to send message",
          },
        });
      }
      const RecStr = receiver_id.toString();
      const senStr = sender_id.toString();
      const receiverSocket = userSocketIds.get(receiver_id);
      type CachedUser = Omit<
        IUser,
        "refreshToken" | "fid" | "createdAt" | "updatedAt"
      > & {
        _id: string;
      };
      const formatAndCacheUser = async (userDoc: any): Promise<CachedUser> => {
        const formatted: CachedUser = {
          _id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          phone: userDoc.phone,
          phoneCode: userDoc.phoneCode,
          fullPhone: userDoc.fullPhone,
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

      const [message, getSenderData, getReceiverData] = await Promise.all([
        Message.create({
          sender_id,
          receiver_id,
          content,
          seen: receiverSocket ? "semiseen" : "unseen",
        }),
        redisConnect.get(`WhatsAppUserInfo-${sender_id}`),
        redisConnect.get(`WhatsAppUserInfo-${receiver_id}`),
      ]);

      const populatedUsers: {
        sender_id: CachedUser | null;
        receiver_id: CachedUser | null;
      } = {
        sender_id: getSenderData ? JSON.parse(getSenderData) : null,
        receiver_id: getReceiverData ? JSON.parse(getReceiverData) : null,
      };

      const toPopulate: { path: "sender_id" | "receiver_id" }[] = [];
      if (!populatedUsers.sender_id) toPopulate.push({ path: "sender_id" });
      if (!populatedUsers.receiver_id) toPopulate.push({ path: "receiver_id" });
      const sortedParticipants = [senStr, RecStr].sort();
      await Promise.all([
        senStr === RecStr
          ? Conversation.findOneAndUpdate(
              { participants: sortedParticipants },
              {
                $set: {
                  [`lastMessage.${senStr}`]: message._id,
                },
                $setOnInsert: {
                  participants: sortedParticipants,
                  [`unreadCounts.${sender_id}`]: [],
                },
              },
              { upsert: true, returnDocument: "after" },
            )
          : Conversation.findOneAndUpdate(
              { participants: sortedParticipants },
              {
                $set: {
                  [`lastMessage.${senStr}`]: message._id,
                  [`lastMessage.${RecStr}`]: message._id,
                },
                $setOnInsert: {
                  participants: sortedParticipants,
                  [`unreadCounts.${sender_id}`]: [],
                },
                ...(message.seen !== "seen" && {
                  $addToSet: {
                    [`unreadCounts.${receiver_id}`]: message._id,
                  },
                }),
              },
              { upsert: true, returnDocument: "after" },
            ),
        !receiverSocket
          ? NotDelivered.create({
              sender_id,
              receiver_id,
              message_id: message._id,
            })
          : Promise.resolve(),
        toPopulate.length > 0
          ? message.populate<{
              sender_id: IUser;
              receiver_id: IUser;
            }>(toPopulate)
          : Promise.resolve(),
      ]);

      const cachePromises: Promise<CachedUser>[] = [];

      if (!populatedUsers.sender_id && message.populated("sender_id")) {
        cachePromises.push(
          formatAndCacheUser(message.sender_id).then(
            (u) => (populatedUsers.sender_id = u),
          ),
        );
      }

      if (!populatedUsers.receiver_id && message.populated("receiver_id")) {
        cachePromises.push(
          formatAndCacheUser(message.receiver_id).then(
            (u) => (populatedUsers.receiver_id = u),
          ),
        );
      }
      if (cachePromises.length > 0) {
        await Promise.all(cachePromises);
      }
      const messageData = {
        _id: message._id,
        sender_id: message.sender_id._id,
        receiver_id: message.receiver_id._id,
        content: message.content,
        seen: message.seen,
        createdAt: message.createdAt,
      };
      const senderDetail = populatedUsers.sender_id;
      const receiverDetail = populatedUsers.receiver_id;
      const senderDetailRequires = {
        _id: senderDetail?._id,
        name: senderDetail?.name,
        pic: senderDetail?.pic,
        lastSeen: senderDetail?.lastSeen,
        fullPhone: senderDetail?.fullPhone,
      };
      const receiverDetailRequires = {
        _id: receiverDetail?._id,
        name: receiverDetail?.name,
        pic: receiverDetail?.pic,
        lastSeen: receiverDetail?.lastSeen,
        fullPhone: receiverDetail?.fullPhone,
      };
      acknowledge?.({
        sendMessage: {
          success: true,
          messageData,
          receiverDetail: receiverDetailRequires,
        },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("newMessage", {
            messageData,
            senderDetail: senderDetailRequires,
          });
        }
      }
    } catch (error) {
      return acknowledge?.({
        sendMessage: { success: false, message: "Failed to send Message" },
      });
    }
  });
}
