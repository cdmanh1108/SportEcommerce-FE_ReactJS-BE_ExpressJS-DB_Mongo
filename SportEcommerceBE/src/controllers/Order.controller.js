// import { rawListeners } from "../models/Product.model.js";
import * as orderService from "../services/Order.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createOrder = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    const newOrder = { ...req.body };
    const response = await orderService.createOrder(newOrder, userId);
    return res.success(response, "Đơn hàng được tạo thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getAllOrder = async (req, res) => {
  try {
    const { orderStatus } = req.query;
    const response = await orderService.getAllOrder(orderStatus);
    return res.success(response, "Lấy danh sách đơn hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getOrderByUser = async (req, res) => {
  try {
    const { orderStatus } = req.query;
    const { userId } = req.user;
    const response = await orderService.getOrderByUser(userId, orderStatus);
    return res.success(response, "Lấy danh sách đơn hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const previewOrder = async (req, res) => {
  try {
    const newOrder = req.body;
    const { userId } = req.user;
    const response = await orderService.previewOrder(newOrder, userId);
    return res.success(response, "Xem trước đơn hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const statusOrder = req.body.status;
    const { userId, role, login_history_id } = req.user;
    const response = await orderService.updateStatus(
      orderId,
      statusOrder,
      userId,
      role,
      login_history_id,
    );
    return res.success(response, "Cập nhật trạng thái đơn hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getDetailOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = req?.user;
    const response = await orderService.getDetailOrder(orderId, user);

    return res.success(response, "Xem chi tiết đơn hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const handleCancelPayment = async (req, res) => {
  try {
    const orderCode = req.params.orderCode;
    const { userId, role } = req.user;

    const response = await orderService.handleCancelPaymentService(
      orderCode,
      userId,
      role,
    );
    return res.success(response, "Hủy đơn hàng thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getRevenue = async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const result = await orderService.getRevenue(year);
    return res.success(result, "Lấy thống kê thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};
export {
  createOrder,
  getAllOrder,
  getOrderByUser,
  previewOrder,
  updateStatus,
  getDetailOrder,
  handleCancelPayment,
  getRevenue,
  // deleteOrder
};
