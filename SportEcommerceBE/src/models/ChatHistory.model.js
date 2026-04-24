// models/ChatHistory.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: String, // 'user' hoặc 'assistant'
  content: String,
});

const chatHistorySchema = new mongoose.Schema(
  {
    userId: String,
    messages: [messageSchema],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "ChatHistory",
  },
);

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;
