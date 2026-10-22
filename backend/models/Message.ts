import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
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
    content: {
      type: String,
    },
    attachments: [
      {
        url: {
          type: String,
        },
        thumbnail: {
          type: String,
        },
        public_id: {
          type: String,
        },
        type: {
          type: String,
        },
        resource_type: {
          type: String,
        },
        format: {
          type: String,
        },
        name: {
          type: String,
        },
        created_at: {
          type: Date,
        },
        size: { type: Number },
        tags: [{ type: String }],
        message: { type: String },
      },
    ],
    seen: {
      type: String,
      default: "unseen",
      enum: ["seen", "unseen", "semiseen"],
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
messageSchema.index({ createdAt: 1 });
export default mongoose.model("messages", messageSchema);
