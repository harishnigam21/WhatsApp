import { Request, Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { getServerError } from "../utils/serverError";
import Contacts from "../models/Contacts";
import User from "../models/User";
import { parseVcfBuffer, uploadBase64Image } from "../utils/parseVcfBuffer";
import crypto from "crypto";
import ContactSyncSession from "../models/ContactSyncSession";
import { io, userSocketIds } from "../server";

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
      .select("name pic")
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
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      },
    );

    return res.status(201).json({
      message: "Contact created",
      data: {
        _id: contactRegistered ? contactRegistered._id : contact._id,
        name: contact.name,
        pic: contactRegistered ? contactRegistered.pic : contact.pic,
        fullPhone: contact.fullPhone,
        member: contactRegistered ? true : false,
      },
    });
  } catch (error) {
    return getServerError(res, error, "createContact controller");
  }
};

async function uploadInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

export const importContact = async (req: AuthRequest, res: Response) => {
  try {
    const vcf = req.file as Express.Multer.File;
    if (!vcf || vcf.size > 5_000_000) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid File or Size" });
    }

    const parsedContacts = parseVcfBuffer(vcf.buffer, "IN");
    if (!parsedContacts.length) {
      return res.status(200).json([]);
    }
    const phoneNumberList = parsedContacts.map((c) => c.fullPhone);

    const [existingContacts, registeredUsers] = await Promise.all([
      Contacts.find({
        userId: req.user!._id,
        fullPhone: { $in: phoneNumberList },
      })
        .select("_id fullPhone pic")
        .lean(),
      User.find({
        fullPhone: { $in: phoneNumberList },
      })
        .select("_id name pic fullPhone")
        .lean(),
    ]);

    const existingContactMap = new Map(
      existingContacts.map((c) => [c.fullPhone, c]),
    );

    // Upload new base64 pics in batches of 10
    const contactsWithCloudPics = await uploadInBatches(
      parsedContacts,
      10,
      async (contact) => {
        let picUrl = existingContactMap.get(contact.fullPhone)?.pic || "";

        if (!picUrl && contact.pic?.startsWith("data:image/")) {
          try {
            picUrl = await uploadBase64Image(contact.pic);
          } catch (err) {
            console.error(`Cloudinary upload failed for ${contact.name}:`, err);
          }
        }

        return { ...contact, pic: picUrl };
      },
    );

    const bulkOps = contactsWithCloudPics.map((contact) => ({
      updateOne: {
        filter: {
          userId: req.user!._id,
          fullPhone: contact.fullPhone,
        },
        update: {
          $set: {
            name: contact.name,
            phone: contact.phone,
            phoneCode: contact.phoneCode,
            ...(contact.pic && { pic: contact.pic }),
          },
        },
        upsert: true,
      },
    }));

    const bulkResult = await Contacts.bulkWrite(bulkOps);

    const userMap = new Map(registeredUsers.map((u) => [u.fullPhone, u]));
    const members = [];
    const notMembers = [];

    for (let i = 0; i < contactsWithCloudPics.length; i++) {
      const contact = contactsWithCloudPics[i];
      const appUser = userMap.get(contact.fullPhone);

      if (appUser) {
        members.push({
          _id: appUser._id,
          name: contact.name || appUser.name,
          pic: appUser.pic || contact.pic,
          fullPhone: appUser.fullPhone || contact.fullPhone,
          member: true,
        });
      } else {
        const contactId =
          existingContactMap.get(contact.fullPhone)?._id ||
          bulkResult.upsertedIds[i];

        notMembers.push({
          _id: contactId,
          name: contact.name || contact.fullPhone,
          pic: contact.pic,
          fullPhone: contact.fullPhone,
          member: false,
        });
      }
    }

    return res.status(201).json([...members, ...notMembers]);
  } catch (error) {
    getServerError(res, error, "importContact Controller");
  }
};

export const generateContactSyncSession = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // Get authenticated user's ID
    const userId = req.user!._id;

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash token before storing it
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Session expires after 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Construct mobile synchronization URL
    const frontendURL = process.env.FRONTEND_HOST;
    if (!frontendURL) {
      throw new Error("FRONTEND_URL is not configured");
    }

    // Create session
    const session = await ContactSyncSession.findOneAndUpdate(
      { userId },
      {
        $set: {
          tokenHash,
          expiresAt,
          status: "pending",
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    const syncURL = new URL(`/contacts/sync/${token}`, frontendURL).toString();

    return res.status(201).json({
      success: true,
      message: "Contact sync session created",
      data: {
        sessionId: session._id,
        syncURL,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Generate Contact Sync Session:", error);
    getServerError(
      res,
      error,
      "generateContactSyncSession Controller",
      "Failed to generate contact sync session",
    );
  }
};

export const validateContactSyncSession = async (
  req: Request,
  res: Response,
) => {
  interface DeviceMetadata {
    thumbmark: string;
    model: string | null;
    platform: string | null;
    isMobile: boolean;
    brands: {
      browser: string;
      version: string;
    };
    timezone: string;
  }

  try {
    const { token } = req.params as { token: string };

    const { deviceMetaData } = req.body as {
      deviceMetaData: DeviceMetadata;
    };

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    if (
      !deviceMetaData?.thumbmark ||
      typeof deviceMetaData.thumbmark !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid device metadata",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    // First try to claim the pending session.
    const session = await ContactSyncSession.findOneAndUpdate(
      {
        tokenHash,
        expiresAt: { $gt: now },
        status: "pending",
      },
      {
        $set: {
          status: "scanning",
          deviceActive: deviceMetaData,
        },
      },
      {
        returnDocument: "after",
      },
    ).select("_id userId status expiresAt deviceActive");

    if (session) {
      const QRwindow = userSocketIds.get(session.userId.toString());
      if (QRwindow) {
        QRwindow.forEach((skt) => {
          io.to(skt).emit("QRparticipants", {
            deviceActive: session.deviceActive,
          });
        });
      }
      return res.status(200).json({
        success: true,
        message: "QR session verified",
        data: {
          sessionId: session._id,
          expiresAt: session.expiresAt,
        },
      });
    }

    // If it wasn't pending, check whether the same device
    // has already claimed this session.
    const existingSession = await ContactSyncSession.findOne({
      tokenHash,
      expiresAt: { $gt: now },
      status: "scanning",
      "deviceActive.thumbmark": deviceMetaData.thumbmark,
    }).select("_id status expiresAt");

    if (!existingSession) {
      return res.status(400).json({
        success: false,
        message:
          "QR code is invalid, expired, or already used by another device.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "QR session already verified on this device",
      data: {
        sessionId: existingSession._id,
        expiresAt: existingSession.expiresAt,
      },
    });
  } catch (error) {
    getServerError(
      res,
      error,
      "validateContactSyncSession Controller",
      "Failed to validate QR session",
    );
  }
};

export const abortContactSyncSession = async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    const { thumbmark } = req.body as { thumbmark: string };
    if (!token || !/^[a-f0-9]{64}$/i.test(token) || !thumbmark) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code",
      });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const session = await ContactSyncSession.findOneAndUpdate(
      {
        tokenHash,
        expiresAt: { $gt: now },
        status: { $in: ["pending", "scanning"] },
        "deviceActive.thumbmark": thumbmark,
      },
      {
        $set: {
          status: "pending",
          deviceActive: {},
        },
      },
      {
        returnDocument: "after",
      },
    );
    if (session) {
      const QRwindow = userSocketIds.get(session.userId.toString());
      if (QRwindow) {
        QRwindow.forEach((skt) => {
          io.to(skt).emit("removeQRparticipants", {
            thumbmark,
          });
        });
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    getServerError(
      res,
      error,
      "abortContactSyncSession Controller",
      "Failed to abort QR session",
    );
  }
};

export const uploadSyncContact = async (req: Request, res: Response) => {
  try {
    const vcf = req.file as Express.Multer.File;
    const { token } = req.params as { token: string };
    const { thumbmark } = req.body as { thumbmark: string };
    if (!vcf || vcf.size > 5_000_000) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid File or Size" });
    }
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Sync, Try again" });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const session = await ContactSyncSession.findOne({
      tokenHash,
      expiresAt: { $gt: now },
      status: "scanning",
      "deviceActive.thumbmark": thumbmark,
    })
      .select("_id userId")
      .lean();
    if (!session) {
      return res.status(400).json({
        success: false,
        message:
          "QR code is invalid, expired, or already used by another device.",
      });
    }
    const parsedContacts = parseVcfBuffer(vcf.buffer, "IN");
    if (!parsedContacts.length) {
      return res.status(400).json({
        success: false,
        message: "No Contacts Selected",
      });
    }
    const phoneNumberList = parsedContacts.map((c) => c.fullPhone);

    const [existingContacts, registeredUsers] = await Promise.all([
      Contacts.find({
        userId: session.userId,
        fullPhone: { $in: phoneNumberList },
      })
        .select("_id fullPhone pic")
        .lean(),
      User.find({
        fullPhone: { $in: phoneNumberList },
      })
        .select("_id name pic fullPhone")
        .lean(),
    ]);

    const existingContactMap = new Map(
      existingContacts.map((c) => [c.fullPhone, c]),
    );

    // Upload new base64 pics in batches of 10
    const contactsWithCloudPics = await uploadInBatches(
      parsedContacts,
      10,
      async (contact) => {
        let picUrl = existingContactMap.get(contact.fullPhone)?.pic || "";

        if (!picUrl && contact.pic?.startsWith("data:image/")) {
          try {
            picUrl = await uploadBase64Image(contact.pic);
          } catch (err) {
            console.error(`Cloudinary upload failed for ${contact.name}:`, err);
          }
        }

        return { ...contact, pic: picUrl };
      },
    );

    const bulkOps = contactsWithCloudPics.map((contact) => ({
      updateOne: {
        filter: {
          userId: session.userId,
          fullPhone: contact.fullPhone,
        },
        update: {
          $set: {
            name: contact.name,
            phone: contact.phone,
            phoneCode: contact.phoneCode,
            ...(contact.pic && { pic: contact.pic }),
          },
        },
        upsert: true,
      },
    }));

    const bulkResult = await Contacts.bulkWrite(bulkOps);

    const userMap = new Map(registeredUsers.map((u) => [u.fullPhone, u]));
    const members: {
      _id: string;
      name: string;
      pic: string | null;
      member: boolean;
      fullPhone: string;
    }[] = [];
    const notMembers: {
      _id: string;
      name: string;
      pic: string | null;
      member: boolean;
      fullPhone: string;
    }[] = [];

    for (let i = 0; i < contactsWithCloudPics.length; i++) {
      const contact = contactsWithCloudPics[i];
      const appUser = userMap.get(contact.fullPhone);

      if (appUser) {
        members.push({
          _id: appUser._id.toString(),
          name: contact.name || appUser.name,
          pic: appUser.pic || contact.pic,
          fullPhone: appUser.fullPhone || contact.fullPhone,
          member: true,
        });
      } else {
        const contactId =
          existingContactMap.get(contact.fullPhone)?._id ||
          bulkResult.upsertedIds[i];

        notMembers.push({
          _id: contactId.toString(),
          name: contact.name || contact.fullPhone,
          pic: contact.pic,
          member: false,
          fullPhone: contact.fullPhone,
        });
      }
    }
    await ContactSyncSession.updateOne(
      {
        _id: session._id,
        status: "scanning",
      },
      {
        $set: { status: "completed" },
      },
    );
    const QRwindow = userSocketIds.get(session.userId.toString());
    if (QRwindow) {
      QRwindow.forEach((skt) => {
        io.to(skt).emit("addSyncContact", {
          contact: [...members, ...notMembers],
          closeSession: true,
        });
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Successfully contact sync done." });
  } catch (error) {
    getServerError(res, error, "uploadSyncContact Controller");
  }
};
