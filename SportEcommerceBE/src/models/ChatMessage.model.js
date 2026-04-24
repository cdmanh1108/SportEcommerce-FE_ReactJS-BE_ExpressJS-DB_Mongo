// models/ChatMessage.js
import mongoose from "mongoose";

const retrievalSourceSchema = new mongoose.Schema(
  {
    knowledgeChunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeChunk",
      default: null,
    },
    sourceType: {
      type: String,
      default: null,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    chunkType: {
      type: String,
      default: null,
      trim: true,
    },
    title: {
      type: String,
      default: null,
      trim: true,
    },
    score: {
      type: Number,
      default: null,
    },
    productUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    metadata: {
      parsedQuery: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      retrieval: {
        engine: { type: String, default: null },
        filters: { type: mongoose.Schema.Types.Mixed, default: null },
        tookMs: { type: Number, default: null },
        total: { type: Number, default: null },
        sources: {
          type: [retrievalSourceSchema],
          default: [],
        },
      },
      pageContext: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      model: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    collection: "ChatMessage",
  },
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
