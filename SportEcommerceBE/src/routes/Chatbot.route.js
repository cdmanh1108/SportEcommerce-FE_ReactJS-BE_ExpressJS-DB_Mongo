// routes/chat.js
import express from "express";
import dotenv from "dotenv";
import { optionalVerifyToken } from "../middlewares/AuthMiddleWare.js";
import ChatbotController from "../controllers/Chatbot.controller.js";

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Trò chuyện với chatbot
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Tin nhắn người dùng gửi cho chatbot
 *                 example: "Tôi cần tìm giày chạy bộ"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       description: Vai trò của người gửi tin nhắn (user/system/assistant)
 *                       example: "user"
 *                     content:
 *                       type: string
 *                       description: Nội dung tin nhắn
 *                       example: "Tôi cần tìm giày chạy bộ"
 *     responses:
 *       200:
 *         description: Trả lời thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 EC:
 *                   type: integer
 *                   example: 0
 *                 EM:
 *                   type: string
 *                   example: "Trả lời thành công"
 *                 data:
 *                   type: string
 *                   example: "Đây là các loại giày chạy bộ mà bạn có thể tham khảo..."
 *       400:
 *         description: Lỗi yêu cầu không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */
router.post("/", optionalVerifyToken, ChatbotController.chatWithBot);
/**
 * @swagger
 * /chat:
 *   get:
 *     summary: Tìm kiếm sản phẩm qua chatbot
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: message
 *         required: true
 *         description: Tin nhắn tìm kiếm sản phẩm của người dùng
 *         schema:
 *           type: string
 *           example: "Tôi muốn tìm giày thể thao"
 *     responses:
 *       200:
 *         description: Trả về kết quả tìm kiếm sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 EC:
 *                   type: integer
 *                   example: 0
 *                 EM:
 *                   type: string
 *                   example: "Trả lời thành công"
 *                 data:
 *                   type: string
 *                   example: '{"category": "Giày", "category_gender": "Nam", "product_color": "Đen", "price_min": 500000, "price_max": 1500000}'
 *       400:
 *         description: Lỗi yêu cầu không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */
router.get("/", optionalVerifyToken, ChatbotController.SearchProduct);

export default router;
