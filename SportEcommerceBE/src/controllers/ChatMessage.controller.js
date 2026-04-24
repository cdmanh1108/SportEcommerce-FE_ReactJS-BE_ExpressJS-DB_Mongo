import * as chatMessageService from "../services/ChatMessage.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createChatMessage = async (req, res) => {
  try {
    const result = await chatMessageService.createChatMessage(
      req.body || {},
      req.user,
    );
    return res.success(result, "Tạo tin nhắn thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getChatMessagesByConversation = async (req, res) => {
  try {
    const result = await chatMessageService.getChatMessagesByConversation(
      req.params.conversationId,
      req.query || {},
      req.user,
    );
    return res.success(result, "Lấy danh sách tin nhắn thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getChatMessageById = async (req, res) => {
  try {
    const result = await chatMessageService.getChatMessageById(
      req.params.id,
      req.user,
    );
    return res.success(result, "Lấy chi tiết tin nhắn thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteChatMessage = async (req, res) => {
  try {
    const result = await chatMessageService.deleteChatMessage(
      req.params.id,
      req.user,
    );
    return res.success(result, "Xóa tin nhắn thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export {
  createChatMessage,
  getChatMessagesByConversation,
  getChatMessageById,
  deleteChatMessage,
};
