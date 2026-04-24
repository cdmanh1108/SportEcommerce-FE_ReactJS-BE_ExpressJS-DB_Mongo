import express from "express";
import * as KnowledgeChunkController from "../controllers/KnowledgeChunk.controller.js";
import { verifyToken, identifyAdmin } from "../middlewares/AuthMiddleWare.js";

const router = express.Router();

router.get(
  "/generate-from-product/:productId",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.generateKnowledgeChunkDraftFromProduct,
);

router.post(
  "/upsert-from-product/:productId",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.upsertKnowledgeChunkFromProduct,
);

router.get(
  "/get-by-product/:productId",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.getKnowledgeChunksByProduct,
);

router.get(
  "/vector-search",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.vectorSearchKnowledgeChunks,
);

router.post(
  "/vector-index/ensure",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.ensureKnowledgeChunkVectorIndex,
);

router.get(
  "/semantic-retrieval",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.semanticRetrieveKnowledgeChunks,
);

router.post(
  "/rebuild-embeddings",
  verifyToken,
  identifyAdmin,
  KnowledgeChunkController.rebuildKnowledgeChunkEmbeddings,
);

export default router;
