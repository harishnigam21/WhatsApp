import { Server, Socket } from "socket.io";
import { userSocketIds } from "../../server";
import Message from "../../models/Message";
import Conversation from "../../models/Conversation";

export function seenAll(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("seenAll", async (data, acknowledge) => {
    try {
      const { sender_id } = data;
      const receiver_id = authenticatedUserId;
      const sortedParticipants = [
        sender_id.toString(),
        receiver_id.toString(),
      ].sort();
      await Promise.all([
        Message.updateMany(
          {
            sender_id,
            receiver_id,
            seen: { $ne: "seen" },
          },
          { $set: { seen: "seen" } },
        ),
        Conversation.findOneAndUpdate(
          { participants: sortedParticipants } as any,
          {
            $set: { [`unreadCounts.${receiver_id}`]: [] },
          },
        ),
      ]);
      const receiverSocket = userSocketIds.get(sender_id);

      acknowledge?.({
        seenAll: { success: true, allSeenOf: sender_id },
      });
      if (receiverSocket) {
        for (const socketId of receiverSocket) {
          io.to(socketId).emit("allSeen", {
            allSeenBy: receiver_id,
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
