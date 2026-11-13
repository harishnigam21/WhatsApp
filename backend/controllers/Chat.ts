import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import Message from "../models/Message";
import User from "../models/User";
import { getServerError } from "../utils/serverError";
import { userSocketIds } from "../server";
import mongoose from "mongoose";

export const getChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    //TODO:Check for user in their contact
    const user = await User.findById(id)
      .select("name pic banner phone phoneCode bio lastSeen")
      .lean();
    if (!user) {
      return res.status(404).json({ message: "No such user found" });
    }
    const currentUserId = new mongoose.Types.ObjectId(req.user?._id);
    const targetId = new mongoose.Types.ObjectId(user._id);
    const messages = await Message.aggregate([
      {
        $match: {
          deletedForEveryone: false,
          inTrash: { $nin: [currentUserId] },
          $or: [
            { sender_id: currentUserId, receiver_id: targetId },
            { sender_id: targetId, receiver_id: currentUserId },
          ],
        },
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
    const status = userSocketIds.has(id);
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      pic: user.pic,
      banner: user.banner,
      phone: user.phone,
      phoneCode: user.phoneCode,
      bio: user.bio,
      lastSeen: user.lastSeen,
      messages,
      status,
    });
  } catch (error) {
    getServerError(res, error, "getChat");
  }
};
