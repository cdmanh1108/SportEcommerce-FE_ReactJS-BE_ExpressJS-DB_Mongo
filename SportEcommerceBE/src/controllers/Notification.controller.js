import * as notificationService from "../services/Notification.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createNotificationForAll = async (req, res) => {
  try {
    const notificationData = req.body;

    const result =
      await notificationService.createNotificationForAll(notificationData);
    return res.success(
      { total_created: result },
      "Tạo thông báo cho tất cả người dùng thành công",
    );
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const readNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const result = await notificationService.readNotification(notificationId);

    return res.success(result, "Đọc thông báo thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getNotification = async (req, res) => {
  const notificationId = req.params.id;
  try {
    const result = await notificationService.getNotification(notificationId);

    return res.success(result, "Lấy thông tin thông báo thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getUserNotifications = async (req, res) => {
  const { userId } = req.user;
  try {
    const result = await notificationService.getUserNotifications(userId);
    return res.success(result, "Lấy danh sách thông báo thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getAllNotification = async (req, res) => {
  try {
    const result = await notificationService.getAllNotification();

    return res.success(result, "Lấy tất cả thông báo thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const currentUser = req.user;
    const notificationId = req.params.id;

    const result = await notificationService.deleteNotification(
      notificationId,
      currentUser,
    );

    return res.success(null, result.message);
  } catch (error) {
    return handleControllerError(res, error);
  }
};
export {
  createNotificationForAll,
  readNotification,
  getNotification,
  getAllNotification,
  deleteNotification,
  getUserNotifications,
};
