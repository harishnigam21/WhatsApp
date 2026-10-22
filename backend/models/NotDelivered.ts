import mongoose from "mongoose";

const NotDelivered = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      required: true,
    },
  },
  { timestamps: true },
);
export default mongoose.model("NotDelivered", NotDelivered);
