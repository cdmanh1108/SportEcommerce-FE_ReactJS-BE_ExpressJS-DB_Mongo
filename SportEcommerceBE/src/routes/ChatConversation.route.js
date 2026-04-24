import express from "express";
import * as chatConversationController from "../controllers/ChatConversation.controller.js";
import { verifyToken } from "../middlewares/AuthMiddleWare.js";

const router = express.Router();

router.post("/create", verifyToken, chatConversationController.createChatConversation);
router.get("/get-all", verifyToken, chatConversationController.getChatConversations);
router.get(
  "/get-detail/:id",
  verifyToken,
  chatConversationController.getChatConversationById,
);
router.patch("/update/:id", verifyToken, chatConversationController.updateChatConversation);
router.delete("/delete/:id", verifyToken, chatConversationController.deleteChatConversation);

export default router;
