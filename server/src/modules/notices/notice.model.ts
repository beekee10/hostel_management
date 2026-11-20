import mongoose, { Schema } from "mongoose";

export const NOTICE_TYPES = [
  "GENERAL",
  "ELECTRICITY",
  "WATER",
  "MAINTENANCE",
  "EMERGENCY",
  "MESS",
  "EVENT",
] as const;

const noticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: NOTICE_TYPES, default: "GENERAL" },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel" },
    block: { type: String, trim: true, default: "All Blocks" },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    affectedAreas: { type: String, trim: true, default: "Entire Campus" },
    isEmergency: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    expiresAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

noticeSchema.index({ expiresAt: 1 });
noticeSchema.index({ hostelId: 1, createdAt: -1 });
noticeSchema.index({ type: 1, createdAt: -1 });

export const Notice = mongoose.model("Notice", noticeSchema);
