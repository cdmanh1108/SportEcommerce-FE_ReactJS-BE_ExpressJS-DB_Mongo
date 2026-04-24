import * as chatConversationService from "../services/ChatConversation.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createChatConversation = async (req, res) => {
  try {
    const result = await chatConversationService.createChatConversation(
      req.body || {},
      req.user,
    );
    return res.success(result, "Tạo cuộc trò chuyện thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getChatConversations = async (req, res) => {
  try {
    const result = await chatConversationService.getChatConversations(
      req.query || {},
      req.user,
    );
    return res.success(result, "Lấy danh sách cuộc trò chuyện thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getChatConversationById = async (req, res) => {
  try {
    const result = await chatConversationService.getChatConversationById(
      req.params.id,
      req.user,
    );
    return res.success(result, "Lấy chi tiết cuộc trò chuyện thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateChatConversation = async (req, res) => {
  try {
    const result = await chatConversationService.updateChatConversation(
      req.params.id,
      req.body || {},
      req.user,
    );
    return res.success(result, "Cập nhật cuộc trò chuyện thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteChatConversation = async (req, res) => {
  try {
    const result = await chatConversationService.deleteChatConversation(
      req.params.id,
      req.user,
    );
    return res.success(result, "Xóa cuộc trò chuyện thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export {
  createChatConversation,
  getChatConversations,
  getChatConversationById,
  updateChatConversation,
  deleteChatConversation,
};
