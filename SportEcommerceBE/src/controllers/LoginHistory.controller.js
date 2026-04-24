import {
  getLoginHistoryService,
  getLoginHistoryByIdService,
} from "../services/LoginHistory.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const loginHistoryController = {
  async getLoginHistory(req, res) {
    try {
      const result = await getLoginHistoryService();
      return res.success(result, "Lấy lịch sử đăng nhập thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async getLoginHistoryById(req, res) {
    try {
      const id = req.params.id;
      const result = await getLoginHistoryByIdService(id);
      return res.success(result, "Lấy chi tiết lịch sử đăng nhập thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};

export default loginHistoryController;
