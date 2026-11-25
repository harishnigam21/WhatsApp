import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import Message from "../models/Message";
import User from "../models/User";
import { getServerError } from "../utils/serverError";
import { userSocketIds } from "../server";
import mongoose from "mongoose";
import redisConnect from "../config/redis_connect";
import Contacts from "../models/Contacts";

export const getChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cursor, limit } = req.query as { cursor: string; limit: number };
    //TODO:Check for user in their contact
    const lm = limit ? limit : 20;
    let user = null;
    const getUser = await redisConnect.get(`WhatsAppUserInfo-${id}`);
    if (getUser) {
      user = JSON.parse(getUser);
    } else {
      const userDetail = await User.findById(id)
        .select("name pic banner phone phoneCode bio lastSeen")
        .lean();
      if (userDetail) {
        user = userDetail;
        await redisConnect.set(
          `WhatsAppUserInfo-${userDetail._id.toString()}`,
          JSON.stringify(userDetail),
          "EX",
          24 * 60 * 60,
        );
      }
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "No such user found", invite: true });
    }

    const currentUserId = new mongoose.Types.ObjectId(req.user?._id);
    const targetId = new mongoose.Types.ObjectId(user._id);
    const isInContact = await Contacts.findOne({
      userId: currentUserId,
      fullPhone: user.fullPhone,
    });
    const messages = await Message.aggregate([
      {
        $match: {
          ...(cursor && { createdAt: { $lte: new Date(cursor) } }),
          deletedForEveryone: false,
          inTrash: { $nin: [currentUserId] },
          $or: [
            { sender_id: currentUserId, receiver_id: targetId },
            { sender_id: targetId, receiver_id: currentUserId },
          ],
        },
      },

      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: lm + 1,
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $addFields: {
          isDeletedForMe: {
            $in: [currentUserId, { $ifNull: ["$deletedFor", []] }],
          },
        },
      },
      {
        $project: {
          sender_id: 1,
          receiver_id: 1,
          seen: 1,
          createdAt: 1,
          // Checks if currentUserId is inside the starred array
          starred: {
            $cond: {
              if: { $isArray: "$starred" },
              then: { $in: [currentUserId, "$starred"] },
              else: false,
            },
          },
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
          deletedFor: "$isDeletedForMe",
        },
      },
    ]);
    let nextCursor = null;
    if (messages.length > lm) {
      const temp = messages.shift();
      nextCursor = (temp.createdAt as Date).toISOString();
    }
    const status = userSocketIds.has(id);
    const data = cursor
      ? { messages, next: nextCursor }
      : {
          _id: user._id,
          name: isInContact ? isInContact.name : user.fullPhone,
          pic: isInContact ? user.pic : null,
          banner:isInContact ? user.banner : null,
          phone: user.phone,
          phoneCode: user.phoneCode,
          bio: user.bio,
          lastSeen: user.lastSeen,
          messages,
          next: nextCursor,
          status,
        };
    return res.status(200).json(data);
  } catch (error) {
    getServerError(res, error, "getChat");
  }
};
