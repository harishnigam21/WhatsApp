import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { getServerError } from "../utils/serverError";
import Contacts from "../models/Contacts";
import User from "../models/User";
import { parseVcfBuffer, uploadBase64Image } from "../utils/parseVcfBuffer";

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
        pic: contact.pic,
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
          member: false,
        });
      }
    }

    return res.status(201).json([...members, ...notMembers]);
  } catch (error) {
    getServerError(res, error, "importContact Controller");
  }
};
