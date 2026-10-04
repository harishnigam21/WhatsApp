import toast from "react-hot-toast";
import { envList } from "../../envConfig";
import { convertToByte } from "./byteConversion";

export const sendError = (error) => {
  toast.error(error);
  return true;
};
export const validateInput = (type, value, valueType) => {
  const patterns = {
    password:
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|~`-])[^\s]{8,}$/,
    name: /^[a-zA-Z][a-zA-Z\s\-']{1,50}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  };
  switch (type) {
    case "password":
      if (!value) return sendError("Password is required.");
      if (/\s/.test(value)) return sendError("Password cannot contain spaces.");
      if (!/(?=.*[A-Z])/.test(value))
        return sendError("Password needs at least one capital letter.");
      if (!/(?=.*\d)/.test(value))
        return sendError("Password needs at least one number.");
      if (!/(?=.*[!@#$%^&*()_+])/.test(value))
        return sendError("Password needs at least one symbol.");
      if (value.length < 8)
        return sendError("Password must be at least 8 characters long.");
      break;

    case "email":
      if (!value) return sendError("Email is required.");
      if (!patterns.email.test(value))
        return sendError("Please enter a valid email addreds.");
      break;

    case "name":
      if (!value || value.trim().length < 2 || !patterns.name.test(value)) {
        return sendError(`Invalid --> ${value ? value : "name not provided"}`);
      }
      break;

    case "image":
      const imageTypeSize =
        valueType == "pic"
          ? envList.MAX_PIC_SIZE
          : valueType == "banner"
            ? envList.MAX_BANNER_SIZE
            : envList.MAX_PHOTO_SIZE;
      const imageMaxSize = convertToByte(imageTypeSize);
      const imageSizeInBytes = value.size;
      if (imageSizeInBytes > imageMaxSize) {
        return sendError(
          `Image:${value.name} is too large (Max ${imageTypeSize})`,
        );
      }

      const imageAllowedTypes = envList.IMAGE_FORMAT_ALLOWED.split(",");
      const imageExtension = value.type.split("/")[1]; // "jpeg"
      if (!imageAllowedTypes.includes(imageExtension)) {
        const types = imageAllowedTypes.join(", ");
        return sendError(
          `Invalid format. For Image only ${types} are allowed.`,
        );
      }
      break;

    case "application":
      const documentTypeSize = envList.DOCUMENT_SIZE;
      const documentMaxSize = convertToByte(documentTypeSize);
      const documentSizeInBytes = value.size;
      if (documentSizeInBytes > documentMaxSize) {
        return sendError(
          `Document:${value.name} is too large (Max ${documentTypeSize})`,
        );
      }

      const documentAllowedTypes = envList.DOCUMENT_FORMAT_ALLOWED.split(",");
      const documentExtension = value.type.split("/")[1];
      const wrapExtension = (ext) => {
        if (ext.includes("pdf")) {
          return "pdf";
        }
        if (ext.includes("word")) {
          return "word";
        }
        if (ext.includes("excel")) {
          return "excel";
        }
      };
      if (!documentAllowedTypes.includes(wrapExtension(documentExtension))) {
        const types = documentAllowedTypes.join(", ");
        return sendError(
          `Invalid format. For Document only ${types} are allowed.`,
        );
      }
      break;

    case "video":
      const videoTypeSize = envList.VIDEO_SIZE;
      const videoMaxSize = convertToByte(videoTypeSize);
      const videoSizeInBytes = value.size;
      if (videoSizeInBytes > videoMaxSize) {
        return sendError(
          `Video:${value.name} is too large (Max ${videoTypeSize})`,
        );
      }

      const videoAllowedTypes = envList.VIDEO_FORMAT_ALLOWED.split(",");
      const videoExtension = value.type.split("/")[1];
      if (!videoAllowedTypes.includes(videoExtension)) {
        const types = videoAllowedTypes.join(", ");
        return sendError(
          `Invalid format. For Video only ${types} are allowed.`,
        );
      }
      break;
    case "audio":
      const audioTypeSize = envList.AUDIO_SIZE;
      const audioMaxSize = convertToByte(audioTypeSize);
      const audioSizeInBytes = value.size;
      if (audioSizeInBytes > audioMaxSize) {
        return sendError(
          `Audio:${value.name} is too large (Max ${audioTypeSize})`,
        );
      }

      const audioAllowedTypes = envList.AUDIO_FORMAT_ALLOWED.split(",");
      const audioExtension = value.type.split("/")[1];
      if (!audioAllowedTypes.includes(audioExtension)) {
        const types = audioAllowedTypes.join(", ");
        return sendError(
          `Invalid format. For Audio only ${types} are allowed.`,
        );
      }
      break;
  }
  return false;
};
