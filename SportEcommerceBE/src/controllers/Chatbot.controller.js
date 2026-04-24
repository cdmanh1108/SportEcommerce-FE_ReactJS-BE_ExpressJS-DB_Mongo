import * as ChatbotService from "../services/Chatbot.service.js";
import dotenv from "dotenv";
import handleControllerError from "../utils/HandleControllerError.js";

dotenv.config();

const ChatbotController = {
  async chatWithBot(req, res) {
    const { message, history, conversation_id, page_context } = req.body;
    try {
      const result = await ChatbotService.chatWithBotService(message, req.user, {
        history,
        conversationId: conversation_id,
        pageContext: page_context,
      });
      return res.success(result, "Trò chuyện với chatbot thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async SearchProduct(req, res) {
    const { message } = req.query;
    try {
      const result = await ChatbotService.SearchProductService(message);
      await ChatbotService.appendSearchHistory(req.user, message, result);
      return res.success(result, "Tìm kiếm sản phẩm thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};

export default ChatbotController;
