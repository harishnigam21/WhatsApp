import { v2 as cloudinary } from "cloudinary";
import { envList } from "../envConfig.js";
cloudinary.config({
  cloud_name: envList.CLOUDINARY_CLOUD_NAME,
  api_key: envList.CLOUDINARY_API_KEY,
  api_secret: envList.CLOUDINARY_API_SECRET,
});
export default cloudinary;