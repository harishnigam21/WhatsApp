import Message from "../models/Message";
import { AuthRequest } from "../types/AuthRequest";
import { Response } from "express";
import { getServerError } from "../utils/serverError";
import mongoose, { AnyBulkWriteOperation } from "mongoose";
import { io, userSocketIds } from "../server";

export const sendMsg = async (req: AuthRequest, res: Response) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || content) {
      return res.status(400).json({ message: "Invalid Message" });
    }
    const message = await Message.create({
      sender_id: req.user?._id,
      receiver_id,
      content,
    });
    return res.status(201).json({
      _id: message._id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      content: message.content,
      seen: message.seen,
      attachments: message.attachments,
    });
  } catch (error) {
    getServerError(res, error, "sendMsg Controller");
  }
};
export const startMsg = async (req: AuthRequest, res: Response) => {
  try {
    const msgId = req.params.id;
    const userId = req.user?._id;
    if (!msgId || !userId) return res.status(400).json({ status: false });
    const updateMsg = await Message.findOneAndUpdate(
      {
        _id: msgId,
        $or: [{ sender_id: userId }, { receiver_id: userId }],
      },
      { $addToSet: { starred: userId } },
      { new: true },
    );
    if (!updateMsg) {
      return res
        .status(400)
        .json({ message: "Invalid operation on message", status: false });
    }
    return res.status(200).json({ status: true });
  } catch (error) {
    getServerError(res, error, "startMsg");
  }
};
export const unStartMsg = async (req: AuthRequest, res: Response) => {
  try {
    const msgId = req.params.id;
    const userId = req.user?._id;
    if (!msgId || !userId) return res.status(400).json({ status: false });
    const updateMsg = await Message.findOneAndUpdate(
      {
        _id: msgId,
        $or: [{ sender_id: userId }, { receiver_id: userId }],
      },
      { $pull: { starred: userId } },
      { new: true },
    );
    if (!updateMsg) {
      return res
        .status(400)
        .json({ message: "Invalid operation on message", status: false });
    }
    return res.status(200).json({ status: true });
  } catch (error) {
    getServerError(res, error, "startMsg");
  }
};
export const deleteMsg = async (req: AuthRequest, res: Response) => {
  const msgIds = req.body.ids as string[];
  const userId = new mongoose.Types.ObjectId(req.user!._id);
  const objectIds = msgIds.map((id) => new mongoose.Types.ObjectId(id));
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const msgBulk: AnyBulkWriteOperation[] = [
      {
        updateMany: {
          filter: {
            _id: { $in: objectIds },
            deletedFor: { $in: [userId] },
            $or: [{ sender_id: userId }, { receiver_id: userId }],
          },
          update: {
            $addToSet: { inTrash: userId },
          },
        },
      },
      {
        updateMany: {
          filter: {
            _id: { $in: objectIds },
            seen: "seen",
            $or: [{ sender_id: userId }, { receiver_id: userId }],
          },
          update: {
            $addToSet: { deletedFor: userId, inTrash: userId },
          },
        },
      },
      {
        updateMany: {
          filter: {
            _id: { $in: objectIds },
            seen: "unseen",
            sender_id: userId,
          },
          update: [
            {
              $set: {
                deletedForEveryone: true,
                inTrash: {
                  $setUnion: [
                    { $ifNull: ["$inTrash", []] },
                    [userId, "$receiver_id"],
                  ],
                },
                deletedFor: {
                  $setUnion: [
                    { $ifNull: ["$deletedFor", []] },
                    [userId, "$receiver_id"],
                  ],
                },
              },
            },
          ],
        },
      },
      {
        updateMany: {
          filter: {
            _id: { $in: objectIds },
            seen: "semiseen",
            sender_id: userId,
          },
          update: [
            {
              $set: {
                deletedFor: {
                  $setUnion: [
                    { $ifNull: ["$deletedFor", []] },
                    [userId, "$receiver_id"],
                  ],
                },
              },
            },
          ],
        },
      },
    ];

    await Message.bulkWrite(msgBulk, { session });
    await session.commitTransaction();
    const updatedMsg = (await Message.aggregate([
      {
        $match: {
          _id: { $in: objectIds },
          $or: [{ sender_id: userId }, { receiver_id: userId }],
        },
      },
      {
        $addFields: {
          isDeletedForMe: {
            $in: [userId, { $ifNull: ["$deletedFor", []] }],
          },
          inTrash: {
            $in: [userId, { $ifNull: ["$inTrash", []] }],
          },
        },
      },
      {
        $project: {
          sender_id: 1,
          receiver_id: 1,
          deletedForEveryone: 1,
          deletedFor: "$isDeletedForMe",
          attachments: {
            $cond: {
              if: "$isDeletedForMe",
              then: [],
              else: "$attachments",
            },
          },
          content: {
            $cond: {
              if: "$isDeletedForMe",
              then: "This message was deleted",
              else: "$content",
            },
          },
          inTrash: "$inTrash",
          seen: 1,
        },
      },
    ])) as {
      _id: string;
      deletedForEveryone: boolean;
      deletedFor: boolean;
      inTrash: boolean;
      sender_id: string;
      receiver_id: string;
      content: string;
      attachments: any[];
      seen: "seen" | "unseen" | "semiseen";
    }[];
    let forDeletor: {
      _id: string;
      deletedForEveryone: boolean;
      deletedFor: boolean;
      inTrash: boolean;
      content: string;
      attachments: any[];
    }[] = [];
    let forOppostition: Record<string, string[]> = {};
    updatedMsg.forEach((item) => {
      forDeletor.push({
        _id: item._id,
        deletedForEveryone: item.deletedForEveryone,
        deletedFor: item.deletedFor,
        inTrash: item.inTrash,
        content: item.content,
        attachments: item.attachments,
      });
      if (item.sender_id == userId.toString() && item.seen !== "seen") {
        const checkOppo = forOppostition[item.receiver_id];
        if (checkOppo) {
          forOppostition[item.receiver_id] = [...checkOppo, item._id];
        } else {
          forOppostition[item.receiver_id] = [item._id];
        }
      }
    });
    const getKeys = Object.keys(forOppostition);
    if (getKeys.length !== 0) {
      getKeys.forEach((item) => {
        const online = userSocketIds.get(item);
        if (online) {
          online.forEach((skt) => {
            io.to(skt).emit("deleteMsgs", {
              ids: forOppostition[item],
              deletedBy: userId.toString(),
            });
          });
        }
      });
    }
    return res.status(200).json(forDeletor);
  } catch (error) {
    await session.abortTransaction();
    getServerError(res, error, "deleteMsg", "Failed to delete message");
  } finally {
    await session.endSession();
  }
};
