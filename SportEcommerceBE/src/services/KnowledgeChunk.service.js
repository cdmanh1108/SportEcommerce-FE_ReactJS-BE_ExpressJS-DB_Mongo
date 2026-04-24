import mongoose from "mongoose";
import KnowledgeChunk from "../models/KnowledgeChunk.model.js";
import Product from "../models/Product.model.js";
import openai from "../config/Openai.js";
import AppError from "../utils/AppError.js";

const PRODUCT_SOURCE_TYPE = "product";
const DEFAULT_CHUNK_TYPE = "overview";
const DEFAULT_VECTOR_INDEX_NAME =
  process.env.KNOWLEDGE_CHUNK_VECTOR_INDEX || "knowledge_chunk_embedding_index";
const DEFAULT_VECTOR_SIMILARITY = String(
  process.env.KNOWLEDGE_CHUNK_VECTOR_SIMILARITY || "cosine",
).trim();
const DEFAULT_EMBEDDING_DIMENSIONS = Math.max(
  1,
  Number.parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS, 10) || 1536,
);
const MAX_TOP_K = 20;
const MAX_NUM_CANDIDATES = 10000;
const DEFAULT_NUM_CANDIDATES_FACTOR = 20;

const SOURCE_TYPE_MAP = {
  "sản phẩm": "product",
  product: "product",
};

const CHUNK_TYPE_MAP = {
  "tổng quan": "overview",
  overview: "overview",
  "thông số": "specification",
  specification: "specification",
  "tư vấn": "advice",
  advice: "advice",
  "chính sách": "policy",
  policy: "policy",
  "câu hỏi thường gặp": "faq",
  faq: "faq",
};

const SOURCE_TYPE_SET = new Set([
  "product",
  "faq",
  "policy",
  "size_guide",
  "category_guide",
]);
const CHUNK_TYPE_SET = new Set([
  "overview",
  "specification",
  "advice",
  "policy",
  "faq",
]);
const VECTOR_SIMILARITY_MAP = Object.freeze({
  cosine: "cosine",
  euclidean: "euclidean",
  dotproduct: "dotProduct",
  "dot-product": "dotProduct",
  dot_product: "dotProduct",
});

const normalizeEnumValue = (value, map, fallback = null) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return map[normalized] || fallback;
};

const parseOptionalBoolean = (value, fieldName = "boolean") => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  throw new AppError(`${fieldName} không hợp lệ`, 400, 1);
};

const normalizeSourceTypeFilter = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = normalizeEnumValue(
    value,
    SOURCE_TYPE_MAP,
    String(value).trim().toLowerCase(),
  );

  if (!SOURCE_TYPE_SET.has(normalized)) {
    throw new AppError("source_type không hợp lệ", 400, 1);
  }
  return normalized;
};

const normalizeChunkTypeFilter = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = normalizeEnumValue(
    value,
    CHUNK_TYPE_MAP,
    String(value).trim().toLowerCase(),
  );

  if (!CHUNK_TYPE_SET.has(normalized)) {
    throw new AppError("chunk_type không hợp lệ", 400, 1);
  }
  return normalized;
};

const normalizeVectorSimilarity = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const similarity = VECTOR_SIMILARITY_MAP[normalized];

  if (!similarity) {
    throw new AppError(
      "similarity không hợp lệ, chỉ hỗ trợ: cosine, euclidean, dotProduct",
      400,
      1,
    );
  }

  return similarity;
};

const normalizeTopK = (topK) =>
  Math.min(MAX_TOP_K, Math.max(1, Number.parseInt(topK, 10) || 5));

const normalizeNumCandidates = (numCandidates, topK) => {
  const parsed = Number.parseInt(numCandidates, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return Math.min(MAX_NUM_CANDIDATES, parsed);
  }
  return Math.min(
    MAX_NUM_CANDIDATES,
    Math.max(topK * DEFAULT_NUM_CANDIDATES_FACTOR, 100),
  );
};

const ensureValidObjectId = (id, message = "ID không hợp lệ") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400, 1);
  }
};

const normalizeStringArray = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values.map((value) => String(value || "").trim()).filter(Boolean),
    ),
  ];
};

const normalizeAttributes = (attributes = {}) => {
  if (attributes === null || typeof attributes !== "object") {
    return [];
  }

  let entries;
  if (attributes instanceof Map) {
    entries = Array.from(attributes.entries());
  } else if (Array.isArray(attributes)) {
    entries = attributes;
  } else {
    entries = Object.entries(attributes);
  }

  return entries
    .map((item) => {
      if (Array.isArray(item) && item.length === 2) {
        const [rawKey, rawValues] = item;
        const key = String(rawKey || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");
        const values = normalizeStringArray(rawValues || []);
        return { key, values };
      }

      if (typeof item === "object" && item !== null && item.key) {
        const key = String(item.key || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");
        const values = normalizeStringArray(item.values || []);
        return { key, values };
      }

      return null;
    })
    .filter(
      (attribute) => attribute && attribute.key && attribute.values.length > 0,
    );
};

const ATTRIBUTE_LABELS = {
  sport_type: {
    bong_da: "giày đá bóng",
    bong_ro: "giày bóng rổ",
    bong_chuyen: "giày bóng chuyền",
    cau_long: "giày cầu lông",
    chay_bo: "giày chạy bộ",
  },
  surface_type: {
    san_5: "sân 5",
    san_7: "sân 7",
    san_11: "sân 11",
    san_co_nhan_tao: "sân cỏ nhân tạo",
    san_co_tu_nhien: "sân cỏ tự nhiên",
    san_trong_nha: "sân trong nhà",
    san_futsal: "sân futsal",
  },
  outsole_type: {
    dinh_thap: "đinh thấp",
    dinh_cao: "đinh cao",
    de_bet: "đế bệt",
  },
  position: {
    tien_dao: "tiền đạo",
    tien_ve: "tiền vệ",
    hau_ve: "hậu vệ",
    chay_canh: "chạy cánh",
  },
  ankle_support: {
    co_thap: "cổ thấp",
    co_trung: "cổ trung",
    co_cao: "cổ cao",
  },
  cushioning: {
    thap: "độ êm thấp",
    vua: "độ êm vừa",
    cao: "độ êm cao",
  },
  foot_shape: {
    thon: "bàn chân thon",
    trung_binh: "bàn chân trung bình",
    be: "bàn chân bè",
  },
  material: {
    da_that: "da thật",
    da_nhan_tao: "da nhân tạo",
    vai: "vải",
    luoi: "lưới",
  },
  weight_level: {
    nhe: "trọng lượng nhẹ",
    trung_binh: "trọng lượng trung bình",
    nang: "trọng lượng nặng",
  },
  traction_level: {
    thap: "độ bám thấp",
    vua: "độ bám vừa",
    cao: "độ bám cao",
  },
  durability: {
    thap: "độ bền thấp",
    vua: "độ bền vừa",
    cao: "độ bền cao",
  },
  price_segment: {
    re: "phân khúc giá rẻ",
    vua: "phân khúc giá tầm trung",
    dat: "phân khúc giá cao",
  },
};

function getAttributeValues(attributes = [], key) {
  const found = attributes.find((item) => item.key === key);
  return found?.values || [];
}

function mapAttributeLabels(key, values = []) {
  const mapping = ATTRIBUTE_LABELS[key] || {};
  return values.map((value) => mapping[value] || value);
}

function joinNatural(items = []) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} và ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} và ${items[items.length - 1]}`;
}

function extractProductSummary(product) {
  const colors = [...new Set((product.colors || []).map((c) => c.color_name))];

  const variants = (product.colors || []).flatMap((c) => c.variants || []);
  const sizes = [...new Set(variants.map((v) => String(v.variant_size)))];

  const prices = variants
    .map((v) => v.variant_price)
    .filter((price) => typeof price === "number" && price > 0);

  const minPrice = prices.length
    ? Math.min(...prices)
    : product.product_price || 0;
  const maxPrice = prices.length
    ? Math.max(...prices)
    : product.product_price || 0;

  return { colors, sizes, minPrice, maxPrice };
}

function buildAttributeNarrative(product) {
  const surfaceTypes = mapAttributeLabels(
    "surface_type",
    getAttributeValues(product.attributes, "surface_type"),
  );
  const outsoleTypes = mapAttributeLabels(
    "outsole_type",
    getAttributeValues(product.attributes, "outsole_type"),
  );
  const positions = mapAttributeLabels(
    "position",
    getAttributeValues(product.attributes, "position"),
  );

  const parts = [];

  if (surfaceTypes.length) {
    parts.push(`Sản phẩm phù hợp với ${joinNatural(surfaceTypes)}`);
  }

  if (outsoleTypes.length) {
    parts.push(`sử dụng ${joinNatural(outsoleTypes)}`);
  }

  if (positions.length) {
    parts.push(`thích hợp cho ${joinNatural(positions)}`);
  }

  return parts.length ? parts.join(", ") + "." : "";
}

function buildOverviewContent(metadata) {
  const lines = [];

  lines.push(`Sản phẩm: ${metadata.product_title}`);
  lines.push(`Thương hiệu: ${metadata.product_brand}`);

  if (metadata.product_category_name) {
    lines.push(`Danh mục: ${metadata.product_category_name}`);
  }

  // if (metadata.product_description) {
  //   lines.push("");
  //   lines.push(metadata.product_description.trim());
  // }

  const sportTypes = mapAttributeLabels(
    "sport_type",
    getAttributeValues(metadata.attributes, "sport_type"),
  );
  const surfaceTypes = mapAttributeLabels(
    "surface_type",
    getAttributeValues(metadata.attributes, "surface_type"),
  );
  const outsoleTypes = mapAttributeLabels(
    "outsole_type",
    getAttributeValues(metadata.attributes, "outsole_type"),
  );
  const positions = mapAttributeLabels(
    "position",
    getAttributeValues(metadata.attributes, "position"),
  );
  const ankleSupport = mapAttributeLabels(
    "ankle_support",
    getAttributeValues(metadata.attributes, "ankle_support"),
  );
  const footShapes = mapAttributeLabels(
    "foot_shape",
    getAttributeValues(metadata.attributes, "foot_shape"),
  );
  const materials = mapAttributeLabels(
    "material",
    getAttributeValues(metadata.attributes, "material"),
  );
  const weightLevels = mapAttributeLabels(
    "weight_level",
    getAttributeValues(metadata.attributes, "weight_level"),
  );
  const durability = mapAttributeLabels(
    "durability",
    getAttributeValues(metadata.attributes, "durability"),
  );
  const cushioning = mapAttributeLabels(
    "cushioning",
    getAttributeValues(metadata.attributes, "cushioning"),
  );

  const detailSentences = [];

  if (sportTypes.length) {
    detailSentences.push(`Đây là mẫu ${joinNatural(sportTypes)}`);
  }

  if (surfaceTypes.length) {
    detailSentences.push(`Phù hợp với ${joinNatural(surfaceTypes)}`);
  }

  if (outsoleTypes.length) {
    detailSentences.push(`sử dụng ${joinNatural(outsoleTypes)}`);
  }

  if (detailSentences.length) {
    lines.push("");
    lines.push(`${detailSentences.join(", ")}.`);
  }

  const usageSentences = [];

  if (positions.length) {
    usageSentences.push(`phù hợp cho ${joinNatural(positions)}`);
  }

  if (ankleSupport.length) {
    usageSentences.push(`thiết kế ${joinNatural(ankleSupport)}`);
  }

  if (footShapes.length) {
    usageSentences.push(`hợp với ${joinNatural(footShapes)}`);
  }

  if (materials.length) {
    usageSentences.push(`chất liệu chính là ${joinNatural(materials)}`);
  }

  if (weightLevels.length) {
    usageSentences.push(`${joinNatural(weightLevels)}`);
  }

  if (durability.length) {
    usageSentences.push(`${joinNatural(durability)}`);
  }

  if (cushioning.length) {
    usageSentences.push(`${joinNatural(cushioning)}`);
  }

  if (usageSentences.length) {
    lines.push(usageSentences.join(", ") + ".");
  }

  lines.push("");
  lines.push(
    `Màu hiện có: ${metadata.available_colors.length ? joinNatural(metadata.available_colors) : "Không rõ"}`,
  );
  lines.push(
    `Size hiện có: ${metadata.available_sizes.length ? joinNatural(metadata.available_sizes) : "Không rõ"}`,
  );
  lines.push(`Khoảng giá: ${metadata.min_price} - ${metadata.max_price} VNĐ`);
  lines.push(`Đánh giá: ${metadata.rating} | Đã bán: ${metadata.sold}`);

  return lines.join("\n");
}

const createEmbeddingFromText = async (input) => {
  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL,
      input,
    });
    return response?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error("Create embedding error:", error?.message || error);
    throw new AppError("Không thể tạo embedding", 500, -1);
  }
};

const cosineSimilarity = (a = [], b = []) => {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    b.length === 0
  ) {
    return 0;
  }
  if (a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = Number(a[i]) || 0;
    const y = Number(b[i]) || 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const resolveEmbeddingDimensions = async (requestedDimensions) => {
  const parsedRequested = Number.parseInt(requestedDimensions, 10);
  if (Number.isInteger(parsedRequested) && parsedRequested > 0) {
    return parsedRequested;
  }

  const parsedEnv = Number.parseInt(
    process.env.OPENAI_EMBEDDING_DIMENSIONS,
    10,
  );
  if (Number.isInteger(parsedEnv) && parsedEnv > 0) {
    return parsedEnv;
  }

  const sampleDoc = await KnowledgeChunk.findOne({
    "embedding.0": { $exists: true },
  })
    .select("embedding")
    .lean();
  const sampleDimensions = Array.isArray(sampleDoc?.embedding)
    ? sampleDoc.embedding.length
    : 0;

  if (sampleDimensions > 0) {
    return sampleDimensions;
  }

  return DEFAULT_EMBEDDING_DIMENSIONS;
};

const buildSearchFilters = (options = {}) => {
  const vectorClauses = [];
  const postFilter = {};

  const sourceType = normalizeSourceTypeFilter(options.source_type);
  if (sourceType) {
    vectorClauses.push({ source_type: sourceType });
  }

  const chunkType = normalizeChunkTypeFilter(options.chunk_type);
  if (chunkType) {
    vectorClauses.push({ chunk_type: chunkType });
  }

  if (options.category_id) {
    ensureValidObjectId(options.category_id, "category_id không hợp lệ");
    vectorClauses.push({
      category_id: new mongoose.Types.ObjectId(options.category_id),
    });
  }

  const isActive = parseOptionalBoolean(options.is_active, "is_active");
  if (isActive !== undefined) {
    vectorClauses.push({ is_active: isActive });
  } else {
    vectorClauses.push({ is_active: true });
  }

  if (options.source_id) {
    ensureValidObjectId(options.source_id, "source_id khÃ´ng há»£p lá»‡");
    postFilter.source_id = new mongoose.Types.ObjectId(options.source_id);
  }

  if (options.language) {
    postFilter.language = String(options.language).trim().toLowerCase();
  }

  const vectorFilter =
    vectorClauses.length === 0
      ? null
      : vectorClauses.length === 1
        ? vectorClauses[0]
        : { $and: vectorClauses };

  return {
    vectorFilter,
    postFilter,
    normalizedFilters: {
      source_type: sourceType || null,
      chunk_type: chunkType || null,
      category_id: options.category_id || null,
      is_active: isActive ?? true,
      source_id: options.source_id || null,
      language: options.language
        ? String(options.language).trim().toLowerCase()
        : null,
    },
  };
};

const buildBruteForceFilter = (options = {}) => {
  const dbFilter = {
    "embedding.0": { $exists: true },
  };

  const sourceType = normalizeSourceTypeFilter(options.source_type);
  if (sourceType) {
    dbFilter.source_type = sourceType;
  }

  const chunkType = normalizeChunkTypeFilter(options.chunk_type);
  if (chunkType) {
    dbFilter.chunk_type = chunkType;
  }

  const isActive = parseOptionalBoolean(options.is_active, "is_active");
  dbFilter.is_active = isActive ?? true;

  if (options.category_id) {
    ensureValidObjectId(options.category_id, "category_id không hợp lệ");
    dbFilter.category_id = new mongoose.Types.ObjectId(options.category_id);
  }
  if (options.source_id) {
    ensureValidObjectId(options.source_id, "source_id không hợp lệ");
    dbFilter.source_id = new mongoose.Types.ObjectId(options.source_id);
  }
  if (options.language) {
    dbFilter.language = String(options.language).trim().toLowerCase();
  }

  return dbFilter;
};

const formatRankedResult = (chunks = []) =>
  chunks.map((chunk, index) => ({
    ...chunk,
    rank: index + 1,
    score: Number((chunk.score || 0).toFixed(6)),
  }));

const isVectorSearchError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  if (!message) {
    return false;
  }

  return (
    message.includes("vectorsearch") ||
    message.includes("vector search") ||
    message.includes("search index") ||
    message.includes("index") ||
    message.includes("listsearchindexes") ||
    message.includes("createsearchindexes")
  );
};

const extractVariants = (product) => {
  const variants = [];
  (product.colors || []).forEach((color) => {
    (color.variants || []).forEach((variant) => {
      variants.push(variant);
    });
  });
  return variants;
};

const getProductPriceRange = (product) => {
  const variantPrices = extractVariants(product)
    .map((variant) => Number(variant.variant_price))
    .filter((price) => Number.isFinite(price) && price > 0);

  const basePrice = Number(product.product_price) || 0;
  if (variantPrices.length === 0) {
    return { min_price: basePrice, max_price: basePrice };
  }

  return {
    min_price: Math.min(...variantPrices),
    max_price: Math.max(...variantPrices),
  };
};

const buildKnowledgeMetadataFromProduct = (product) => {
  const variants = extractVariants(product);
  const availableColors = normalizeStringArray(
    (product.colors || []).map((color) => color.color_name),
  );
  const availableSizes = normalizeStringArray(
    variants.map((variant) => variant.variant_size),
  );
  const { min_price, max_price } = getProductPriceRange(product);

  return {
    product_title: product.product_title || null,
    product_brand: product.product_brand || null,
    product_description: product.product_description || null,
    product_category_name: product.product_category?.category_name || null,
    category_slug: product.product_category?.category_slug || null,
    attributes: normalizeAttributes(product.attributes || {}),
    min_price,
    max_price,
    in_stock: Number(product.product_countInStock || 0) > 0,
    display: Boolean(product.product_display),
    rating: Number(product.product_rate || 0),
    sold: Number(product.product_selled || 0),
    available_colors: availableColors,
    available_sizes: availableSizes,
  };
};

const buildKnowledgeContentFromProduct = (metadata) => {
  return buildOverviewContent(metadata);
};

const getProductWithCategory = async (productId) => {
  ensureValidObjectId(productId, "ID sản phẩm không hợp lệ");
  const product = await Product.findById(productId)
    .populate("product_category", "_id category_name category_slug")
    .lean();

  if (!product) {
    throw new AppError("Không tìm thấy sản phẩm", 404, 1);
  }
  return product;
};

const generateKnowledgeChunkDraftFromProduct = async (productId) => {
  const product = await getProductWithCategory(productId);
  const metadata = buildKnowledgeMetadataFromProduct(product);

  return {
    source_type: PRODUCT_SOURCE_TYPE,
    source_id: product._id,
    category_id: product.product_category?._id || null,
    chunk_type: DEFAULT_CHUNK_TYPE,
    title: `Sản phẩm ${product.product_title}`,
    content: buildKnowledgeContentFromProduct(metadata),
    metadata,
    language: "vi",
    is_active: true,
  };
};

const normalizeKnowledgeMetadataPayload = (metadata = {}, fallback = {}) => {
  return {
    ...fallback,
    ...metadata,
    product_title: metadata.product_title ?? fallback.product_title ?? null,
    product_brand: metadata.product_brand ?? fallback.product_brand ?? null,
    product_category_name:
      metadata.product_category_name ?? fallback.product_category_name ?? null,
    category_slug: metadata.category_slug ?? fallback.category_slug ?? null,
    attributes: normalizeAttributes(
      metadata.attributes !== undefined
        ? metadata.attributes
        : fallback.attributes,
    ),
    min_price: Number(metadata.min_price ?? fallback.min_price ?? 0),
    max_price: Number(metadata.max_price ?? fallback.max_price ?? 0),
    in_stock: Boolean(metadata.in_stock ?? fallback.in_stock),
    display: Boolean(metadata.display ?? fallback.display ?? true),
    rating: Number(metadata.rating ?? fallback.rating ?? 0),
    sold: Number(metadata.sold ?? fallback.sold ?? 0),
    available_colors: normalizeStringArray(
      metadata.available_colors !== undefined
        ? metadata.available_colors
        : fallback.available_colors,
    ),
    available_sizes: normalizeStringArray(
      metadata.available_sizes !== undefined
        ? metadata.available_sizes
        : fallback.available_sizes,
    ),
  };
};

const upsertKnowledgeChunkFromProduct = async (productId, payload = {}) => {
  const draft = await generateKnowledgeChunkDraftFromProduct(productId);
  const sourceType = normalizeEnumValue(
    payload.source_type || draft.source_type,
    SOURCE_TYPE_MAP,
    PRODUCT_SOURCE_TYPE,
  );
  const chunkType =
    normalizeEnumValue(payload.chunk_type, CHUNK_TYPE_MAP) || draft.chunk_type;
  const title = String(payload.title || draft.title).trim();
  const content = String(payload.content || draft.content).trim();
  if (!title) {
    throw new AppError("Tiêu đề KnowledgeChunk không được để trống", 400, 1);
  }
  if (!content) {
    throw new AppError("Nội dung KnowledgeChunk không được để trống", 400, 1);
  }
  const metadata = normalizeKnowledgeMetadataPayload(
    payload.metadata,
    draft.metadata,
  );
  const language = String(payload.language || "vi")
    .trim()
    .toLowerCase();
  const is_active =
    payload.is_active === undefined ? true : Boolean(payload.is_active);
  const embedding = await createEmbeddingFromText(content);
  const embeddingModel =
    String(process.env.OPENAI_EMBEDDING_MODEL || "").trim() || null;

  const query = {
    source_type: sourceType,
    source_id: draft.source_id,
    chunk_type: chunkType,
  };

  const existingChunk = await KnowledgeChunk.findOne(query);
  if (!existingChunk) {
    return KnowledgeChunk.create({
      ...query,
      category_id: draft.category_id,
      title,
      content,
      metadata,
      embedding,
      embedding_model: embeddingModel,
      embedding_updated_at: new Date(),
      language,
      is_active,
      version: 1,
    });
  }

  existingChunk.category_id = draft.category_id;
  existingChunk.title = title;
  existingChunk.content = content;
  existingChunk.metadata = metadata;
  existingChunk.embedding = embedding;
  existingChunk.embedding_model = embeddingModel;
  existingChunk.embedding_updated_at = new Date();
  existingChunk.language = language;
  existingChunk.is_active = is_active;
  existingChunk.version = Number(existingChunk.version || 1) + 1;
  await existingChunk.save();

  return existingChunk;
};

const getKnowledgeChunksByProduct = async (productId) => {
  ensureValidObjectId(productId, "ID sản phẩm không hợp lệ");
  return KnowledgeChunk.find({
    source_type: PRODUCT_SOURCE_TYPE,
    source_id: productId,
  }).sort({ updatedAt: -1 });
};

const ensureKnowledgeChunkVectorIndex = async (options = {}) => {
  if (!mongoose.connection?.db) {
    throw new AppError("Chưa kết nối MongoDB", 500, -1);
  }

  const indexName = String(
    options.index_name || DEFAULT_VECTOR_INDEX_NAME,
  ).trim();
  if (!indexName) {
    throw new AppError("index_name không được để trống", 400, 1);
  }

  const requestedSimilarity =
    options.similarity !== undefined
      ? String(options.similarity).trim()
      : DEFAULT_VECTOR_SIMILARITY;
  const similarity = normalizeVectorSimilarity(requestedSimilarity);

  const numDimensions = await resolveEmbeddingDimensions(
    options.num_dimensions,
  );
  const collectionName = KnowledgeChunk.collection.collectionName;
  const db = mongoose.connection.db;

  try {
    await db.command({
      createSearchIndexes: collectionName,
      indexes: [
        {
          name: indexName,
          type: "vectorSearch",
          definition: {
            fields: [
              {
                type: "vector",
                path: "embedding",
                numDimensions,
                similarity,
              },
              { type: "filter", path: "source_type" },
              { type: "filter", path: "chunk_type" },
              { type: "filter", path: "category_id" },
              { type: "filter", path: "is_active" },
            ],
          },
        },
      ],
    });

    return {
      created: true,
      index_name: indexName,
      collection: collectionName,
      num_dimensions: numDimensions,
      similarity,
      message: "Tạo vector index thành công",
    };
  } catch (error) {
    const message = String(error?.message || "");
    if (
      error?.codeName === "IndexAlreadyExists" ||
      message.toLowerCase().includes("already exists")
    ) {
      return {
        created: false,
        index_name: indexName,
        collection: collectionName,
        num_dimensions: numDimensions,
        similarity,
        message: "Vector index đã tồn tại",
      };
    }

    if (
      message.toLowerCase().includes("atlas") ||
      message.toLowerCase().includes("search index")
    ) {
      throw new AppError(
        `Không thể tạo vector index. Kiểm tra MongoDB Atlas Search đã bật chưa. Chi tiết: ${message}`,
        500,
        -1,
      );
    }

    if (message.toLowerCase().includes("command not found")) {
      throw new AppError(
        "MongoDB hiện tại không hỗ trợ createSearchIndexes (Atlas Vector Search). Hãy dùng cluster Atlas hỗ trợ Search Index hoặc nâng cấp môi trường DB.",
        500,
        -1,
      );
    }

    throw new AppError(`Không thể tạo vector index: ${message}`, 500, -1);
  }
};

const searchKnowledgeChunksByQueryBruteForce = async (
  queryText,
  options = {},
) => {
  const query = String(queryText || "").trim();
  if (!query) {
    throw new AppError("Thiếu nội dung truy vấn", 400, 1);
  }

  const topK = normalizeTopK(options.topK);
  const candidateLimit = normalizeNumCandidates(options.numCandidates, topK);
  const queryEmbedding = await createEmbeddingFromText(query);
  const dbFilter = buildBruteForceFilter(options);

  const candidates = await KnowledgeChunk.find(dbFilter)
    .select({
      source_type: 1,
      source_id: 1,
      category_id: 1,
      chunk_type: 1,
      title: 1,
      content: 1,
      metadata: 1,
      embedding: 1,
      language: 1,
      version: 1,
      is_active: 1,
      updatedAt: 1,
    })
    .limit(candidateLimit)
    .lean();

  return candidates
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding || []),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

const semanticRetrieveKnowledgeChunks = async (queryText, options = {}) => {
  const query = String(queryText || "").trim();
  if (!query) {
    throw new AppError("Thiếu nội dung truy vấn", 400, 1);
  }

  const topK = normalizeTopK(options.topK);
  const numCandidates = normalizeNumCandidates(options.numCandidates, topK);
  const allowBruteForceFallback =
    parseOptionalBoolean(
      options.allowBruteForceFallback,
      "allowBruteForceFallback",
    ) ?? false;
  const parsedMinScore = Number(options.minScore);
  const minScore = Number.isFinite(parsedMinScore) ? parsedMinScore : null;
  const indexName = String(
    options.index_name || options.indexName || DEFAULT_VECTOR_INDEX_NAME,
  ).trim();

  if (!indexName) {
    throw new AppError("index_name không được để trống", 400, 1);
  }

  const { vectorFilter, postFilter, normalizedFilters } =
    buildSearchFilters(options);
  const queryEmbedding = await createEmbeddingFromText(query);
  const startedAt = Date.now();

  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: indexName,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates,
          limit: topK,
          ...(vectorFilter ? { filter: vectorFilter } : {}),
        },
      },
      ...(Object.keys(postFilter).length > 0 ? [{ $match: postFilter }] : []),
      {
        $project: {
          source_type: 1,
          source_id: 1,
          category_id: 1,
          chunk_type: 1,
          title: 1,
          content: 1,
          metadata: 1,
          language: 1,
          version: 1,
          is_active: 1,
          updatedAt: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
      ...(minScore !== null ? [{ $match: { score: { $gte: minScore } } }] : []),
      { $limit: topK },
    ];

    const results = await KnowledgeChunk.aggregate(pipeline);
    const rankedResults = formatRankedResult(results);

    return {
      engine: "vector_search",
      query,
      index_name: indexName,
      top_k: topK,
      num_candidates: numCandidates,
      filters: normalizedFilters,
      total: rankedResults.length,
      took_ms: Date.now() - startedAt,
      results: rankedResults,
    };
  } catch (error) {
    if (!allowBruteForceFallback || !isVectorSearchError(error)) {
      throw new AppError(
        `Vector search thất bại. Hãy tạo vector index trước. Chi tiết: ${error?.message || error}`,
        500,
        -1,
      );
    }

    const fallbackResults = await searchKnowledgeChunksByQueryBruteForce(
      query,
      options,
    );
    const rankedResults = formatRankedResult(fallbackResults);

    return {
      engine: "brute_force_fallback",
      query,
      index_name: indexName,
      top_k: topK,
      num_candidates: numCandidates,
      filters: normalizedFilters,
      total: rankedResults.length,
      took_ms: Date.now() - startedAt,
      results: rankedResults,
      fallback_reason: String(error?.message || "Vector search unavailable"),
    };
  }
};

const searchKnowledgeChunksByQuery = async (queryText, options = {}) => {
  const retrieval = await semanticRetrieveKnowledgeChunks(queryText, {
    ...options,
    allowBruteForceFallback:
      options.allowBruteForceFallback === undefined
        ? true
        : options.allowBruteForceFallback,
  });

  return retrieval.results;
};

const rebuildKnowledgeChunkEmbeddings = async (options = {}) => {
  const filter = {};

  if (options.source_type) {
    filter.source_type = String(options.source_type).trim().toLowerCase();
  }
  if (options.language) {
    filter.language = String(options.language).trim().toLowerCase();
  }
  if (options.source_id) {
    ensureValidObjectId(options.source_id, "source_id không hợp lệ");
    filter.source_id = new mongoose.Types.ObjectId(options.source_id);
  }
  if (options.category_id) {
    ensureValidObjectId(options.category_id, "category_id không hợp lệ");
    filter.category_id = new mongoose.Types.ObjectId(options.category_id);
  }
  if (options.only_active !== undefined) {
    filter.is_active = Boolean(options.only_active);
  }

  const chunks = await KnowledgeChunk.find(filter);
  let updated = 0;
  let skipped = 0;

  for (const chunk of chunks) {
    const content = String(chunk.content || "").trim();
    if (!content) {
      skipped += 1;
      continue;
    }

    const embedding = await createEmbeddingFromText(content);
    chunk.embedding = embedding;
    await chunk.save();
    updated += 1;
  }

  return {
    total: chunks.length,
    updated,
    skipped,
  };
};

export {
  createEmbeddingFromText,
  generateKnowledgeChunkDraftFromProduct,
  upsertKnowledgeChunkFromProduct,
  getKnowledgeChunksByProduct,
  ensureKnowledgeChunkVectorIndex,
  semanticRetrieveKnowledgeChunks,
  searchKnowledgeChunksByQuery,
  rebuildKnowledgeChunkEmbeddings,
  buildOverviewContent,
  buildKnowledgeMetadataFromProduct,
};
