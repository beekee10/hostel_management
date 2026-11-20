import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["CHANNEL", "DIRECT", "GROUP"],
      default: "CHANNEL",
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    topic: {
      type: String,
      trim: true,
      default: "",
    },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    blockedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      text: { type: String, default: "" },
      senderName: { type: String, default: "" },
      sentAt: { type: Date, default: Date.now },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

conversationSchema.index({ type: 1, isDefault: 1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ blockedBy: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
