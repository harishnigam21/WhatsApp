import { Server, Socket } from "socket.io";
import { userSocketIds } from "../../server";
import Message from "../../models/Message";
import Conversation from "../../models/Conversation";
import mongoose from "mongoose";

export function seenAll(io: Server, socket: Socket) {
  const authenticatedUserId = socket.data.userId as string | undefined;
  if (!authenticatedUserId) {
    throw new Error("Unauthenticated socket connection");
  }
  socket.on("seenAll", async (data, acknowledge) => {
    const session = await mongoose.startSession();
    try {
      const { sender_id } = data;
      const receiver_id = authenticatedUserId;
      const sortedParticipants = [
        sender_id.toString(),
        receiver_id.toString(),
      ].sort();
      await session.withTransaction(async () => {
        const conversation = await Conversation.findOneAndUpdate(
          { participants: sortedParticipants },
          {
            $set: {
              [`unreadCounts.${receiver_id}`]: [],
            },
          },
          {
            returnDocument: "before",
            session,
          },
        ).select({
          [`unreadCounts.${receiver_id}`]: 1,
        });

        const unreadIds = conversation?.unreadCounts?.get(receiver_id) ?? [];

        if (unreadIds.length > 0) {
          await Message.updateMany(
            {
              _id: { $in: unreadIds },
              receiver_id,
              seen: { $ne: "seen" },
            },
            {
              $set: { seen: "seen" },
            },
            { session },
          );
        }
      });

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
