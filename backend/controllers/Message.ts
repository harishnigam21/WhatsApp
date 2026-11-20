import Message from "../models/Message";
import { AuthRequest } from "../types/AuthRequest";
import { Response } from "express";
import { getServerError } from "../utils/serverError";
import mongoose, { AnyBulkWriteOperation } from "mongoose";
import { io, userSocketIds } from "../server";
import Conversation from "../models/Conversation";

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
}; //not using this, currently using socket to handle send message
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
  const selectedContact = req.params.id as string;
  const msgIds = req.body.ids as string[];
  const userId = new mongoose.Types.ObjectId(req.user!._id);
  const scId = new mongoose.Types.ObjectId(selectedContact);
  const userKey = userId.toString();
  const scKey = scId.toString();
  const objectIds = msgIds.map((id) => new mongoose.Types.ObjectId(id));
  const session = await mongoose.startSession();
  try {
    let forDeletor: {
      _id: string;
      deletedForEveryone: boolean;
      deletedFor: boolean;
      inTrash: boolean;
      content: string;
      attachments: any[];
    }[] = [];
    let forOppostition: Record<string, string[]> = {};

    await session.withTransaction(async () => {
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
      const [messagesAgg] = await Message.aggregate([
        {
          $facet: {
            updatedMsg: [
              {
                $match: {
                  _id: { $in: objectIds },
                  $or: [
                    { sender_id: userId, receiver_id: scId },
                    { receiver_id: userId, sender_id: scId },
                  ],
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
            ],
            lastMsgA: [
              {
                $match: {
                  $or: [
                    { sender_id: userId, receiver_id: scId },
                    { receiver_id: userId, sender_id: scId },
                  ],
                  inTrash: { $ne: userId },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  sender_id: 1,
                  receiver_id: 1,
                },
              },
            ],
            lastMsgB: [
              {
                $match: {
                  $or: [
                    { sender_id: userId, receiver_id: scId },
                    { receiver_id: userId, sender_id: scId },
                  ],
                  inTrash: { $ne: scId },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 1,
                  sender_id: 1,
                  receiver_id: 1,
                },
              },
            ],
          },
        },
      ]).session(session);
      const updatedMsg = messagesAgg.updatedMsg as {
        _id: mongoose.Types.ObjectId;
        deletedForEveryone: boolean;
        deletedFor: boolean;
        inTrash: boolean;
        sender_id: string;
        receiver_id: string;
        content: string;
        attachments: any[];
        seen: "seen" | "unseen" | "semiseen";
      }[];
      const filterUnseenIds = updatedMsg
        .filter((item) => item.seen === "unseen")
        .map((item) => new mongoose.Types.ObjectId(item._id));
      const lastMsgA = messagesAgg.lastMsgA[0] as {
        _id: mongoose.Types.ObjectId;
        receiver_id: string;
        sender_id: string;
      };
      const lastMsgB = messagesAgg.lastMsgB[0] as {
        _id: mongoose.Types.ObjectId;
        receiver_id: string;
        sender_id: string;
      };

      const sortedParticipants: any[] = [userKey, scKey].sort();
      await Conversation.findOneAndUpdate(
        { participants: sortedParticipants },
        {
          $set: {
            ...(lastMsgA && { [`lastMessage.${userKey}`]: lastMsgA._id }),
            ...(lastMsgB && { [`lastMessage.${scKey}`]: lastMsgB._id }),
          },
          ...(filterUnseenIds.length > 0 && {
            $pull: {
              [`unreadCounts.${scKey}`]: { $in: filterUnseenIds },
              [`unreadCounts.${userKey}`]: { $in: filterUnseenIds },
            },
          }),
        },
      ).session(session);

      updatedMsg.forEach((item) => {
        forDeletor.push({
          _id: item._id.toString(),
          deletedForEveryone: item.deletedForEveryone,
          deletedFor: item.deletedFor,
          inTrash: item.inTrash,
          content: item.content,
          attachments: item.attachments,
        });
        if (item.sender_id == userKey && item.seen !== "seen") {
          const checkOppo = forOppostition[item.receiver_id];
          if (checkOppo) {
            forOppostition[item.receiver_id] = [
              ...checkOppo,
              item._id.toString(),
            ];
          } else {
            forOppostition[item.receiver_id] = [item._id.toString()];
          }
        }
      });
    });
    const getKeys = Object.keys(forOppostition);
    if (getKeys.length > 0) {
      getKeys.forEach((item) => {
        const online = userSocketIds.get(item);
        if (online) {
          online.forEach((skt) => {
            io.to(skt).emit("deleteMsgs", {
              ids: forOppostition[item],
              deletedBy: userKey,
            });
          });
        }
      });
    }

    return res.status(200).json(forDeletor);
  } catch (error) {
    getServerError(res, error, "deleteMsg", "Failed to delete message");
  }
};
