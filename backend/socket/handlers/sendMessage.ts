import type { Server, Socket } from "socket.io";
import NotDelivered from "../../models/NotDelivered";
import Message from "../../models/Message";
import { userSocketIds } from "../../server";

export function sendMessage(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("sendMessage", async (data, acknowledge) => {
    try {
      const { sender_id, receiver_id, content } = data;
      if (sender_id !== authenticatedUserId) {
        return acknowledge?.({
          sendMessage: {
            success: false,
            message: "You are not valid user to send message",
          },
        });
      }
      const receiverSocket = userSocketIds.get(receiver_id);
      const message = await Message.create({
        sender_id,
        receiver_id,
        content,
        seen: receiverSocket ? "semiseen" : "unseen",
      });
      if (!receiverSocket) {
        await NotDelivered.create({
          sender_id,
          receiver_id,
          message_id: message._id,
        });
      }
      const populateMessage = await message.populate([
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
          extraData: {
            senderDetail: populateMessage.sender_id,
            receiverDetail: populateMessage.receiver_id,
          },
        },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("newMessage", {
            messageData,
            extraData: {
              senderDetail: populateMessage.sender_id,
              receiverDetail: populateMessage.receiver_id,
            },
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
