import express from "express";
import * as chatMessageController from "../controllers/ChatMessage.controller.js";
import { verifyToken } from "../middlewares/AuthMiddleWare.js";

const router = express.Router();

router.post("/create", verifyToken, chatMessageController.createChatMessage);
router.get(
  "/get-by-conversation/:conversationId",
  verifyToken,
  chatMessageController.getChatMessagesByConversation,
);
router.get("/get-detail/:id", verifyToken, chatMessageController.getChatMessageById);
router.delete("/delete/:id", verifyToken, chatMessageController.deleteChatMessage);

export default router;
