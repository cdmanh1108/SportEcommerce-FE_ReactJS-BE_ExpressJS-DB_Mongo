import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Discount from "../models/Discount.model.js";
import User from "../models/User.model.js";
import Cart from "../models/Cart.model.js";
import { createNotificationForUser } from "./Notification.service.js";
import {
  createPaymentService,
  checkPaymentIsCancelService,
} from "./Payment.service.js";
import { logActivityHistory } from "./LoginHistory.service.js";
import AppError from "../utils/AppError.js";
import { getIO } from "./Socket.service.js";

const VALID_ORDER_STATUSES = [
  "Chờ xác nhận",
  "Đang chuẩn bị hàng",
  "Đang giao",
  "Hoàn thành",
  "Hoàn hàng",
  "Hủy hàng",
  "Yêu cầu hoàn",
];

const createOrder = async (newOrder, user_id) => {
  const {
    shipping_address,
    products,
    order_payment_method,
    order_note,
    discount_ids,
  } = newOrder;

  if (!shipping_address) {
    throw new AppError("Địa chỉ là bắt buộc", 400, 2);
  }

  if (!order_payment_method) {
    throw new AppError("Phương thức thanh toán là bắt buộc", 400, 3);
  }

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new AppError("Yêu cầu phải có sản phẩm", 400, 1);
  }

  let delivery_fee = 50000;
  let order_total_price = 0;
  const productMap = new Map();

  for (const item of products) {
    if (!productMap.has(item.product_id)) {
      productMap.set(item.product_id, []);
    }
    productMap.get(item.product_id).push(item);
  }

  const orderProducts = [];

  for (const [productId, items] of productMap.entries()) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(`Không tìm thấy sản phẩm: ${productId}`, 404, 2);
    }

    let totalQuantity = 0;

    for (const item of items) {
      const color = product.colors.find(
        (c) => c.color_name === item.color_name,
      );
      if (!color) {
        throw new AppError(
          `Không tìm thấy màu sản phẩm: ${item.color_name}`,
          404,
          3,
        );
      }

      const variant = color.variants.find(
        (v) => v.variant_size === item.variant_name,
      );
      if (!variant) {
        throw new AppError(
          `Không tìm thấy size sản phẩm: ${item.variant_name}`,
          404,
          4,
        );
      }

      if (variant.variant_countInStock < item.quantity) {
        throw new AppError(`Sản phẩm ${item.product_id} đã hết hàng`, 400, 5);
      }

      variant.variant_countInStock -= item.quantity;
      totalQuantity += item.quantity;

      orderProducts.push({
        product_id: product._id,
        product_name: product.product_title,
        quantity: item.quantity,
        color: item.color_name,
        variant: item.variant_name,
        product_order_type: item.product_order_type || "default",
        product_price: variant.variant_price * item.quantity,
        category_id: product.category_id,
      });
    }

    product.product_selled += totalQuantity;
    product.product_countInStock -= totalQuantity;
    await product.save();
  }

  order_total_price = orderProducts.reduce(
    (total, item) => total + item.product_price,
    0,
  );

  let totalDiscount = 0;
  if (discount_ids?.length > 0) {
    const discounts = await Discount.find({ _id: { $in: discount_ids } });

    for (const discount of discounts) {
      const now = new Date();
      if (
        discount.discount_start_day > now ||
        discount.discount_end_day < now
      ) {
        continue;
      }

      if (order_total_price < discount.min_order_value) {
        continue;
      }

      if (discount.discount_type === "product") {
        totalDiscount = (discount.discount_number / 100) * order_total_price;
      } else if (discount.discount_type === "shipping") {
        delivery_fee -= (delivery_fee * discount.discount_number) / 100;
        if (delivery_fee < 0) delivery_fee = 0;
      }
    }

    await Discount.updateMany(
      { _id: { $in: discount_ids } },
      { $inc: { discount_amount: -1 } },
    );
  }

  const order_total_final = order_total_price + delivery_fee - totalDiscount;

  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(
    estimatedDeliveryDate.getDate() + Math.floor(Math.random() * 5) + 3,
  );

  await User.updateOne(
    { _id: user_id },
    { $inc: { user_loyalty: order_total_final * 0.0001 } },
    {
      $pull: {
        discounts: { $in: discount_ids || [] },
      },
    },
  );

  const orderCode = Math.floor(Math.random() * 900000) + 100000;

  const newOrderData = new Order({
    user_id,
    shipping_address,
    products: orderProducts,
    discount_ids,
    delivery_fee,
    order_total_price,
    order_total_discount: totalDiscount,
    order_total_final,
    order_payment_method,
    order_note,
    order_status: "Chờ xác nhận",
    estimated_delivery_date: estimatedDeliveryDate,
    is_feedback: false,
    order_code: orderCode,
  });

  const savedOrder = await newOrderData.save();
  let resultPayOS = null;

  if (order_payment_method === "Paypal") {
    const description = `Thanh toán đơn #${orderCode}`;
    resultPayOS = await createPaymentService(
      orderCode,
      order_total_final,
      description,
      orderProducts,
      savedOrder._id.toString(),
    );
  }

  if (user_id) {
    await Cart.updateOne({ user_id }, { $set: { products: [] } });
  }

  return {
    ...savedOrder.toObject(),
    resultPayOS,
  };
};

const getAllOrder = async (orderStatus = "all") => {
  const filter = {};

  if (orderStatus.toLowerCase() !== "all") {
    const adminVisibleStatuses = [
      "Chờ xác nhận",
      "Đang chuẩn bị hàng",
      "Đang giao",
      "Hoàn thành",
      "Hoàn hàng",
      "Hủy hàng",
    ];

    if (!adminVisibleStatuses.includes(orderStatus)) {
      throw new AppError("Trạng thái đơn hàng không hợp lệ", 400, 1);
    }

    filter.order_status = orderStatus;
  }

  return Order.find(filter);
};

const getOrderByUser = async (userId, orderStatus) => {
  if (!userId) {
    throw new AppError("Mã khách hàng là bắt buộc", 400, 1);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404, 2);
  }

  const filter = { user_id: userId };

  if (orderStatus && orderStatus.toLowerCase() !== "all") {
    const userVisibleStatuses = [
      "Chờ xác nhận",
      "Đang chuẩn bị hàng",
      "Đang giao",
      "Hoàn thành",
      "Hoàn hàng",
      "Hủy hàng",
    ];

    if (!userVisibleStatuses.includes(orderStatus)) {
      throw new AppError("Trạng thái đơn hàng không hợp lệ", 400, 3);
    }

    filter.order_status = orderStatus;
  }

  return Order.find(filter).populate("products.product_id");
};

const previewOrder = async (newOrder, userId) => {
  const {
    shipping_address,
    products,
    order_status = "Chờ xác nhận",
    order_payment_method,
    order_note,
    discount_ids,
  } = newOrder;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new AppError("Danh sách sản phẩm là bắt buộc", 400, 1);
  }

  let delivery_fee = 50000;
  let order_total_price = 0;

  const orderProducts = await Promise.all(
    products.map(async (item) => {
      const product = await Product.findById(item.product_id);
      if (!product) {
        throw new AppError(
          `Không tìm thấy sản phẩm: ${item.product_id}`,
          404,
          2,
        );
      }

      const color = product.colors.find((c) => c._id.toString() === item.color);
      if (!color) {
        throw new AppError(`Không tìm thấy màu: ${item.color_id}`, 404, 3);
      }

      const variant = color.variants.find(
        (v) => v._id.toString() === item.variant,
      );
      if (!variant) {
        throw new AppError(`Không tìm thấy mẫu: ${item.variant_id}`, 404, 4);
      }

      if (variant.variant_countInStock < item.quantity) {
        throw new AppError(`Sản phẩm ${item.product_id} đã hết hàng`, 400, 5);
      }

      return {
        product_id: product._id,
        quantity: item.quantity,
        color: item.color,
        variant: item.variant,
        product_order_type: item.product_order_type || "default",
        product_price: variant.variant_price * item.quantity,
        category_id: product.category_id,
      };
    }),
  );

  order_total_price = orderProducts.reduce(
    (total, item) => total + item.product_price,
    0,
  );

  let totalDiscount = 0;
  if (discount_ids?.length > 0) {
    const discounts = await Discount.find({ _id: { $in: discount_ids } });

    for (const discount of discounts) {
      const now = new Date();
      if (
        discount.discount_start_day > now ||
        discount.discount_end_day < now
      ) {
        continue;
      }

      if (order_total_price < discount.min_order_value) {
        continue;
      }

      if (discount.discount_type === "product") {
        let discountableTotal = 0;
        orderProducts.forEach((item) => {
          if (
            discount.applicable_products.some((p) => p.equals(item.product_id)) ||
            discount.applicable_categories.some((c) => c.equals(item.category_id))
          ) {
            discountableTotal += item.product_price;
          }
        });

        if (discountableTotal > 0) {
          totalDiscount += (discountableTotal * discount.discount_number) / 100;
        }
      } else if (discount.discount_type === "shipping") {
        delivery_fee -= (delivery_fee * discount.discount_number) / 100;
        if (delivery_fee < 0) delivery_fee = 0;
      }
    }
  }

  const order_total_final = order_total_price + delivery_fee - totalDiscount;

  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(
    estimatedDeliveryDate.getDate() + Math.floor(Math.random() * 5) + 3,
  );

  return {
    user_id: userId,
    products: orderProducts,
    delivery_fee,
    shipping_address,
    order_status,
    order_payment_method,
    order_note,
    discount_ids,
    order_total_price,
    order_total_final,
    order_total_discount: totalDiscount,
    estimated_delivery_date: estimatedDeliveryDate,
  };
};

const updateStatus = async (
  orderId,
  status,
  currentUserId,
  currentUserRole,
  login_history_id,
  options = { bypassPermission: false },
) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404, 1);
  }

  const isOwner = order.user_id.toString() === currentUserId;
  const isAdmin = currentUserRole === "admin";
  const currentStatus = order.order_status;

  const canUpdateOrderStatus = ({ currentStatus, newStatus, isOwner }) => {
    if (options.bypassPermission) return true;

    const disallowedTargets = ["Yêu cầu hoàn", "Hoàn hàng", "Hủy hàng"];
    if (isAdmin) {
      if (currentStatus === "Hoàn thành") return false;
      if (["Hủy hàng", "Hoàn hàng"].includes(currentStatus)) return false;
      if (
        ["Chờ xác nhận", "Đang chuẩn bị hàng", "Đang giao"].includes(
          currentStatus,
        )
      ) {
        return !disallowedTargets.includes(newStatus);
      }
      if (
        currentStatus === "Yêu cầu hoàn" &&
        ["Hoàn hàng", "Hoàn thành"].includes(newStatus)
      ) {
        return true;
      }
      return false;
    }

    if (
      isOwner &&
      currentStatus === "Chờ xác nhận" &&
      newStatus === "Hủy hàng"
    ) {
      return true;
    }

    if (
      isOwner &&
      currentStatus === "Hoàn thành" &&
      newStatus === "Yêu cầu hoàn"
    ) {
      return true;
    }

    if (
      isOwner &&
      currentStatus === "Yêu cầu hoàn" &&
      newStatus === "Hoàn thành"
    ) {
      return true;
    }

    return false;
  };

  if (
    !canUpdateOrderStatus({
      currentStatus,
      newStatus: status,
      isOwner,
    })
  ) {
    throw new AppError("Không thể cập nhật, hãy kiểm tra lại trạng thái", 403, 403);
  }

  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new AppError("Invalid order status", 400, 2);
  }

  const updateFields = {
    order_status: status,
  };

  if (isAdmin && status === "Hoàn thành") {
    updateFields.is_paid = true;
    updateFields.received_date = new Date();
  }

  if (isOwner && status === "Yêu cầu hoàn") {
    updateFields.is_require_refund = true;
  }

  const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!updatedOrder) {
    throw new AppError("Cập nhật đơn hàng không thành công", 500, 3);
  }

  if (["Hủy hàng", "Hoàn hàng"].includes(status)) {
    try {
      const updateStockPromises = order.products.map(async (product) => {
        const productInfo = await Product.findById(product.product_id);
        if (!productInfo) return null;

        const color = productInfo.colors.find(
          (c) => c.color_name === product.color,
        );
        if (!color) return null;

        const variantIndex = color.variants.findIndex(
          (v) => v.variant_size === product.variant,
        );
        if (variantIndex === -1) return null;

        color.variants[variantIndex].variant_countInStock += product.quantity;
        productInfo.product_countInStock += product.quantity;
        return productInfo.save();
      });

      await Promise.all(updateStockPromises);
    } catch (error) {
      throw new AppError("Lỗi khi hoàn hàng về kho", 500, 4);
    }
  }

  const sendOrderStatusNotification = async () => {
    const role = options.bypassPermission
      ? "system"
      : isAdmin
        ? "admin"
        : "owner";

    const descMap = {
      admin: {
        "Đang chuẩn bị hàng": "Đơn hàng của bạn đang được chuẩn bị.",
        "Đang giao": "Đơn hàng đang được giao đến bạn.",
        "Hoàn thành":
          order.order_status === "Yêu cầu hoàn"
            ? "Rất tiếc, yêu cầu hoàn hàng của bạn không được chấp nhận."
            : "Đơn hàng đã được giao, cảm ơn bạn đã mua hàng tại WTM Sport!",
        "Hoàn hàng": "Đơn hàng đã được hoàn trả thành công.",
      },
      owner: {
        "Yêu cầu hoàn":
          "Yêu cầu hoàn hàng của bạn đã được tiếp nhận, vui lòng chờ để được liên hệ làm việc.",
        "Hủy hàng": "Đơn hàng của bạn đã được hủy, xin lỗi quý khách.",
      },
      system: {
        "Hủy hàng":
          "Đơn hàng của bạn đã bị hủy do quá thời gian thanh toán, vui lòng đặt lại đơn hàng nếu cần.",
      },
    };

    const imageMap = {
      admin: {
        "Đang chuẩn bị hàng":
          "https://media.istockphoto.com/id/1372074867/vi/vec-to/chu%E1%BA%A9n-b%E1%BB%8B-s%C6%A1-b%E1%BB%99.jpg",
        "Đang giao":
          "https://dungculambanh.com.vn/wp-content/uploads/freight-icon-png-11.png",
        "Hoàn thành":
          order.order_status === "Yêu cầu hoàn"
            ? "https://vietcalib.vn/wp-content/uploads/2023/02/Icon-doi-tra.png"
            : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfz3upZJUzgki4bn27faJf6gPIIo7Yo5HxZg&s",
        "Hoàn hàng":
          "https://beewatch.vn/wp-content/uploads/2021/07/Icon-Doi-Tra-Hang.jpg",
      },
      owner: {
        "Yêu cầu hoàn":
          "https://icon-library.com/images/cancelled-icon/cancelled-icon-4.jpg",
        "Hủy hàng":
          "https://png.pngtree.com/png-clipart/20240513/original/pngtree-help-desk-icon-reception-info-professional-photo-png-image_15081159.png",
      },
      system: {
        "Hủy hàng":
          "https://img.freepik.com/premium-vector/payment-canceled-illustration_8499-3034.jpg",
      },
    };

    const notify_desc = descMap[role]?.[status];
    const img = imageMap[role]?.[status];

    if (notify_desc && img) {
      const newNotification = await createNotificationForUser(updatedOrder.user_id, {
        notify_type: "Tình trạng đơn hàng",
        notify_title: `Đơn hàng #${updatedOrder._id} đã được cập nhật.`,
        notify_desc,
        order_id: updatedOrder._id,
        img,
      });

      try {
        const io = getIO();
        io.to(updatedOrder.user_id.toString()).emit("newNotification", {
          ...(newNotification.toObject ? newNotification.toObject() : newNotification),
          notify_type: "Tình trạng đơn hàng",
          notify_title: `Đơn hàng #${updatedOrder._id} đã được cập nhật.`,
          notify_desc,
          img
        });
      } catch (error) {
        console.error("Socket emit error:", error);
      }
    }
  };

  await sendOrderStatusNotification();

  if (isAdmin && login_history_id) {
    await logActivityHistory({
      login_history_id,
      activity: {
        action: "Cập nhật trạng thái đơn hàng",
        order_id: updatedOrder._id,
        prev_status: currentStatus,
        new_status: status,
      },
    });
  }

  return updatedOrder;
};

const getDetailOrder = async (orderId, user) => {
  const order = await Order.findById(orderId).populate("products.product_id");
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404, 1);
  }

  if (
    order.user_id &&
    user?.role !== "admin" &&
    order.user_id.toString() !== user?.userId
  ) {
    throw new AppError("Bạn không có quyền truy cập đơn hàng này", 403, 2);
  }

  return order;
};

const handleCancelPaymentService = async (
  orderCode,
  currentUserId,
  currentUserRole,
) => {
  if (!orderCode) {
    throw new AppError("Mã đơn hàng là bắt buộc", 400, 1);
  }

  const isCancelled = await checkPaymentIsCancelService(orderCode);
  if (!isCancelled) {
    throw new AppError("Thông tin thanh toán không hợp lệ", 400, 2);
  }

  const order = await Order.findOne({ order_code: orderCode });
  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404, 3);
  }

  if (order.order_payment_method === "Paypal" && order.is_paid === false) {
    const result = await updateStatus(
      order._id,
      "Hủy hàng",
      currentUserId,
      currentUserRole,
      null,
      { bypassPermission: true },
    );
    return result;
  }

  throw new AppError("Không thể hủy đơn hàng", 400, 4);
};

const getRevenue = async (year) => {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${parseInt(year, 10) + 1}-01-01`);
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $facet: {
        byMonth: [
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                status: "$order_status",
                payment: "$is_paid",
              },
              total: { $sum: "$order_total_final" },
            },
          },
        ],
      },
    },
  ]);

  const { byMonth } = result[0];

  const fullMonthly = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const filtered = byMonth.filter((b) => b._id.month === month);
    const completedRevenue = filtered
      .filter((f) => f._id.status === "Hoàn thành")
      .reduce((acc, curr) => acc + curr.total, 0);
    const cancelledRevenue = filtered
      .filter((f) => f._id.status === "Hủy hàng")
      .reduce((acc, curr) => acc + curr.total, 0);
    const paidRevenue = filtered
      .filter((f) => f._id.payment === true)
      .reduce((acc, curr) => acc + curr.total, 0);

    return {
      month,
      completedRevenue,
      cancelledRevenue,
      paidRevenue,
    };
  });

  return {
    revenueByMonth: fullMonthly,
  };
};

export {
  createOrder,
  getAllOrder,
  getOrderByUser,
  previewOrder,
  updateStatus,
  getDetailOrder,
  handleCancelPaymentService,
  getRevenue,
};
