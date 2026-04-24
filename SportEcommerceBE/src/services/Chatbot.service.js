import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import Category from "../models/Category.model.js";
import ChatConversation from "../models/ChatConversation.model.js";
import ChatMessage from "../models/ChatMessage.model.js";
import openai from "../config/Openai.js";
import AppError from "../utils/AppError.js";
import { semanticRetrieveKnowledgeChunks } from "./KnowledgeChunk.service.js";

dotenv.config();

const AUTH_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL_AUTH || "gpt-4o-mini";
const GUEST_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL_GUEST || "gpt-4o-mini";

const RAG_TOP_K = Math.max(1, Number.parseInt(process.env.RAG_TOP_K, 10) || 5);
const RAG_NUM_CANDIDATES = Math.max(
  50,
  Number.parseInt(process.env.RAG_NUM_CANDIDATES, 10) || RAG_TOP_K * 20,
);
const RAG_MIN_SCORE = Number.isFinite(Number(process.env.RAG_MIN_SCORE))
  ? Number(process.env.RAG_MIN_SCORE)
  : undefined;

const MAX_HISTORY_MESSAGES = Math.max(
  1,
  Number.parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 12,
);
const MAX_CONTEXT_CHUNKS = Math.max(
  1,
  Number.parseInt(process.env.CHAT_CONTEXT_CHUNKS, 10) || 5,
);
const MAX_CHUNK_CONTENT_CHARS = Math.max(
  200,
  Number.parseInt(process.env.CHAT_CONTEXT_CHARS, 10) || 1200,
);
const PRODUCT_DETAIL_DOMAIN = String(process.env.CLIENT_URL || "").trim();
const PRODUCT_SOURCE_TYPE = "product";

const DEFAULT_CONVERSATION_TITLE = "Cuộc trò chuyện mới";

const SYSTEM_PROMPT =
  "Bạn là trợ lý bán hàng của cửa hàng đồ thể thao WTM. Trả lời ngắn gọn, rõ ràng, ưu tiên tiếng Việt, bám sát dữ liệu tham chiếu. Nếu thiếu dữ liệu thì nói rõ chưa đủ thông tin. Không bịa thêm sản phẩm hoặc thông số không có trong context. Nếu context chưa đủ phù hợp, phải nói rõ.";

const SIGNAL_CONFIG = {
  sport_type: [
    { value: "bong_da", terms: ["bong da", "da bong", "soccer", "football"] },
    { value: "bong_ro", terms: ["bong ro", "basketball"] },
    { value: "bong_chuyen", terms: ["bong chuyen", "volleyball"] },
    { value: "cau_long", terms: ["cau long", "badminton"] },
    { value: "chay_bo", terms: ["chay bo", "running", "jogging"] },
  ],
  surface_type: [
    { value: "san_5", terms: ["san 5", "5 nguoi", "futsal 5"] },
    { value: "san_7", terms: ["san 7", "7 nguoi"] },
    { value: "san_11", terms: ["san 11", "11 nguoi"] },
    {
      value: "san_co_nhan_tao",
      terms: ["co nhan tao", "san co nhan tao", "turf", "artificial grass"],
    },
    {
      value: "san_co_tu_nhien",
      terms: ["co tu nhien", "san co tu nhien", "natural grass"],
    },
    { value: "san_trong_nha", terms: ["trong nha", "indoor"] },
    { value: "san_futsal", terms: ["futsal"] },
  ],
  outsole_type: [
    { value: "dinh_thap", terms: ["dinh thap", "tf", "ag", "dinh dam"] },
    { value: "dinh_cao", terms: ["dinh cao", "fg", "sg"] },
    { value: "de_bet", terms: ["de bet", "ic", "flat"] },
  ],
};

const GENDER_TERMS = {
  nam: ["nam", "men", "male", "cho nam"],
  nu: ["nu", "nữ", "women", "female", "cho nu", "cho nữ"],
  unisex: ["unisex", "ca nam nu", "ca nam nu", "nam nu"],
};

const INTENT_TERMS = {
  policy: [
    "chinh sach",
    "bao hanh",
    "doi tra",
    "giao hang",
    "van chuyen",
    "thanh toan",
  ],
  faq: ["faq", "cau hoi thuong gap", "hoi dap", "hoi va dap"],
  specification: ["thong so", "chi tiet", "spec", "cau hinh"],
  advice: ["tu van", "goi y", "nen mua", "phu hop", "chon gi"],
  size_guide: ["size", "kich co", "chon size", "bang size"],
  category_guide: ["loai giay", "phan loai", "danh muc"],
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeKeyword = (value) => normalizeText(value).replace(/\s+/g, " ");

const ensureObjectId = (id, message = "ID không hợp lệ") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400, 1);
  }
};

const toObjectId = (id, message = "ID không hợp lệ") => {
  ensureObjectId(id, message);
  return new mongoose.Types.ObjectId(id);
};

const uniqueArray = (values = []) => [...new Set(values)];

const normalizeBaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const buildProductUrl = (sourceId) => {
  if (!sourceId) return null;
  const normalizedId = String(sourceId).trim();
  if (!normalizedId) return null;

  const baseUrl = normalizeBaseUrl(PRODUCT_DETAIL_DOMAIN);
  const productPath = `/product/${normalizedId}`;
  return baseUrl ? `${baseUrl}${productPath}` : productPath;
};

const detectTerms = (normalizedQuery, terms = []) =>
  terms.some((term) => {
    const normalizedTerm = normalizeKeyword(term);
    return normalizedTerm && normalizedQuery.includes(normalizedTerm);
  });

const parseMoneyToVnd = (amountRaw, unitRaw) => {
  const numeric = Number(String(amountRaw || "").replace(/,/g, "."));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const unit = normalizeText(unitRaw || "");
  if (unit.includes("trieu")) {
    return Math.round(numeric * 1_000_000);
  }
  if (unit.includes("k") || unit.includes("nghin") || unit.includes("ngan")) {
    return Math.round(numeric * 1_000);
  }
  return Math.round(numeric);
};

const parsePriceSignals = (normalizedQuery) => {
  const result = {
    min_price: null,
    max_price: null,
  };

  const rangeMatch = normalizedQuery.match(
    /tu\s+([\d.,]+)\s*(trieu|k|nghin|ngan|vnd|d)?\s*(?:den|-|toi)\s+([\d.,]+)\s*(trieu|k|nghin|ngan|vnd|d)?/,
  );
  if (rangeMatch) {
    const minValue = parseMoneyToVnd(rangeMatch[1], rangeMatch[2]);
    const maxValue = parseMoneyToVnd(
      rangeMatch[3],
      rangeMatch[4] || rangeMatch[2],
    );

    if (minValue && maxValue) {
      result.min_price = Math.min(minValue, maxValue);
      result.max_price = Math.max(minValue, maxValue);
      return result;
    }
  }

  const belowMatch = normalizedQuery.match(
    /(duoi|nho hon|it hon)\s+([\d.,]+)\s*(trieu|k|nghin|ngan|vnd|d)?/,
  );
  if (belowMatch) {
    result.max_price = parseMoneyToVnd(belowMatch[2], belowMatch[3]);
    return result;
  }

  const aboveMatch = normalizedQuery.match(
    /(tren|lon hon|nhieu hon)\s+([\d.,]+)\s*(trieu|k|nghin|ngan|vnd|d)?/,
  );
  if (aboveMatch) {
    result.min_price = parseMoneyToVnd(aboveMatch[2], aboveMatch[3]);
    return result;
  }

  return result;
};

const detectAttributeSignals = (normalizedQuery) => {
  const attributes = {};

  Object.entries(SIGNAL_CONFIG).forEach(([attributeKey, options]) => {
    const matched = options
      .filter((option) => detectTerms(normalizedQuery, option.terms))
      .map((option) => option.value);
    if (matched.length > 0) {
      attributes[attributeKey] = uniqueArray(matched);
    }
  });

  return attributes;
};

const detectGenderSignal = (normalizedQuery) => {
  if (detectTerms(normalizedQuery, GENDER_TERMS.unisex)) return "unisex";
  if (detectTerms(normalizedQuery, GENDER_TERMS.nam)) return "nam";
  if (detectTerms(normalizedQuery, GENDER_TERMS.nu)) return "nu";
  return null;
};

const detectIntentSignals = (normalizedQuery) => {
  return {
    policy: detectTerms(normalizedQuery, INTENT_TERMS.policy),
    faq: detectTerms(normalizedQuery, INTENT_TERMS.faq),
    specification: detectTerms(normalizedQuery, INTENT_TERMS.specification),
    advice: detectTerms(normalizedQuery, INTENT_TERMS.advice),
    size_guide: detectTerms(normalizedQuery, INTENT_TERMS.size_guide),
    category_guide: detectTerms(normalizedQuery, INTENT_TERMS.category_guide),
  };
};

const inferSourceAndChunkType = (intentSignals) => {
  if (intentSignals.policy) {
    return { source_type: "policy", chunk_type: "policy" };
  }
  if (intentSignals.faq) {
    return { source_type: "faq", chunk_type: "faq" };
  }
  if (intentSignals.size_guide) {
    return { source_type: "size_guide", chunk_type: "advice" };
  }
  if (intentSignals.category_guide) {
    return { source_type: "category_guide", chunk_type: "overview" };
  }
  if (intentSignals.specification) {
    return { source_type: "product", chunk_type: "specification" };
  }
  if (intentSignals.advice) {
    return { source_type: "product", chunk_type: "advice" };
  }
  return { source_type: "product", chunk_type: "overview" };
};

const inferCategorySignal = async (normalizedQuery) => {
  try {
    const categories = await Category.find(
      { is_active: { $ne: false } },
      "_id category_name category_slug",
    ).lean();

    let bestMatch = null;

    categories.forEach((category) => {
      const aliasList = uniqueArray([
        normalizeKeyword(category.category_name),
        normalizeKeyword(
          String(category.category_slug || "").replace(/-/g, " "),
        ),
      ]).filter(Boolean);

      aliasList.forEach((alias) => {
        if (!alias) return;
        if (normalizedQuery.includes(alias)) {
          const score = alias.length;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              category_id: String(category._id),
              category_name: category.category_name || null,
              matched_term: alias,
              score,
            };
          }
        }
      });
    });

    if (!bestMatch) {
      return null;
    }

    return {
      category_id: bestMatch.category_id,
      category_name: bestMatch.category_name,
      matched_term: bestMatch.matched_term,
    };
  } catch (error) {
    console.error("Infer category signal error:", error?.message || error);
    return null;
  }
};

const parseNaturalLanguageQuery = async (message) => {
  const rawQuery = String(message || "").trim();
  if (!rawQuery) {
    throw new AppError("Thiếu nội dung tin nhắn", 400, 1);
  }

  const normalizedQuery = normalizeText(rawQuery);
  const attributes = detectAttributeSignals(normalizedQuery);
  const gender = detectGenderSignal(normalizedQuery);
  const intentSignals = detectIntentSignals(normalizedQuery);
  const priceSignals = parsePriceSignals(normalizedQuery);
  const categorySignal = await inferCategorySignal(normalizedQuery);
  const inferred = inferSourceAndChunkType(intentSignals);

  return {
    raw_query: rawQuery,
    normalized_query: normalizedQuery,
    intent: intentSignals,
    signals: {
      attributes,
      gender,
      ...priceSignals,
      category: categorySignal,
    },
    inferred_filters: {
      source_type: inferred.source_type,
      chunk_type: inferred.chunk_type,
      category_id: categorySignal?.category_id || null,
      is_active: true,
      language: "vi",
    },
  };
};

const compactParsedQueryForPrompt = (parsedQuery) => ({
  intent: parsedQuery.intent,
  signals: parsedQuery.signals,
  inferred_filters: parsedQuery.inferred_filters,
});

const buildFilterAttempts = (parsedQuery) => {
  const base = {
    source_type: parsedQuery.inferred_filters.source_type,
    chunk_type: parsedQuery.inferred_filters.chunk_type,
    category_id: parsedQuery.inferred_filters.category_id || undefined,
    is_active: true,
    language: "vi",
  };

  const attempts = [];
  const pushAttempt = (filters) => {
    const key = JSON.stringify(filters);
    if (!attempts.some((item) => JSON.stringify(item) === key)) {
      attempts.push(filters);
    }
  };

  pushAttempt(base);

  if (base.category_id) {
    pushAttempt({ ...base, category_id: undefined });
  }

  if (base.chunk_type) {
    pushAttempt({ ...base, chunk_type: undefined });
  }

  if (base.source_type !== "product") {
    pushAttempt({
      source_type: "product",
      chunk_type: "overview",
      category_id: base.category_id,
      is_active: true,
      language: "vi",
    });
  }

  pushAttempt({
    source_type: "product",
    chunk_type: undefined,
    category_id: undefined,
    is_active: true,
    language: "vi",
  });

  return attempts;
};

const retrieveKnowledgeChunks = async (query, parsedQuery) => {
  const filterAttempts = buildFilterAttempts(parsedQuery);
  let lastResult = null;

  for (const attempt of filterAttempts) {
    const retrievalResult = await semanticRetrieveKnowledgeChunks(query, {
      topK: RAG_TOP_K,
      numCandidates: RAG_NUM_CANDIDATES,
      ...(RAG_MIN_SCORE !== undefined ? { minScore: RAG_MIN_SCORE } : {}),
      ...attempt,
      allowBruteForceFallback: true,
    });

    lastResult = retrievalResult;
    if (
      Array.isArray(retrievalResult?.results) &&
      retrievalResult.results.length > 0
    ) {
      return retrievalResult;
    }
  }

  return (
    lastResult || {
      engine: "vector_search",
      filters: {},
      took_ms: 0,
      total: 0,
      results: [],
    }
  );
};

const mapRetrievalSources = (retrievalResult) => {
  const results = Array.isArray(retrievalResult?.results)
    ? retrievalResult.results
    : [];

  return results.slice(0, 10).map((chunk) => {
    const sourceType = String(chunk?.source_type || "").trim() || null;
    const sourceId = chunk?.source_id ? String(chunk.source_id) : null;

    return {
      knowledgeChunkId: chunk?._id || null,
      sourceType,
      sourceId,
      chunkType: chunk?.chunk_type || null,
      title: chunk?.title || null,
      score: Number.isFinite(Number(chunk?.score)) ? Number(chunk.score) : null,
      productUrl:
        sourceType === PRODUCT_SOURCE_TYPE ? buildProductUrl(sourceId) : null,
    };
  });
};

const mapProductLinks = (retrievalSources = []) => {
  if (!Array.isArray(retrievalSources) || retrievalSources.length === 0) {
    return [];
  }

  const linksMap = new Map();

  retrievalSources.forEach((source) => {
    if (source?.sourceType !== PRODUCT_SOURCE_TYPE || !source?.sourceId) {
      return;
    }

    const productId = String(source.sourceId).trim();
    if (!productId || linksMap.has(productId)) {
      return;
    }

    linksMap.set(productId, {
      product_id: productId,
      title: source?.title || null,
      url: source?.productUrl || buildProductUrl(productId),
    });
  });

  return Array.from(linksMap.values());
};

const PRODUCT_PREFIX_PATTERN = /^s[aả]n\s+ph[aẩ]m\s+/i;

const stripProductPrefix = (title) =>
  String(title || "")
    .trim()
    .replace(PRODUCT_PREFIX_PATTERN, "");

const stripTrailingLinkSection = (reply) => {
  const content = String(reply || "").trim();
  if (!content) return content;

  const normalized = content.toLowerCase();
  const markers = ["\nlink sản phẩm:", "\nlink san pham:"];
  let cutIndex = -1;

  markers.forEach((marker) => {
    const index = normalized.lastIndexOf(marker);
    if (index > cutIndex) {
      cutIndex = index;
    }
  });

  if (cutIndex === -1) {
    return content;
  }

  return content.slice(0, cutIndex).trim();
};

const appendProductLinksInline = (reply, productLinks = []) => {
  const baseReply = stripTrailingLinkSection(reply);
  if (!Array.isArray(productLinks) || productLinks.length === 0) {
    return baseReply;
  }

  const lines = baseReply ? baseReply.split("\n") : [];
  const linkMap = new Map();

  productLinks.forEach((item) => {
    const url = String(item?.url || "").trim();
    if (!url || baseReply.includes(url)) {
      return;
    }

    const cleanedTitle = stripProductPrefix(item?.title);
    const normalizedTitle = normalizeText(cleanedTitle);
    const fallbackKey = String(item?.product_id || "").trim() || url;
    const key = normalizedTitle || fallbackKey;

    if (!linkMap.has(key)) {
      linkMap.set(key, {
        title: cleanedTitle || null,
        normalizedTitle,
        url,
      });
    }
  });

  if (linkMap.size === 0) {
    return baseReply;
  }

  for (const link of linkMap.values()) {
    const targetLineIndex = lines.findIndex((line, index) => {
      if (!link.normalizedTitle) {
        return false;
      }

      const normalizedLine = normalizeText(line);
      if (!normalizedLine.includes(link.normalizedTitle)) {
        return false;
      }

      const nextLine = String(lines[index + 1] || "");
      return !/^\s*-\s*link\s*:/i.test(nextLine);
    });

    if (targetLineIndex === -1) {
      continue;
    }

    lines.splice(targetLineIndex + 1, 0, `   - Link: ${link.url}`);
  }

  return lines.join("\n").trim();
};

const buildRagContext = (retrievalResult) => {
  const chunks = Array.isArray(retrievalResult?.results)
    ? retrievalResult.results.slice(0, MAX_CONTEXT_CHUNKS)
    : [];

  if (chunks.length === 0) {
    return "";
  }

  const contextLines = chunks.map((chunk, index) => {
    const metadataParts = [];
    if (chunk?.metadata?.product_brand) {
      metadataParts.push(`Thương hiệu: ${chunk.metadata.product_brand}`);
    }
    if (chunk?.metadata?.product_category_name) {
      metadataParts.push(`Danh mục: ${chunk.metadata.product_category_name}`);
    }
    if (chunk?.metadata?.min_price || chunk?.metadata?.max_price) {
      metadataParts.push(
        `Khoảng giá: ${chunk.metadata.min_price || 0} - ${chunk.metadata.max_price || 0}`,
      );
    }

    const content = String(chunk?.content || "")
      .trim()
      .slice(0, MAX_CHUNK_CONTENT_CHARS);
    const metadataText =
      metadataParts.length > 0
        ? `\nMetadata: ${metadataParts.join(" | ")}`
        : "";

    return `[Chunk ${index + 1}] ${chunk?.title || "Không tiêu đề"}\nNội dung: ${content}${metadataText}`;
  });

  return [
    "Dữ liệu tham chiếu RAG (KnowledgeChunk):",
    ...contextLines,
    "Yêu cầu: Ưu tiên dùng dữ liệu tham chiếu để trả lời chính xác.",
  ].join("\n\n");
};

const normalizeInlineHistory = (history = []) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        ["user", "assistant", "system"].includes(item.role) &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .slice(-MAX_HISTORY_MESSAGES);
};

const resolveConversationForUser = async (user, conversationId, message) => {
  const userId = user?.userId;
  if (!userId) {
    return null;
  }

  ensureObjectId(userId, "userId không hợp lệ");
  const ownerId = toObjectId(userId, "userId không hợp lệ");

  if (conversationId) {
    ensureObjectId(conversationId, "conversation_id không hợp lệ");
    const existing = await ChatConversation.findOne({
      _id: conversationId,
      userId: ownerId,
    });
    if (!existing) {
      throw new AppError("Cuộc trò chuyện không tồn tại", 404, 1);
    }
    return existing;
  }

  const activeConversation = await ChatConversation.findOne({
    userId: ownerId,
    status: "active",
  }).sort({ updatedAt: -1 });

  if (activeConversation) {
    return activeConversation;
  }

  const title =
    String(message || "")
      .trim()
      .slice(0, 80) || DEFAULT_CONVERSATION_TITLE;
  return ChatConversation.create({
    userId: ownerId,
    title,
    status: "active",
  });
};

const getConversationHistoryMessages = async (conversationId) => {
  if (!conversationId) {
    return [];
  }

  const messages = await ChatMessage.find(
    { conversationId },
    { role: 1, content: 1, createdAt: 1 },
  )
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES)
    .lean();

  return messages
    .reverse()
    .filter((item) => ["user", "assistant", "system"].includes(item.role))
    .map((item) => ({
      role: item.role,
      content: String(item.content || "").trim(),
    }))
    .filter((item) => item.content.length > 0);
};

const createChatCompletion = async (messages, model) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError("Thiếu OPENAI_API_KEY", 500, -1);
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages,
    });
    return response?.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Chat completion error:", error?.message || error);
    throw new AppError("Không thể lấy phản hồi từ chatbot", 500, -1);
  }
};

const persistChatExchange = async ({
  conversation,
  userId,
  userMessage,
  assistantMessage,
  parsedQuery,
  retrievalResult,
  pageContext,
  model,
}) => {
  if (!conversation || !userId) {
    return;
  }

  const retrievalSources = mapRetrievalSources(retrievalResult);
  const retrievalMetadata = {
    engine: retrievalResult?.engine || null,
    filters: retrievalResult?.filters || null,
    tookMs: Number.isFinite(Number(retrievalResult?.took_ms))
      ? Number(retrievalResult.took_ms)
      : null,
    total: Number.isFinite(Number(retrievalResult?.total))
      ? Number(retrievalResult.total)
      : null,
    sources: retrievalSources,
  };

  await ChatMessage.create([
    {
      conversationId: conversation._id,
      userId,
      role: "user",
      content: userMessage,
      metadata: {
        parsedQuery,
        retrieval: {
          engine: null,
          filters: null,
          tookMs: null,
          total: null,
          sources: [],
        },
        pageContext: pageContext || null,
        model: null,
      },
    },
    {
      conversationId: conversation._id,
      userId,
      role: "assistant",
      content: assistantMessage,
      metadata: {
        parsedQuery,
        retrieval: retrievalMetadata,
        pageContext: pageContext || null,
        model,
      },
    },
  ]);

  const nextUpdate = {
    lastMessageAt: new Date(),
    lastMessagePreview: assistantMessage.slice(0, 500),
  };

  if (
    !conversation.title ||
    conversation.title === DEFAULT_CONVERSATION_TITLE
  ) {
    nextUpdate.title = userMessage.slice(0, 80) || DEFAULT_CONVERSATION_TITLE;
  }

  await ChatConversation.findByIdAndUpdate(conversation._id, nextUpdate);
};

const chatWithBotService = async (message, user, options = {}) => {
  const normalizedMessage = String(message || "").trim();
  if (!normalizedMessage) {
    throw new AppError("Thiếu nội dung tin nhắn", 400, 1);
  }

  const parsedQuery = await parseNaturalLanguageQuery(normalizedMessage);
  const retrievalResult = await retrieveKnowledgeChunks(
    normalizedMessage,
    parsedQuery,
  );
  const ragContext = buildRagContext(retrievalResult);

  const conversation = await resolveConversationForUser(
    user,
    options.conversationId,
    normalizedMessage,
  );

  const model = conversation ? AUTH_CHAT_MODEL : GUEST_CHAT_MODEL;
  const historyMessages = conversation
    ? await getConversationHistoryMessages(conversation._id)
    : normalizeInlineHistory(options.history);

  const requestMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Parsed query nội bộ: ${JSON.stringify(
        compactParsedQueryForPrompt(parsedQuery),
      )}`,
    },
    ...(ragContext ? [{ role: "system", content: ragContext }] : []),
    ...historyMessages,
    { role: "user", content: normalizedMessage },
  ];

  const assistantReplyRaw = await createChatCompletion(requestMessages, model);
  const retrievalSources = mapRetrievalSources(retrievalResult);
  const productLinks = mapProductLinks(retrievalSources);
  const assistantReply = appendProductLinksInline(
    assistantReplyRaw,
    productLinks,
  );

  if (conversation && user?.userId) {
    const ownerId = toObjectId(user.userId, "userId không hợp lệ");
    await persistChatExchange({
      conversation,
      userId: ownerId,
      userMessage: normalizedMessage,
      assistantMessage: assistantReply,
      parsedQuery,
      retrievalResult,
      pageContext: options.pageContext || null,
      model,
    });
  }

  return {
    reply: assistantReply,
    conversation_id: conversation?._id || null,
    parsed_query: parsedQuery,
    product_links: productLinks,
    retrieval: {
      engine: retrievalResult?.engine || null,
      filters: retrievalResult?.filters || null,
      took_ms: retrievalResult?.took_ms ?? null,
      total: retrievalResult?.total ?? 0,
      sources: retrievalSources,
    },
  };
};

const SearchProductService = async (message) => {
  const parsed = await parseNaturalLanguageQuery(message);
  return {
    parsed_query: parsed,
  };
};

const appendSearchHistory = async (user, message, filters) => {
  if (!user?.userId) return;
  if (!mongoose.Types.ObjectId.isValid(user.userId)) return;

  await User.findByIdAndUpdate(
    user.userId,
    {
      $push: {
        searchhistory: {
          message: String(message || "").trim(),
          filters: JSON.stringify(filters || {}),
          searchedAt: new Date(),
        },
      },
    },
    { new: true },
  );
};

export { chatWithBotService, SearchProductService, appendSearchHistory };
