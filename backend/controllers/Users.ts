import User from "../models/User.js";
import Message, { IMessage } from "../models/Message.js";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { AuthRequest } from "../types/AuthRequest.js";
import { getServerError } from "../utils/serverError.js";
import cloudinary from "../utils/cloudinary.js";
import { convertToDataUri } from "../utils/convertToDataUri.js";
import { eAxios } from "../utils/axios.js";
import { app } from "../utils/firebase.js";
import { getAuth } from "firebase-admin/auth";
import redisConnect from "../config/redis_connect.js";
import Conversation from "../models/Conversation.js";
interface RegistrationFiles {
  pic?: Express.Multer.File[];
  banner?: Express.Multer.File[];
}
export const newUser = async (req: Request, res: Response) => {
  try {
    const { token, name, email, bio, phone, phoneCode } = req.body;
    const files = req.files as unknown as RegistrationFiles;
    const pic = files?.pic?.[0] || null;
    const banner = files?.banner?.[0] || null;
    if (!token) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (!phone || !phoneCode) {
      return res
        .status(400)
        .json({ message: "Phone and Country code required" });
    }
    if (!name || !email) {
      return res.status(400).json({ message: "Both name and email requires" });
    }
    if (bio && bio.length > 120) {
      return res.status(400).json({ message: "Keep Bio within 120 letters" });
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid Email ID" });
    }

    const decoded = await getAuth(app).verifyIdToken(token);
    const uid = decoded.uid;
    const phoneNumber = decoded.phone_number;

    if (phoneNumber !== `${phoneCode + phone}`) {
      return res.status(404).json({
        message: "Try again with same mobile number",
      });
    }
    const ExistingUser = await User.findOne({
      $or: [{ fid: uid }, { phone, phoneCode }, { email }],
    });
    if (ExistingUser && ExistingUser.email == email) {
      return res.status(403).json({
        message:
          "Sorry, but this Email is Used by some other existing Account, Try with another Email",
      });
    }
    if (ExistingUser) {
      const continueLogin = await eAxios.post("api/auth/login", {
        token,
      });
      return res.status(continueLogin.status).json(continueLogin.data);
    }
    let picUrl = null;
    let bannerUrl = null;
    if (pic) {
      const uri = convertToDataUri(pic);
      const upload = await cloudinary.uploader.upload(uri, {
        folder: `${process.env.ROOT}/profile/${phoneCode + phone}/pic`,
      });
      picUrl = upload.secure_url;
    }
    if (banner) {
      const uri = convertToDataUri(banner);
      const upload = await cloudinary.uploader.upload(uri, {
        folder: `${process.env.ROOT}/profile/${phoneCode + phone}/banner`,
      });
      bannerUrl = upload.secure_url;
    }
    await User.create({
      fid: uid,
      name,
      email,
      bio,
      phone,
      phoneCode,
      pic: picUrl,
      banner: bannerUrl,
    });
    return res.status(201).json({ message: "Welcome!", tk: token });
  } catch (error) {
    getServerError(res, error, "newUser Controller", "Failed to Verify OTP");
  }
};
export const getUser = async (req: AuthRequest, res: Response) => {
  return res.status(200).json({ user: req.user });
};
export const getUserMeta = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const fromRedis = await redisConnect.get(`WhatsAppUserInfo-${id}`);
  let getUser: { phoneCode: string; phone: string } | null = null;
  if (fromRedis) {
    getUser = JSON.parse(fromRedis);
  } else {
    const UserData = await User.findById(id).lean();
    if (!UserData) {
      return res.redirect("/");
    }
    await redisConnect.set(
      `WhatsAppUserInfo-${UserData._id}`,
      JSON.stringify(UserData),
      "EX",
      7 * 24 * 60 * 60,
    );
    getUser = UserData;
  }
  return res.status(200).json({
    sender: `${req.user!.phoneCode + req.user!.phone}`,
    receiver: getUser ? `${getUser.phoneCode + getUser.phone}` : "unKnown",
  });
};
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({
      _id: {
        $ne: req.user?._id!,
      },
    })
      .select("__id name")
      .lean();
    console.log("Got all Users");
    return res.status(200).json({ message: "Got all Users", data: users });
  } catch (error) {
    console.error("Error from getAllUsers Controller : ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await User.find({ _id: { $ne: req.user?._id } })
      .select("name pic bio")
      .lean();
    return res.status(200).json(contacts);
  } catch (error) {
    getServerError(res, error, "getContact Controller");
  }
};

export const getActiveContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!._id);
    const list = await Conversation.find({ participants: userId })
      .populate({
        path: "participants",
        match: { _id: { $ne: userId } },
        select: "_id name pic lastSeen",
      })
      .populate(
        "lastMessage",
        "_id sender_id receiver_id content seen attachments deletedForEveryone deletedFor inTrash createdAt",
      )
      .sort({ updatedAt: -1 })
      .lean();
    const contactList = list.map((item) => {
      const lastMessage = item.lastMessage as unknown as Map<string, IMessage>;
      let updatedLastMessage = null;
      try {
        const particularUserLM = lastMessage.get(userId.toString());
        if (!particularUserLM) {
          throw new Error("no last message found");
        }
        const { inTrash, deletedForEveryone, deletedFor, ...other } =
          particularUserLM;
        const isInTrash = inTrash?.some((id) => id.equals(userId)) ?? false;

        if (particularUserLM && !deletedForEveryone && !isInTrash) {
          const isdeletedFor =
            deletedFor?.some((id) => id.equals(userId)) ?? false;
          if (isdeletedFor) {
            updatedLastMessage = {
              ...other,
              content: "This message was deleted",
              attachments: [],
              deletedFor: true,
            };
          } else {
            updatedLastMessage = { ...other, deletedFor: false };
          }
        } else {
          throw new Error("start new messaging");
        }
      } catch (error) {
        updatedLastMessage = {
          _id: `start chatting - ${userId}`,
          sender_id: "start chatting",
          receiver_id: "start chatting",
          content: "start chatting...",
          seen: "start chatting",
          attachments: [],
          deletedFor: true,
          createdAt: new Date(),
        };
      }

      const user = item.participants[0];
      const unread = item.unreadCounts[userId.toString()].length;
      return { ...user, unread, lastMessage: updatedLastMessage };
    });
    return res.status(200).json(contactList);
  } catch (error) {
    getServerError(res, error, "getActiveContacts Controller");
  }
};
