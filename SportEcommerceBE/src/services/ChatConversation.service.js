import mongoose from "mongoose";
import ChatConversation from "../models/ChatConversation.model.js";
import ChatMessage from "../models/ChatMessage.model.js";
import AppError from "../utils/AppError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (page, limit) => {
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || DEFAULT_PAGE);
  const parsedLimit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(limit, 10) || DEFAULT_LIMIT),
  );

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

const ensureValidObjectId = (id, message = "ID không hợp lệ") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400, 1);
  }
};

const resolveCurrentUser = (currentUser) => {
  const userId = currentUser?.userId || currentUser?._id;
  if (!userId) {
    throw new AppError("Thiếu thông tin người dùng", 401, 1);
  }

  return {
    userId: String(userId),
    isAdmin: currentUser?.role === "admin",
  };
};

const VALID_CONVERSATION_STATUS = new Set(["active", "archived", "closed"]);

const assertConversationPermission = (conversation, currentUser) => {
  const { userId, isAdmin } = resolveCurrentUser(currentUser);
  if (isAdmin) {
    return;
  }

  if (!conversation?.userId || String(conversation.userId) !== userId) {
    throw new AppError("Bạn không có quyền truy cập cuộc trò chuyện này", 403, 2);
  }
};

const normalizeConversationInput = (payload = {}) => {
  const normalizedTitle = String(payload.title || "").trim();
  const title = normalizedTitle || "Cuộc trò chuyện mới";

  const normalized = {
    title,
  };

  if (payload.status !== undefined) {
    const status = String(payload.status || "").trim().toLowerCase();
    if (!VALID_CONVERSATION_STATUS.has(status)) {
      throw new AppError(
        "status không hợp lệ, chỉ hỗ trợ: active, archived, closed",
        400,
        1,
      );
    }
    normalized.status = status;
  }

  if (payload.metadata !== undefined) {
    if (payload.metadata === null || typeof payload.metadata === "object") {
      normalized.metadata = payload.metadata;
    } else {
      throw new AppError("metadata phải là object hoặc null", 400, 1);
    }
  }

  return normalized;
};

const createChatConversation = async (payload = {}, currentUser) => {
  const { userId, isAdmin } = resolveCurrentUser(currentUser);
  const ownerId = isAdmin && payload.userId ? payload.userId : userId;
  ensureValidObjectId(ownerId, "userId không hợp lệ");

  const normalizedInput = normalizeConversationInput(payload);

  const conversation = await ChatConversation.create({
    userId: new mongoose.Types.ObjectId(ownerId),
    ...normalizedInput,
  });

  return conversation;
};

const getChatConversationById = async (conversationId, currentUser) => {
  ensureValidObjectId(conversationId, "conversationId không hợp lệ");

  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) {
    throw new AppError("Cuộc trò chuyện không tồn tại", 404, 1);
  }

  assertConversationPermission(conversation, currentUser);
  return conversation;
};

const getChatConversations = async (query = {}, currentUser) => {
  const { userId, isAdmin } = resolveCurrentUser(currentUser);
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const dbFilter = {};

  if (isAdmin && query.user_id) {
    ensureValidObjectId(query.user_id, "user_id không hợp lệ");
    dbFilter.userId = new mongoose.Types.ObjectId(query.user_id);
  } else {
    dbFilter.userId = new mongoose.Types.ObjectId(userId);
  }

  if (query.status) {
    dbFilter.status = String(query.status).trim().toLowerCase();
  }

  if (query.keyword) {
    dbFilter.title = {
      $regex: String(query.keyword).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const [items, total] = await Promise.all([
    ChatConversation.find(dbFilter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatConversation.countDocuments(dbFilter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total_items: total,
      total_pages: Math.ceil(total / limit),
      has_more: skip + items.length < total,
    },
  };
};

const updateChatConversation = async (conversationId, payload = {}, currentUser) => {
  const conversation = await getChatConversationById(conversationId, currentUser);
  const normalizedInput = normalizeConversationInput(payload);

  Object.keys(normalizedInput).forEach((field) => {
    conversation[field] = normalizedInput[field];
  });

  await conversation.save();
  return conversation;
};

const deleteChatConversation = async (conversationId, currentUser) => {
  const conversation = await getChatConversationById(conversationId, currentUser);

  const deleteMessageResult = await ChatMessage.deleteMany({
    conversationId: conversation._id,
  });

  await conversation.deleteOne();

  return {
    deleted_conversation_id: String(conversation._id),
    deleted_messages: Number(deleteMessageResult?.deletedCount || 0),
  };
};

export {
  createChatConversation,
  getChatConversations,
  getChatConversationById,
  updateChatConversation,
  deleteChatConversation,
};
