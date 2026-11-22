import mongoose, { Schema } from "mongoose";

const ContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    name: String,
    email: { type: String, default: null },
    pic: { type: String, default: null },
    banner: { type: String, default: null },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    phoneCode: {
      type: String,
      required: true,
      trim: true,
    },
    fullPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);
ContactSchema.index({ userId: 1 });
export default mongoose.model("contacts", ContactSchema);
