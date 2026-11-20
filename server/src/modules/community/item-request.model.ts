import mongoose, { Schema } from "mongoose";

const offerSchema = new Schema(
  {
    giverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 300,
    },
    roomHint: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "IGNORED"],
      default: "PENDING",
    },
    offeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const itemRequestSchema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: [
        "FOOD_SNACKS",
        "STUDY_TOOLS",
        "ELECTRONICS",
        "MEDICINE",
        "DAILY_ESSENTIALS",
        "OTHER",
      ],
      default: "FOOD_SNACKS",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    urgency: {
      type: String,
      enum: ["CASUAL", "URGENT", "LATE_NIGHT"],
      default: "LATE_NIGHT",
    },
    status: {
      type: String,
      enum: ["OPEN", "OFFER_RECEIVED", "ACCEPTED", "COMPLETED", "CANCELLED"],
      default: "OPEN",
      index: true,
    },
    offers: [offerSchema],
    acceptedOfferId: {
      type: Schema.Types.ObjectId,
    },
    acceptedGiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

itemRequestSchema.index({ status: 1, createdAt: -1 });

export const ItemRequest = mongoose.model("ItemRequest", itemRequestSchema);
