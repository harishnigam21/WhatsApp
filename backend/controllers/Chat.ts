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
    const user = await User.findById(id).select("name pic lastSeen").lean();
    if (!user) {
      return res.status(404).json({ message: "No such user found" });
    }
    const currentUserId = new mongoose.Types.ObjectId(req.user?._id);
    const targetId = new mongoose.Types.ObjectId(user._id);
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender_id: currentUserId, receiver_id: targetId },
            { sender_id: targetId, receiver_id: currentUserId },
          ],
        },
      },
      {
        $project: {
          sender_id: 1,
          receiver_id: 1,
          content: 1,
          attachments: 1,
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
        },
      },
    ]);
    const status = userSocketIds.has(id);
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      pic: user.pic,
      lastSeen: user.lastSeen,
      messages,
      status,
    });
  } catch (error) {
    getServerError(res, error, "getChat");
  }
};
