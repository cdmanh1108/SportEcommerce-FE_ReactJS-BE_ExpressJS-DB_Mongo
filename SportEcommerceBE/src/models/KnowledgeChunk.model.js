import mongoose from "mongoose";

const SOURCE_TYPE_ENUM = [
  "product",
  "faq",
  "policy",
  "size_guide",
  "category_guide",
];

const CHUNK_TYPE_ENUM = [
  "overview",
  "specification",
  "advice",
  "policy",
  "faq",
];

const metadataAttributeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_]+$/,
    },
    values: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const knowledgeChunkSchema = new mongoose.Schema(
  {
    source_type: {
      type: String,
      enum: SOURCE_TYPE_ENUM,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    chunk_type: {
      type: String,
      enum: CHUNK_TYPE_ENUM,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      product_title: { type: String, default: null, trim: true },
      product_brand: { type: String, default: null, trim: true },
      product_category_name: { type: String, default: null, trim: true },
      category_slug: {
        type: String,
        default: null,
        trim: true,
        lowercase: true,
      },
      attributes: { type: [metadataAttributeSchema], default: [] },
      min_price: { type: Number, default: 0 },
      max_price: { type: Number, default: 0 },
      in_stock: { type: Boolean, default: false },
      display: { type: Boolean, default: true },
      rating: { type: Number, default: 0 },
      sold: { type: Number, default: 0 },
      available_colors: { type: [String], default: [] },
      available_sizes: { type: [String], default: [] },
    },
    embedding: {
      type: [Number],
      default: [],
    },
    embedding_model: {
      type: String,
      default: null,
      trim: true,
    },
    embedding_updated_at: {
      type: Date,
      default: null,
    },
    language: {
      type: String,
      default: "vi",
      trim: true,
      lowercase: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "KnowledgeChunk",
  },
);

knowledgeChunkSchema.index(
  { source_type: 1, source_id: 1, chunk_type: 1 },
  { unique: true },
);
knowledgeChunkSchema.index({ category_id: 1, is_active: 1 });
const KnowledgeChunk = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
export default KnowledgeChunk;
