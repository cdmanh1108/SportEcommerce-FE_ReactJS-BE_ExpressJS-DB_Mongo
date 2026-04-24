import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.model.js";
import ChatConversation from "../models/ChatConversation.model.js";
import AppError from "../utils/AppError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const VALID_ROLES = new Set(["user", "assistant", "system"]);

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

const getConversationWithPermissionCheck = async (conversationId, currentUser) => {
  ensureValidObjectId(conversationId, "conversationId không hợp lệ");
  const conversation = await ChatConversation.findById(conversationId);

  if (!conversation) {
    throw new AppError("Cuộc trò chuyện không tồn tại", 404, 1);
  }

  const { userId, isAdmin } = resolveCurrentUser(currentUser);
  if (!isAdmin && String(conversation.userId) !== userId) {
    throw new AppError("Bạn không có quyền truy cập cuộc trò chuyện này", 403, 2);
  }

  return conversation;
};

const toNullableObjectId = (value) => {
  if (!value) {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const normalizeRetrievalSource = (source) => {
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    knowledgeChunkId: toNullableObjectId(source.knowledgeChunkId),
    sourceType: source.sourceType ? String(source.sourceType).trim() : null,
    sourceId: toNullableObjectId(source.sourceId),
    chunkType: source.chunkType ? String(source.chunkType).trim() : null,
    title: source.title ? String(source.title).trim() : null,
    score: Number.isFinite(Number(source.score)) ? Number(source.score) : null,
    productUrl: source.productUrl ? String(source.productUrl).trim() : null,
  };
};

const normalizeMessageMetadata = (metadata = null) => {
  if (metadata === null || metadata === undefined) {
    return undefined;
  }
  if (typeof metadata !== "object") {
    throw new AppError("metadata phải là object", 400, 1);
  }

  const retrieval = metadata.retrieval || {};
  const rawSources = Array.isArray(retrieval.sources) ? retrieval.sources : [];

  return {
    parsedQuery:
      metadata.parsedQuery === undefined ? null : metadata.parsedQuery,
    retrieval: {
      engine: retrieval.engine ? String(retrieval.engine).trim() : null,
      filters: retrieval.filters === undefined ? null : retrieval.filters,
      tookMs: Number.isFinite(Number(retrieval.tookMs))
        ? Number(retrieval.tookMs)
        : null,
      total: Number.isFinite(Number(retrieval.total))
        ? Number(retrieval.total)
        : null,
      sources: rawSources.map(normalizeRetrievalSource).filter(Boolean),
    },
    pageContext:
      metadata.pageContext === undefined ? null : metadata.pageContext,
    model: metadata.model ? String(metadata.model).trim() : null,
  };
};

const updateConversationLastMessage = async (conversationId) => {
  const latestMessage = await ChatMessage.findOne({ conversationId })
    .sort({ createdAt: -1 })
    .select({ content: 1, createdAt: 1 });

  if (!latestMessage) {
    await ChatConversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: null,
      lastMessagePreview: null,
    });
    return;
  }

  await ChatConversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: latestMessage.createdAt,
    lastMessagePreview: String(latestMessage.content || "").slice(0, 500),
  });
};

const createChatMessage = async (payload = {}, currentUser) => {
  const conversation = await getConversationWithPermissionCheck(
    payload.conversationId,
    currentUser,
  );

  const role = String(payload.role || "")
    .trim()
    .toLowerCase();
  if (!VALID_ROLES.has(role)) {
    throw new AppError("role không hợp lệ", 400, 1);
  }

  const content = String(payload.content || "").trim();
  if (!content) {
    throw new AppError("content không được để trống", 400, 1);
  }

  const metadata = normalizeMessageMetadata(payload.metadata);

  const message = await ChatMessage.create({
    conversationId: conversation._id,
    userId: conversation.userId,
    role,
    content,
    ...(metadata !== undefined ? { metadata } : {}),
  });

  await ChatConversation.findByIdAndUpdate(conversation._id, {
    lastMessageAt: message.createdAt,
    lastMessagePreview: content.slice(0, 500),
  });

  return message;
};

const getChatMessagesByConversation = async (
  conversationId,
  query = {},
  currentUser,
) => {
  const conversation = await getConversationWithPermissionCheck(
    conversationId,
    currentUser,
  );
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const sortDirection =
    String(query.sort || "asc").trim().toLowerCase() === "desc" ? -1 : 1;

  const dbFilter = { conversationId: conversation._id };
  const [items, total] = await Promise.all([
    ChatMessage.find(dbFilter)
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit),
    ChatMessage.countDocuments(dbFilter),
  ]);

  return {
    conversation,
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

const getChatMessageById = async (messageId, currentUser) => {
  ensureValidObjectId(messageId, "messageId không hợp lệ");

  const message = await ChatMessage.findById(messageId);
  if (!message) {
    throw new AppError("Tin nhắn không tồn tại", 404, 1);
  }

  await getConversationWithPermissionCheck(message.conversationId, currentUser);
  return message;
};

const deleteChatMessage = async (messageId, currentUser) => {
  const message = await getChatMessageById(messageId, currentUser);
  const conversationId = message.conversationId;

  await message.deleteOne();
  await updateConversationLastMessage(conversationId);

  return {
    deleted_message_id: String(messageId),
    conversation_id: String(conversationId),
  };
};

export {
  createChatMessage,
  getChatMessagesByConversation,
  getChatMessageById,
  deleteChatMessage,
};
