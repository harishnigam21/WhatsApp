import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import Message from "../models/Message";
import User from "../models/User";
import { getServerError } from "../utils/serverError";
import { userSocketIds } from "../server";

export const getChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("name pic lastSeen").lean();
    if (!user) {
      return res.status(404).json({ message: "No such user found" });
    }
    const messages = await Message.find({
      $or: [
        {
          sender_id: req.user?._id,
          receiver_id: id,
        },
        {
          sender_id: id,
          receiver_id: req.user?._id,
        },
      ],
    })
      .select("sender_id receiver_id content attachments seen createdAt")
      .lean();
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
