import mongoose, { Schema } from "mongoose";

const ContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    name: String,
    email: String,
    pic: String,
    banner: String,
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
