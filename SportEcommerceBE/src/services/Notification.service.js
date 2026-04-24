import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";

const createNotificationForAll = async (notificationData) => {
  const users = await User.find({}, "_id");

  if (!users || users.length === 0) {
    throw new AppError("Không có người dùng nào trong hệ thống", 404, 1);
  }

  const notifications = users.map((user) => ({
    ...notificationData,
    user_id: user._id,
  }));

  await Notification.insertMany(notifications);

  return notifications.length;
};

const readNotification = async (notificationId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError("Thông báo không tồn tại", 404, 1);
  }

  const updatedNotification = await Notification.findByIdAndUpdate(
    notificationId,
    { $set: { isRead: true } },
    { new: true, runValidators: true },
  );

  return updatedNotification;
};

const getNotification = async (notificationId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError("Thông báo không tồn tại", 404, 1);
  }
  return notification;
};

const getUserNotifications = async (userId) => {
  const notifications = await Notification.find({ user_id: userId }).sort({
    createdAt: -1,
  });
  return notifications;
};

const getAllNotification = async () => {
  const notification = await Notification.find({});
  return notification;
};

const deleteNotification = async (notificationId, currentUser) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError("Thông báo không tồn tại", 404, 1);
  }
  if (currentUser.role !== "admin") {
    if (
      !notification.user_id ||
      notification.user_id.toString() !== currentUser.userId
    ) {
      throw new AppError("Bạn không có quyền xóa thông báo này", 403, 2);
    }
  }
  await notification.delete();
  return { message: "Xóa thông báo thành công" };
};

const createNotificationForUser = async (userId, notificationData) => {
  const notification = new Notification({
    ...notificationData,
    user_id: userId,
  });

  await notification.save();

  return notification;
};

export {
  createNotificationForAll,
  createNotificationForUser,
  readNotification,
  getNotification,
  getAllNotification,
  deleteNotification,
  getUserNotifications,
};
