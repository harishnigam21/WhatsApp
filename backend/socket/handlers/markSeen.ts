import { Server, Socket } from "socket.io";
import { userSocketIds } from "../../server";
import Message from "../../models/Message";

export function markSeen(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("seen", async (data, acknowledge) => {
    try {
      const { sender_id, msg_id, receiver_id } = data;
      const message = await Message.findOneAndUpdate(
        {
          _id: msg_id,
          sender_id,
          receiver_id,
        },
        { $set: { seen: "seen" } },
        { returnDocument: "after" },
      );
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
