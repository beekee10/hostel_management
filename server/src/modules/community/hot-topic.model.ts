import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    topicId: { type: Schema.Types.ObjectId, ref: "HotTopic", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const TopicComment = mongoose.model("TopicComment", commentSchema);

const hotTopicSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String, trim: true }],
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
    heatScore: { type: Number, min: 0, max: 100, default: 25 },
    cardSize: {
      type: String,
      enum: ["sm", "md", "lg", "xl"],
      default: "sm",
    },
    sentiment: {
      type: String,
      enum: ["POSITIVE", "NEUTRAL", "CONCERN", "CRITICAL"],
      default: "NEUTRAL",
    },
    aiSummary: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

hotTopicSchema.index({ createdAt: -1 });
hotTopicSchema.index({ heatScore: -1, createdAt: -1 });
hotTopicSchema.index({ authorId: 1, createdAt: -1 });

export const HotTopic = mongoose.model("HotTopic", hotTopicSchema);
