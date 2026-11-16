import { Server, Socket } from "socket.io";
import { userSocketIds } from "../../server";
import Message from "../../models/Message";
import Conversation from "../../models/Conversation";

export function markSeen(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("seen", async (data, acknowledge) => {
    try {
      const { msg_id, sender_id } = data;
      const receiver_id = authenticatedUserId;
      const sortedParticipants = [
        sender_id.toString(),
        receiver_id.toString(),
      ].sort();
      const [message] = await Promise.all([
        Message.findOneAndUpdate(
          {
            _id: msg_id,
            sender_id,
            receiver_id,
          },
          { $set: { seen: "seen" } },
          { returnDocument: "after" },
        ),
        Conversation.findOneAndUpdate(
          {
            participants: sortedParticipants,
            [`unreadCounts.${receiver_id}`]: { $gt: 0 },
          },
          {
            $inc: { [`unreadCounts.${receiver_id}`]: -1 },
          },
        ),
      ]);
      const senderSocket = userSocketIds.get(sender_id);
      if (!message) throw new Error("No message found");
      acknowledge?.({
        seen: { msg_id, success: true },
      });
      if (senderSocket) {
        for (const socketId of senderSocket) {
          io.to(socketId).emit("seenDone", {
            msg_id: message._id,
            receiver_id: message?.receiver_id,
            lastSeen: message?.updatedAt,
          });
        }
      }
    } catch (error) {
      return acknowledge?.({
        seen: {
          success: false,
          message: "Failed to mark seen",
        },
      });
    }
  });
}
