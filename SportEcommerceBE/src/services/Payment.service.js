import Order from "../models/Order.model.js";
import payOS from "../config/PayOS.js";
import dotenv from "dotenv";
import AppError from "../utils/AppError.js";

dotenv.config();

const createPaymentService = async (
  orderCode,
  amount,
  description,
  products,
  orderId,
) => {
  const DOMAIN = process.env.DOMAIN;
  const items = products.map((item) => ({
    name: `${item.product_name} ${item.color} Size ${item.variant}`,
    quantity: item.quantity,
    price: item.product_price,
  }));

  const body = {
    orderCode,
    amount: 2000,
    description,
    items,
    returnUrl: `${DOMAIN}/orders/order-details/${orderId}`,
    cancelUrl: `${DOMAIN}/checkout`,
  };

  const result = await payOS.createPaymentLink(body);
  if (!result) {
    throw new AppError("Tạo thông tin thanh toán không thành công", 500, 1);
  }

  const order = await Order.findOne({ order_code: orderCode });
  if (!order) {
    throw new AppError(
      "Không tìm thấy đơn hàng để cập nhật link thanh toán",
      404,
      1,
    );
  }

  order.checkoutUrl = result.checkoutUrl;
  await order.save();

  return result;
};

const handleWebhookService = async (data, signature) => {
  const isValid = payOS.verifyPaymentWebhookData(data, signature);
  if (!isValid) {
    throw new AppError("Xác thực đơn hàng không thành công", 403, 2);
  }

  if (data.code === "00" && data.desc === "success") {
    const order = await Order.findOne({ order_code: data.data.orderCode });
    if (!order) {
      throw new AppError("Đơn hàng không tồn tại", 404, 1);
    }

    order.is_paid = true;
    await order.save();
    return { message: "Xác nhận thanh toán thành công" };
  }

  throw new AppError("Thanh toán đơn hàng thất bại", 400, 3);
};

const getInfoOfPaymentService = async (orderCode) => {
  const result = await payOS.getPaymentLinkInformation(orderCode);
  if (!result) {
    throw new AppError("Không tìm thấy thông tin thanh toán", 404, 1);
  }

  return result;
};

const deletePaymentService = async (orderCode) => {
  const result = await payOS.cancelPaymentLink(
    orderCode,
    "Người dùng không thực hiện thanh toán hoặc hủy",
  );

  if (!result) {
    throw new AppError("Không tìm thấy thông tin thanh toán", 404, 1);
  }

  return result;
};

const checkPaymentIsCancelService = async (orderCode) => {
  const result = await payOS.getPaymentLinkInformation(orderCode);
  if (!result) return false;
  return result.status === "CANCELLED";
};

export {
  createPaymentService,
  handleWebhookService,
  getInfoOfPaymentService,
  deletePaymentService,
  checkPaymentIsCancelService,
};
