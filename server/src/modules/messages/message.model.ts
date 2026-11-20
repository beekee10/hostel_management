import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      enum: ["GENERAL", "URGENT", "ANNOUNCEMENT", "COMPLAINT"],
      default: "GENERAL",
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
