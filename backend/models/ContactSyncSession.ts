import mongoose, { Schema, Types, Model } from "mongoose";

export interface IContactSyncSession {
  userId: Types.ObjectId;
  tokenHash: string;
  status: "pending" | "scanning" | "completed";
  deviceActive: {
    thumbmark: string;
    model: string | null;
    platform: string | null;
    isMobile: boolean;
    brands: { browser: string; version: string };
    timezone: string;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSyncSessionSchema = new Schema<IContactSyncSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "scanning", "completed"],
      default: "pending",
    },

    deviceActive: {
      thumbmark: String,
      model: String,
      platform: String,
      isMobile: Boolean,
      brands: { browser: String, version: String },
      timezone: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically delete expired sessions
ContactSyncSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ContactSyncSession: Model<IContactSyncSession> =
  mongoose.models.ContactSyncSession ||
  mongoose.model<IContactSyncSession>(
    "ContactSyncSession",
    ContactSyncSessionSchema,
  );

export default ContactSyncSession;
