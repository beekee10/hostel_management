import mongoose, { Schema } from "mongoose";

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const dayMenuSchema = new Schema(
  {
    day: { type: String, enum: DAYS_OF_WEEK, required: true },
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    snacks: { type: String, required: true },
    dinner: { type: String, required: true },
    special: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const MessMenu = mongoose.model("MessMenu", dayMenuSchema);
