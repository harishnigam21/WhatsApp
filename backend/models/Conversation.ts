import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
    ],
    lastMessage: {
      type: Map,
      of: Schema.Types.ObjectId,
      ref: "messages",
      default: {},
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });
export default mongoose.model("Conversation", conversationSchema);
