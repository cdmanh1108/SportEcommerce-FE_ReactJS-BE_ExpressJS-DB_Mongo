import * as knowledgeChunkService from "../services/KnowledgeChunk.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const generateKnowledgeChunkDraftFromProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const result =
      await knowledgeChunkService.generateKnowledgeChunkDraftFromProduct(
        productId,
      );
    return res.success(result, "Tạo nháp KnowledgeChunk từ sản phẩm thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const upsertKnowledgeChunkFromProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await knowledgeChunkService.upsertKnowledgeChunkFromProduct(
      productId,
      req.body,
    );
    return res.success(result, "Lưu KnowledgeChunk từ sản phẩm thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getKnowledgeChunksByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await knowledgeChunkService.getKnowledgeChunksByProduct(
      productId,
    );
    return res.success(
      result,
      "Lấy danh sách KnowledgeChunk theo sản phẩm thành công",
    );
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const vectorSearchKnowledgeChunks = async (req, res) => {
  try {
    const {
      query,
      top_k,
      num_candidates,
      min_score,
      source_type,
      source_id,
      category_id,
      chunk_type,
      is_active,
      language,
      index_name,
      allow_bruteforce_fallback,
    } = req.query;

    const result = await knowledgeChunkService.searchKnowledgeChunksByQuery(
      query,
      {
        topK: top_k,
        numCandidates: num_candidates,
        minScore: min_score,
        source_type,
        source_id,
        category_id,
        chunk_type,
        is_active,
        language,
        index_name,
        allowBruteForceFallback: allow_bruteforce_fallback,
      },
    );

    return res.success(result, "Vector search KnowledgeChunk thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const ensureKnowledgeChunkVectorIndex = async (req, res) => {
  try {
    const payload =
      req.body && Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await knowledgeChunkService.ensureKnowledgeChunkVectorIndex(
      payload || {},
    );
    return res.success(result, "Khởi tạo vector index KnowledgeChunk thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const semanticRetrieveKnowledgeChunks = async (req, res) => {
  try {
    const {
      query,
      top_k,
      num_candidates,
      min_score,
      source_type,
      source_id,
      category_id,
      chunk_type,
      is_active,
      language,
      index_name,
      allow_bruteforce_fallback,
    } = req.query;

    const result = await knowledgeChunkService.semanticRetrieveKnowledgeChunks(
      query,
      {
        topK: top_k,
        numCandidates: num_candidates,
        minScore: min_score,
        source_type,
        source_id,
        category_id,
        chunk_type,
        is_active,
        language,
        index_name,
        allowBruteForceFallback: allow_bruteforce_fallback,
      },
    );

    return res.success(result, "Semantic retrieval KnowledgeChunk thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const rebuildKnowledgeChunkEmbeddings = async (req, res) => {
  try {
    const result = await knowledgeChunkService.rebuildKnowledgeChunkEmbeddings(
      req.body || {},
    );
    return res.success(result, "Tạo lại embedding KnowledgeChunk thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export {
  generateKnowledgeChunkDraftFromProduct,
  upsertKnowledgeChunkFromProduct,
  getKnowledgeChunksByProduct,
  vectorSearchKnowledgeChunks,
  ensureKnowledgeChunkVectorIndex,
  semanticRetrieveKnowledgeChunks,
  rebuildKnowledgeChunkEmbeddings,
};
