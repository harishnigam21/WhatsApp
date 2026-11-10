import Message from "../models/Message";
import { AuthRequest } from "../types/AuthRequest";
import { Response } from "express";
import { getServerError } from "../utils/serverError";

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
