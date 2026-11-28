import vCard from "vcf";
import { parsePhoneNumberWithError, CountryCode } from "libphonenumber-js";
import cloudinary from "./cloudinary";

export interface ParsedContact {
  name: string;
  email: string;
  pic: string;
  phoneCode: string;
  phone: string;
  fullPhone: string;
}

export function parseVcfBuffer(
  fileBuffer: Buffer,
  defaultCountry: CountryCode = "IN",
): ParsedContact[] {
  try {
    const rawText = fileBuffer.toString("utf-8");
    const cards = vCard.parse(rawText);
    const contactMap = new Map<string, ParsedContact>();
    cards.forEach((card) => {
      // 1. Extract Name (FN first, fallback to structured N)
      const fnProp = card.get("fn");
      let name = fnProp ? String(fnProp.valueOf()).trim() : "";

      if (!name) {
        const nProp = card.get("n");
        if (nProp) {
          // N format: Last;First;Middle;Prefix;Suffix
          const parts = String(nProp.valueOf()).split(";");
          const [last = "", first = "", middle = ""] = parts;
          name = [first, middle, last].filter(Boolean).join(" ").trim();
        }
      }

      // 2. Extract Email (first if multiple)
      const emailProp = card.get("email");
      const firstEmail = Array.isArray(emailProp) ? emailProp[0] : emailProp;
      const email = firstEmail ? String(firstEmail.valueOf()).trim() : "";

      // 3. Extract Photo (Base64 Data URI or external URL)
      const photoProp = card.get("photo");
      const firstPhoto = Array.isArray(photoProp) ? photoProp[0] : photoProp;
      let pic = "";

      if (firstPhoto) {
        const val = String(firstPhoto.valueOf()).replace(/\s+/g, "").trim();
        if (val.startsWith("http") || val.startsWith("data:")) {
          pic = val;
        } else if (val) {
          const typeParam = (firstPhoto as any).type || "jpeg";
          const mime = String(typeParam).replace("image/", "").toLowerCase();
          pic = `data:image/${mime};base64,${val}`;
        }
      }

      // 4. Extract & Split Phone Code + Phone
      const telProp = card.get("tel");
      const firstTel = Array.isArray(telProp) ? telProp[0] : telProp;
      const rawTel = firstTel
        ? String(firstTel.valueOf()).replace(/^tel:/i, "").trim()
        : "";

      let phoneCode = "";
      let phone = "";

      if (rawTel) {
        try {
          const parsedNumber = parsePhoneNumberWithError(
            rawTel,
            defaultCountry,
          );
          phoneCode = `+${parsedNumber.countryCallingCode}`;
          phone = parsedNumber.nationalNumber;
        } catch {
          phone = rawTel.replace(/[^\d]/g, "");
        }
      }
      if (phone && phoneCode)
        contactMap.set(`${phoneCode}${phone}`, {
          name,
          email,
          pic,
          phoneCode,
          phone,
          fullPhone: phoneCode + phone,
        });
    });
    return Array.from(contactMap.values());
  } catch (error) {
    return [];
  }
}

export async function uploadBase64Image(
  dataUri: string,
  folder = `${process.env.ROOT}/contacts/pic`,
): Promise<string> {
  // If it's already an external URL or empty, return as-is
  if (!dataUri || !dataUri.startsWith("data:image/")) {
    return dataUri;
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    // resize contact avatars to save bandwidth & storage
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  });

  return result.secure_url;
}
