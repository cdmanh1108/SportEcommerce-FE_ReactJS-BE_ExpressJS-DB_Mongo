import Cart from "../models/Cart.model.js";
import mongoose from "mongoose";
import Product from "../models/Product.model.js";
import AppError from "../utils/AppError.js";

const updateCartService = async ({
  user_id,
  product_id,
  color_name,
  variant_name,
  quantity,
}) => {
  const product = await Product.findOneWithDeleted({ _id: product_id });
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404, 1);
  }

  const color = product.colors.find((c) => c.color_name === color_name);
  if (!color) {
    throw new AppError("Màu sắc không tồn tại trong sản phẩm", 400, 1);
  }

  const variant = color.variants.find((v) => v.variant_size === variant_name);
  if (!variant) {
    throw new AppError("Size không tồn tại trong màu đã chọn", 400, 1);
  }

  let cart = await Cart.findOne({ user_id });

  if (!cart) {
    cart = new Cart({ user_id, products: [] });
  }

  const productIndex = cart.products.findIndex(
    (p) =>
      p.product_id.toString() === product_id &&
      p.color_name === color.color_name &&
      p.variant_name === variant.variant_size,
  );

  if (quantity !== undefined) {
    if (productIndex > -1) {
      cart.products[productIndex].quantity += quantity;
    } else {
      cart.products.push({
        product_id,
        color_name,
        variant_name,
        quantity: quantity,
      });
    }
  } else {
    if (productIndex > -1) {
      cart.products[productIndex].quantity += 1;
    } else {
      cart.products.push({
        product_id,
        color_name,
        variant_name,
        quantity: 1,
      });
    }
  }

  await cart.save();

  return cart;
};

// Lấy giỏ hàng của user
const getCartService = async (user_id) => {
  // const cart = await Cart.findOne({ user_id }).populate(
  //   "products.product_id"
  // );
  let cart = await Cart.findOne({ user_id })
    .populate("products.product_id")
    .populate("user_id");
  if (!cart) {
    return null; // Giỏ hàng trống
  }
  await cart.save();
  return cart;
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCartService = async ({
  user_id,
  product_id,
  color_name,
  variant_name,
}) => {
  const product = await Product.findOneWithDeleted({ _id: product_id });
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404, 2);
  }

  const color = product.colors.find((c) => c.color_name === color_name);
  if (!color) {
    throw new AppError("Màu sắc không tồn tại trong sản phẩm", 400, 2);
  }

  const variant = color.variants.find((v) => v.variant_size === variant_name);
  if (!variant) {
    throw new AppError("Size không tồn tại trong màu đã chọn", 400, 2);
  }

  let cart = await Cart.findOne({ user_id });
  if (!cart) {
    throw new AppError("Không tìm thấy giỏ hàng", 404, 1);
  }

  // Lọc và xóa sản phẩm khỏi giỏ hàng
  cart.products = cart.products.filter(
    (p) =>
      !(
        p.product_id.toString() === product_id &&
        p.color_name === color_name &&
        p.variant_name === variant_name
      ),
  );

  // Lưu lại giỏ hàng đã được cập nhật
  await cart.save();

  return cart;
};

// Xóa toàn bộ giỏ hàng
const clearCartService = async (user_id) => {
  let cart = await Cart.findOne({ user_id });
  if (!cart) {
    throw new AppError("Không tìm thấy giỏ hàng", 404, 2);
  } else {
    await Cart.deleteOne({ user_id });
    return { message: "Xóa toàn bộ giỏ hàng thành công" };
  }
};

const decreaseProductQuantity = async (
  user_id,
  product_id,
  color_name,
  variant_name,
) => {
  const product = await Product.findOneWithDeleted({ _id: product_id });
  if (!product) {
    throw new AppError("Sản phẩm không tồn tại", 404, 1);
  }

  const color = product.colors.find((c) => c.color_name === color_name);
  if (!color) {
    throw new AppError("Màu sắc không tồn tại trong sản phẩm", 400, 1);
  }

  const variant = color.variants.find((v) => v.variant_size === variant_name);
  if (!variant) {
    throw new AppError("Size không tồn tại trong màu đã chọn", 400, 1);
  }

  let cart = await Cart.findOne({ user_id });

  const productIndex = cart.products.findIndex(
    (item) =>
      item.product_id.toString() === product_id &&
      item.color_name === color.color_name &&
      item.variant_name === variant.variant_size,
  );

  if (cart.products[productIndex].quantity > 1) {
    cart.products[productIndex].quantity -= 1;
  } else {
    cart.products.splice(productIndex, 1);
  }

  await cart.save();

  return cart;
};

export {
  updateCartService,
  getCartService,
  removeFromCartService,
  clearCartService,
  decreaseProductQuantity,
};
