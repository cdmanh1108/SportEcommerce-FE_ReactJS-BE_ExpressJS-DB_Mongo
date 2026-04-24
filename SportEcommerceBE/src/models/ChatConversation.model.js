import mongoose from "mongoose";

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Cuộc trò chuyện mới",
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      pageContext: { type: mongoose.Schema.Types.Mixed, default: null },
      tags: { type: [String], default: [] },
      model: { type: String, default: null, trim: true },
    },
  },
  {
    timestamps: true,
    collection: "ChatConversation",
  },
);

chatConversationSchema.index({ userId: 1, updatedAt: -1 });
chatConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });

const ChatConversation = mongoose.model(
  "ChatConversation",
  chatConversationSchema,
);

export default ChatConversation;
