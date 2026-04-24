import Discount from "../models/Discount.model.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";
import { createNotificationForAll } from "../services/Notification.service.js";
import AppError from "../utils/AppError.js";

const createDiscount = async (newDiscount) => {
  const existingDiscount = await Discount.findOne({
    discount_code: newDiscount.discount_code,
  });
  if (existingDiscount) {
    throw new AppError("Mã giảm giá này đã tồn tại", 400, 1);
  }
  const discountData = new Discount(newDiscount);
  await discountData.save();
  await User.updateMany(
    {},
    {
      $push: {
        discounts: discountData._id,
      },
    },
  );
  const startDate = new Date(
    discountData.discount_start_day,
  ).toLocaleDateString("vi-VN");
  const endDate = new Date(discountData.discount_end_day).toLocaleDateString(
    "vi-VN",
  );
  await createNotificationForAll({
    notify_type: "Khuyến mãi",
    notify_title: `Ưu đãi mới: ${discountData.discount_title}`,
    notify_desc: `Từ ${startDate} đến ${endDate}, sử dụng mã "${discountData.discount_code}" để nhận giảm giá ${discountData.discount_number}%!`,
    discount_id: discountData._id,
    img: "https://cdn.lawnet.vn/uploads/tintuc/2022/11/07/khuyen-mai.jpg", // Nếu có ảnh thì truyền vào
    //   redirect_url: "/discounts", // URL chuyển hướng khi bấm vào noti (nếu có)
  });
  return discountData;
};

const getDetailDiscount = async (discountId) => {
  const existingDiscount = await Discount.findById(discountId);
  if (!existingDiscount) {
    throw new AppError("Mã giảm giá không tồn tại", 404, 2);
  }
  return existingDiscount;
};

const getAllDiscount = async () => {
  const listDiscount = await Discount.find();
  return listDiscount;
};

const updateDiscount = async (discountId, updateData) => {
  const existingDiscount = await Discount.findById(discountId);

  if (!existingDiscount) {
    throw new AppError("Mã giảm giá này không tồn tại", 404, 2);
  }

  const updatedDiscount = await Discount.findByIdAndUpdate(
    discountId,
    updateData,
    { new: true, runValidators: true },
  );
  return updatedDiscount;
};

const deleteDiscount = async (discountId) => {
  const existingDiscount = await Discount.findById(discountId);

  if (!existingDiscount) {
    throw new AppError("Mã giảm giá này không tồn tại", 404, 2);
  }

  await existingDiscount.delete();
  return { message: "Xóa mã giảm giá thành công" };
};

const getForOrder = async (userId, productIds) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Không tìm thấy người dùng", 404, 2);
  const products = await Product.find({ _id: { $in: productIds } }).populate(
    "product_category",
  );
  if (products.length === 0)
    throw new AppError("Không tìm thấy sản phẩm", 404, 3);
  const now = new Date();
  const discounts = await Discount.find({
    _id: { $in: user.discounts },
    status: "active",
    discount_start_day: { $lte: now },
    discount_end_day: { $gte: now },
  });
  if (discounts.length === 0) {
    return [];
  }
  const applicableDiscounts = discounts.filter((discount) => {
    const appliesToProduct = products.every((product) =>
      discount.applicable_products.some((dpid) => dpid.equals(product._id)),
    );
    const appliesToCategory = products.every((product) =>
      discount.applicable_categories.some((dcid) =>
        dcid.equals(product.product_category._id),
      ),
    );
    return appliesToProduct || appliesToCategory;
  });

  return applicableDiscounts;
};

export {
  createDiscount,
  getDetailDiscount,
  getAllDiscount,
  updateDiscount,
  deleteDiscount,
  getForOrder,
};
