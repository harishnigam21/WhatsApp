import type { Server, Socket } from "socket.io";
import NotDelivered from "../../models/NotDelivered";
import Message from "../../models/Message";
import { userSocketIds } from "../../server";
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
      const message = await Message.create({
        sender_id,
        receiver_id,
        content,
        seen: receiverSocket ? "semiseen" : "unseen",
      });

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
      ]);

      const messageData = {
        _id: message._id,
        sender_id: message.sender_id._id,
        receiver_id: message.receiver_id._id,
        content: message.content,
        seen: message.seen,
        createdAt: message.createdAt,
      };

      acknowledge?.({
        sendMessage: {
          success: true,
          messageData,
          // receiverDetail
        },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("newMessage", {
            messageData,
            // senderDetail
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
