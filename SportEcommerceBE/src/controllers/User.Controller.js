import {
  getAllUsersService,
  changePasswordService,
  updateUserService,
  addAddressService,
  updateAddressService,
  getUserService,
  saveDiscount,
  getDiscountUser,
  deleteAddressService,
  deleteSearchHistoryService,
} from "../services/User.service.js";
import { uploadAvtUser } from "../utils/UploadUtil.js";
import ChatHistory from "../models/ChatHistory.model.js";
import handleControllerError from "../utils/HandleControllerError.js";

const userController = {
  async getUser(req, res) {
    try {
      const { userId } = req.user;
      const { user } = await getUserService(userId);
      return res.success(user, "Lấy thông tin người dùng thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  // API lấy danh sách user
  async getAllUsers(req, res) {
    try {
      const { users } = await getAllUsersService();
      return res.success(users, "Lấy tất cả người dùng thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async changePassword(req, res) {
    const { email } = req.user; // Lấy email từ token
    const { oldPassword, newPassword } = req.body;

    try {
      const { message } = await changePasswordService(
        email,
        oldPassword,
        newPassword,
      );
      return res.success(null, message);
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async updateUser(req, res) {
    try {
      // Upload avatar nếu có
      const uploadResult = await uploadAvtUser(req, res);

      const { userId } = req.user;
      let dataUpdate = req.body;
      // // Gửi form data nên là string, convert qua JSON
      if (typeof dataUpdate === "string") {
        dataUpdate = JSON.parse(dataUpdate);
      }

      // Nếu có file avatar, thêm vào dataUpdate
      if (uploadResult.success && uploadResult.avatar) {
        dataUpdate.avt_img = uploadResult.avatar; // Đây là đường dẫn avatar file
      }

      const { user } = await updateUserService(userId, dataUpdate);

      return res.success(user, "Thay đổi thông tin thành công!");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async addAddress(req, res) {
    try {
      const { userId } = req.user;
      const newAddress = req.body;
      const result = await addAddressService(userId, newAddress);
      return res.success(
        { addresses: result.addresses },
        "Thêm địa chỉ thành công",
      );
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async updateAddress(req, res) {
    try {
      const { userId } = req.user;
      const index = parseInt(req.params.index);
      const updateData = req.body;
      const result = await updateAddressService(userId, index, updateData);
      return res.success(
        { addresses: result.addresses },
        "Cập nhật địa chỉ thành công",
      );
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async deleteAddress(req, res) {
    try {
      const { userId } = req.user;
      const index = parseInt(req.params.index);
      const result = await deleteAddressService(userId, index);
      return res.success({ addresses: result }, "Xóa địa chỉ thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async saveDiscount(req, res) {
    try {
      const { userId } = req.user;
      const { discount } = req.body;
      const result = await saveDiscount(userId, discount);
      return res.success(result, "Lưu mã giảm giá thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async getDiscountUser(req, res) {
    try {
      const { userId } = req.user;
      const result = await getDiscountUser(userId);
      return res.success(result, "Lấy danh sách mã giảm giá thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async deleteSearchHistory(req, res) {
    try {
      const userId = req.user.userId;
      const index = req.params.index;
      const response = await deleteSearchHistoryService(userId, index);
      return res.success(
        { searchhistory: response },
        "Xóa lịch sử tìm kiếm thành công",
      );
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async getChatHistory(req, res) {
    try {
      const userId = req.user.userId;
      const response = await ChatHistory.findOne({ userId });
      if (!response) {
        return res.error(1, "Không có đoạn chat của user này");
      }
      return res.success(response.messages, "Lấy lịch sử chat thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async deleteChatHistory(req, res) {
    try {
      const userId = req.user.userId;
      const response = await ChatHistory.findOneAndDelete({ userId });
      if (!response) {
        return res.error(1, "Không có đoạn chat của user này");
      }
      return res.success(null, "Xóa đoạn chat thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};

export default userController;
