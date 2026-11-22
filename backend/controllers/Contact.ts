import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { getServerError } from "../utils/serverError";
import Contacts from "../models/Contacts";
import User from "../models/User";

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, phoneCode } = req.body as {
      name?: string;
      phone?: string;
      phoneCode?: string;
    };

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Missing name" });
    }

    if (typeof phone !== "string" || typeof phoneCode !== "string") {
      return res.status(400).json({ message: "Invalid Phone Number" });
    }

    const phoneUp = phone.replace(/\D/g, "");
    const cleanCode = phoneCode.trim();
    const cleanName = name.trim();

    // Currently validating for India Only (+91 + 10 digits starting with 6-9)
    if (cleanCode !== "+91" || !/^[6-9]\d{9}$/.test(phoneUp)) {
      return res.status(400).json({ message: "Invalid Phone Number" });
    }
    const contactRegistered = await User.findOne({
      phone: phoneUp,
      phoneCode: cleanCode,
    })
      .select("name")
      .lean();
    const contact = await Contacts.findOneAndUpdate(
      {
        userId: req.user!._id,
        phone: phoneUp,
        phoneCode: cleanCode,
      },
      {
        $set: {
          name: cleanName,
          fullPhone: `${cleanCode}${phoneUp}`,
        },
        $setOnInsert: {
          userId: req.user!._id,
          phone: phoneUp,
          phoneCode: cleanCode,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return res.status(201).json({
      message: "Contact created",
      data: {
        _id: contact._id,
        name: contact.name,
        pic: contact.pic,
        member: contactRegistered ? true : false,
      },
    });
  } catch (error) {
    return getServerError(res, error, "createContact controller");
  }
};
