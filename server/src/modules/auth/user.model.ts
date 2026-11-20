import mongoose, { Schema } from "mongoose";

export const ROLES = [
  "STUDENT",
  "STUDENT_COORDINATOR",
  "SUPERVISOR",
  "WARDEN",
  "MESS_COORDINATOR",
  "ADMIN",
] as const;

export type UserRole = (typeof ROLES)[number];

const schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "STUDENT",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    roomNumber: {
      type: String,
      trim: true,
      default: "",
    },
    block: {
      type: String,
      trim: true,
      default: "Block A",
    },
    department: {
      type: String,
      trim: true,
      default: "Computer Science",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "GRADUATED", "SUSPENDED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", schema);
