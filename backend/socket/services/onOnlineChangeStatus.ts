import { Server } from "socket.io";
import Message from "../../models/Message";
import NotDelivered from "../../models/NotDelivered";
import { userSocketIds } from "../../server";

export const onOnlineChangeStatus = async (userId: string, io: Server) => {
  try {
    const notDeliveredMessages = await NotDelivered.find({
      receiver_id: userId,
    }).lean();
    if (notDeliveredMessages) {
      const messageIds = notDeliveredMessages.map((item) => item.message_id);
      await Message.updateMany(
        {
          _id: { $in: messageIds },
        },
        {
          $set: {
            seen: "semiseen",
          },
        },
      );
      const structureMessage = notDeliveredMessages.reduce(
        (acc, item) => {
          const id = item.sender_id.toString();
          const message_id = item.message_id.toString();
          if (acc[id]) {
            acc[id] = [...acc[id], message_id];
          } else {
            acc[id] = [message_id];
          }
          return acc;
        },
        {} as Record<string, string[]>,
      );
      Object.entries(structureMessage).forEach(([sender_id, messageIds]) => {
        const socketExist = userSocketIds.get(sender_id);
        if (socketExist) {
          for (const socketId of socketExist) {
            io.to(socketId).emit("semiSeenDone", {
              messageIds,
              receiver_id: userId,
            });
          }
        }
      });
      await NotDelivered.deleteMany({ receiver_id: userId });
    }
  } catch (error) {
    console.error(error);
  }
};
