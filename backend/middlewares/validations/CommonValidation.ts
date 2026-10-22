import { Response } from "express";
import { envList } from "../../envConfig";
import { convertToByte } from "../../utils/byteConversion";

export const sendError = (error: string, res: Response) => {
  console.error(error);
  res.status(422).json({ message: error });
  return true;
};
export const validateInput = (
  type: string,
  value: any,
  valueType: string | null,
  res: Response,
) => {
  const patterns = {
    password:
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|~`-])[^\s]{8,}$/,
    name: /^[a-zA-Z][a-zA-Z\s\-']{1,50}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  };
  switch (type) {
    case "password":
      if (!value) return sendError("Password is required.", res);
      if (/\s/.test(value))
        return sendError("Password cannot contain spaces.", res);
      if (!/(?=.*[A-Z])/.test(value))
        return sendError("Password needs at least one capital letter.", res);
      if (!/(?=.*\d)/.test(value))
        return sendError("Password needs at least one number.", res);
      if (!/(?=.*[!@#$%^&*()_+])/.test(value))
        return sendError("Password needs at least one symbol.", res);
      if (value.length < 8)
        return sendError("Password must be at least 8 characters long.", res);
      break;

    case "email":
      if (!value) return sendError("Email is required.", res);
      if (!patterns.email.test(value))
        return sendError("Please enter a valid email address.", res);
      break;

    case "name":
      if (!value || value.trim().length < 2 || !patterns.name.test(value)) {
        return sendError(
          `Invalid Name : ${value ? value : "not provided"}`,
          res,
        );
      }
      break;
    case "image":
      const typeSize =
        valueType == "pic"
          ? envList.MAX_PIC_SIZE
          : valueType == "banner"
            ? envList.MAX_BANNER_SIZE
            : envList.MAX_PHOTO_SIZE;
      const maxSize: number = convertToByte(typeSize!);
      const base64Data = value.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const sizeInBytes = buffer.length;
      if (sizeInBytes > maxSize) {
        return sendError(`${valueType} is too large (Max ${typeSize})`, res);
      }

      const allowedTypes = envList.IMAGE_FORMAT_ALLOWED!.split(",");
      const mimeType = value.split(";")[0].split(":")[1]; // "image/jpeg"
      const extension = mimeType.split("/")[1]; // "jpeg"
      if (!allowedTypes.includes(extension)) {
        const types = allowedTypes.join(", ");
        return sendError(`Invalid format. Only ${types} are allowed.`, res);
      }
      break;
  }
  return false;
};
