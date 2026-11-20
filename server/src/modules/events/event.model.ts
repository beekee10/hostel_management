import mongoose, { Schema } from "mongoose";

export const EVENT_CATEGORIES = [
  "SPORTS",
  "CULTURAL",
  "WORKSHOP",
  "HACKATHON",
  "CELEBRATION",
  "MEETING",
  "OTHER",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      default: "CULTURAL",
      index: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    coverImage: {
      type: String,
      default: "",
    },
    googleFormUrl: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Students assigned to organize & manage the event
    studentManagers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Students who RSVP'd to attend
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxAttendees: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    status: {
      type: String,
      enum: ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
      index: true,
    },
  },
  { timestamps: true },
);

eventSchema.index({ eventDate: 1, status: 1 });

export const HostelEvent = mongoose.model("HostelEvent", eventSchema);
