import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    fid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phoneCode: {
      type: String,
      required: true,
    },
    pic: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "Hey, I am using ChatFlow.",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      select: false,
      default: "Newly Registered User",
    },
  },
  { timestamps: true },
);
userSchema.index({ phone: 1, phoneCode: 1 }, { unique: true });
export default mongoose.model("users", userSchema);
