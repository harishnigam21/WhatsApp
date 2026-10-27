import { Server, Socket } from "socket.io";
import { userSocketIds } from "../../server";
import Message from "../../models/Message";

export function seenAll(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("seenAll", async (data, acknowledge) => {
    try {
      const { sender_id, receiver_id } = data;
      await Message.updateMany(
        {
          sender_id: receiver_id,
          receiver_id: sender_id,
          seen: { $ne: "seen" },
        },
        { $set: { seen: "seen" } },
      );
      const receiverSocket = userSocketIds.get(receiver_id);

      acknowledge?.({
        seenAll: { success: true, allSeenOf: receiver_id },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("allSeen", {
            allSeenBy: sender_id,
          });
        }
      }
    } catch (error) {
      return acknowledge?.({
        seenAll: {
          success: false,
          message: "Failed to mark seen",
        },
      });
    }
  });
}
