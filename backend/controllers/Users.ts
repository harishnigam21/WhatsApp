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
import Contacts from "../models/Contacts.js";
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
      fullPhone: phoneCode + phone,
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
    const userContacts = await Contacts.find({ userId: req.user?._id })
      .select("name email phoneCode phone pic banner fullPhone")
      .lean();
    const contactMap = new Map<string, (typeof userContacts)[number]>();
    const notMemberContactNumber = new Set<string>();

    for (let i = 0; i < userContacts.length; i++) {
      const contact = userContacts[i];
      if (contact.fullPhone) {
        contactMap.set(contact.fullPhone, contact);
        notMemberContactNumber.add(contact.fullPhone);
      }
    }

    const registeredUsers =
      notMemberContactNumber.size > 0
        ? await User.find({
            fullPhone: { $in: Array.from(notMemberContactNumber) },
          })
            .select("name pic fullPhone")
            .lean()
        : [];
    const memberContactNumber = new Set<string>();
    const members = [];

    for (let i = 0; i < registeredUsers.length; i++) {
      const appUser = registeredUsers[i];
      const phone = appUser.fullPhone;
      if (phone) {
        memberContactNumber.add(phone);
        notMemberContactNumber.delete(phone);
        const savedContact = contactMap.get(phone);
        members.push({
          _id: appUser._id,
          fullPhone: appUser.fullPhone,
          name: savedContact?.name || appUser.name,
          pic: appUser.pic || savedContact?.pic,
          member: true,
        });
      }
    }

    const notMembers = [];
    for (const phone of notMemberContactNumber) {
      const savedContact = contactMap.get(phone);
      if (savedContact) {
        notMembers.push({
          _id: savedContact._id,
          fullPhone: savedContact.fullPhone,
          name: savedContact?.name || savedContact.fullPhone,
          pic: savedContact.pic,
          member: false,
        });
      }
    }

    const sortedContacts = [...members, ...notMembers].sort((a, b) => {
      const nameA = a.name?.trim() || "";
      const nameB = b.name?.trim() || "";
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB);
    });
    return res.status(200).json(sortedContacts);
  } catch (error) {
    getServerError(res, error, "getContact Controller");
  }
};

export const getActiveContacts = async (req: AuthRequest, res: Response) => {
  type ContactType = {
    _id: string;
    name: string;
    pic: string | null;
    fullPhone: string;
    lastSeen?: Date;
  };

  type PopulatedUser = {
    _id: mongoose.Types.ObjectId;
    name: string;
    pic: string | null;
    fullPhone: string;
    lastSeen?: Date;
  };

  type ConversationData = {
    participants: (PopulatedUser | null)[];
    lastMessage: Map<string, IMessage> | Record<string, IMessage> | null;
    unreadCounts:
      | Map<string, mongoose.Types.ObjectId[]>
      | Record<string, mongoose.Types.ObjectId[]>;
    updatedAt: Date;
  };

  // Supports both Map and plain objects.
  const getMapValue = <T>(
    value: Map<string, T> | Record<string, T> | null | undefined,
    key: string,
  ): T | undefined => {
    if (!value) return undefined;

    return value instanceof Map ? value.get(key) : value[key];
  };

  // Get the appropriate last message for the current user.
  const getLastMessage = (
    lastMessages: ConversationData["lastMessage"],
    userId: mongoose.Types.ObjectId,
    updatedAt: Date,
  ) => {
    const message = getMapValue(lastMessages, userId.toString());

    const emptyMessage = {
      _id: `start chatting - ${userId}`,
      sender_id: "start chatting",
      receiver_id: "start chatting",
      content: "start chatting...",
      seen: "start chatting",
      attachments: [],
      deletedFor: true,
      createdAt: updatedAt,
    };

    if (!message || message.deletedForEveryone) {
      return emptyMessage;
    }

    const isInTrash = message.inTrash?.some((id) => id.equals(userId)) ?? false;

    if (isInTrash) {
      return emptyMessage;
    }

    const isDeletedFor =
      message.deletedFor?.some((id) => id.equals(userId)) ?? false;

    const { inTrash, deletedForEveryone, deletedFor, ...other } = message;

    if (isDeletedFor) {
      return {
        ...other,
        content: "This message was deleted",
        attachments: [],
        deletedFor: true,
      };
    }

    return {
      ...other,
      deletedFor: false,
    };
  };
  try {
    const userReq = req.user!;
    const userId = new mongoose.Types.ObjectId(userReq._id);
    const userIdString = userId.toString();

    // Fetch conversations.
    const conversations = (await Conversation.find({
      participants: userId,
    })
      .select("participants lastMessage unreadCounts updatedAt")
      .populate({
        path: "participants",
        match: { _id: { $ne: userId } },
        select: "_id name pic fullPhone lastSeen",
      })
      .populate({
        path: "lastMessage",
        select:
          "_id sender_id receiver_id content seen attachments inTrash deletedForEveryone deletedFor createdAt",
      })
      .sort({ updatedAt: -1 })
      .lean()) as unknown as ConversationData[];

    if (!conversations.length) {
      return res.status(200).json([]);
    }

    // Extract unique external contacts.
    const uniqueContacts = new Map<string, PopulatedUser>();

    for (const conversation of conversations) {
      const contact = conversation.participants[0];

      if (contact && !uniqueContacts.has(contact.fullPhone)) {
        uniqueContacts.set(contact.fullPhone, contact);
      }
    }

    // Fetch saved contacts.
    const savedContacts = await Contacts.find({
      fullPhone: { $in: [...uniqueContacts.keys()] },
      // Add your actual owner field here if Contacts are user-specific.
      // userId,
    })
      .select("name pic fullPhone")
      .lean();

    const savedContactsMap = new Map(
      savedContacts.map((contact) => [contact.fullPhone, contact]),
    );

    // Build final contact list.
    const result = new Map<string, object>();

    for (const conversation of conversations) {
      const populatedContact = conversation.participants[0];

      // Handle self-conversations.
      const isSelfConversation = !populatedContact;
      let contact: ContactType;

      if (isSelfConversation) {
        contact = {
          _id: userIdString,
          fullPhone: `${userReq.phoneCode + userReq.phone}`,
          lastSeen: userReq.lastSeen,
          name: `${userReq.phoneCode} ${userReq.phone} (You)`,
          pic: userReq.pic,
        };
      } else {
        const savedContact = savedContactsMap.get(populatedContact.fullPhone);
        contact = {
          _id: populatedContact._id.toString(),
          fullPhone: populatedContact.fullPhone,
          lastSeen: populatedContact.lastSeen,
          name: savedContact
            ? savedContact.name || populatedContact.fullPhone
            : populatedContact.fullPhone,
          pic: savedContact ? populatedContact.pic || null : null,
        };
      }
      // Prevent duplicate contacts.
      if (result.has(contact._id)) continue;

      // Saved contact name applies only to external contacts.
      if (!isSelfConversation) {
        const savedContact = savedContactsMap.get(contact.fullPhone);

        if (savedContact) {
          contact.name = savedContact.name || contact.fullPhone;
          contact.pic = populatedContact!.pic || null;
        }
      }

      // Get unread message count.
      const unreadCounts = getMapValue(conversation.unreadCounts, userIdString);

      const unread = unreadCounts?.length ?? 0;

      // Get last message.
      const lastMessage = getLastMessage(
        conversation.lastMessage,
        userId,
        conversation.updatedAt,
      );

      result.set(contact._id, {
        ...contact,
        unread,
        lastMessage,
      });
    }

    return res.status(200).json([...result.values()]);
  } catch (error) {
    return getServerError(res, error, "getActiveContacts Controller");
  }
};
