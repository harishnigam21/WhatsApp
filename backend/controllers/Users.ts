import User from "../models/User.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { AuthRequest } from "../types/AuthRequest.js";
import { getServerError } from "../utils/serverError.js";
import cloudinary from "../utils/cloudinary.js";
import { convertToDataUri } from "../utils/convertToDataUri.js";
import { eAxios } from "../utils/axios.js";
interface RegistrationFiles {
  pic?: Express.Multer.File[];
  banner?: Express.Multer.File[];
}
export const newUser = async (req: Request, res: Response) => {
  try {
    const { name, email, bio, phone, phoneCode } = req.body;
    const files = req.files as unknown as RegistrationFiles;
    const pic = files?.pic?.[0] || null;
    const banner = files?.banner?.[0] || null;
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

    const ExistingUser = await User.findOne({
      $or: [{ phone, phoneCode }, { email }],
    });
    if (ExistingUser && ExistingUser.email == email) {
      return res.status(403).json({
        message:
          "Sorry, but this Email is Used by some other existing Account.",
      });
    }
    if (ExistingUser) {
      return res.status(403).json({
        message: "Account already Exist, Try with different mobile number",
      });
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
      name,
      email,
      bio,
      phone,
      phoneCode,
      pic: picUrl,
      banner: bannerUrl,
    });

    const continueLogin = await eAxios.post("api/auth/send-otp", {
      phone,
      phoneCode,
    });
    return res.status(continueLogin.status).json(continueLogin.data);
  } catch (error) {
    getServerError(res, error, "newUser Controller");
  }
};
export const getUser = async (req: AuthRequest, res: Response) => {
  return res.status(200).json({ user: req.user });
};
export const getUserMeta = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const getUser = await User.findById(id).select("phone phoneCode").lean();
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
    const contactList = await Message.aggregate([
      // 1. Find only messages involving the current user
      {
        $match: {
          $or: [
            { sender_id: new mongoose.Types.ObjectId(req.user?._id) },
            { receiver_id: new mongoose.Types.ObjectId(req.user?._id) },
          ],
        },
      },
      // 2. Sort by newest first
      { $sort: { createdAt: -1 } },
      // 3. Create a unique room/conversation string key between the two users
      {
        $addFields: {
          conversationWith: {
            $cond: {
              if: {
                $eq: ["$sender_id", new mongoose.Types.ObjectId(req.user?._id)],
              },
              then: "$receiver_id",
              else: "$sender_id",
            },
          },
        },
      },
      // 4. Exclude self-chats
      {
        $match: {
          conversationWith: { $ne: new mongoose.Types.ObjectId(req.user?._id) },
        },
      },
      // 5. Group by the contact person and grab the first (newest) message document
      {
        $group: {
          _id: "$conversationWith",
          lastMessage: { $first: "$$ROOT" },
          unread: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: [
                        "$receiver_id",
                        new mongoose.Types.ObjectId(req.user?._id),
                      ],
                    },
                    { $ne: ["$seen", "seen"] },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      // 6. Look up the contact's user profile data from the users collection
      {
        $lookup: {
          from: "users", // Make sure this matches your MongoDB users collection name
          localField: "_id",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      // 7. Format the output to look exactly like your required object structure
      {
        $project: {
          _id: "$profile._id",
          name: "$profile.name",
          pic: "$profile.pic",
          lastSeen: "$profile.lastSeen",
          unread: "$unread",
          lastMessage: {
            _id: "$lastMessage._id",
            sender_id: "$lastMessage.sender_id",
            receiver_id: "$lastMessage.receiver_id",
            content: "$lastMessage.content",
            seen: "$lastMessage.seen",
            attachments: "$lastMessage.attachments",
            createdAt: "$lastMessage.createdAt",
          },
        },
      },
      // 8. Sort the final contact list by the latest message time
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);
    return res.status(200).json(contactList);
  } catch (error) {
    getServerError(res, error, "getActiveContacts Controller");
  }
};
