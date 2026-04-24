import Discount from "../models/Discount.model.js";
import User from "../models/User.model.js";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";

const getUserService = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }
  return {
    user,
  };
};

const getAllUsersService = async () => {
  const users = await User.find({ role: { $ne: "admin" } }).select("-password");
  return {
    users,
  };
};

const changePasswordService = async (email, oldPassword, newPassword) => {
  const user = await User.findOne({ email });

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError("Mật khẩu cũ không chính xác", 400, 2);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return { message: "Đổi mật khẩu thành công" };
};

const updateUserService = async (userId, dataUpdate) => {
  const user = await User.findById(userId);

  // Cập nhật thông tin
  Object.assign(user, dataUpdate);
  await user.save();

  return { user };
};

const addAddressService = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }

  // Nếu địa chỉ mới là mặc định, reset tất cả địa chỉ trước đó
  if (addressData.is_default) {
    user.addresses.forEach((addr) => (addr.is_default = false));
  }

  user.addresses.push(addressData);
  await user.save();

  return { addresses: user.addresses };
};

const updateAddressService = async (userId, index, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }

  if (index < 0 || index >= user.addresses.length) {
    throw new AppError("Không tìm thấy địa chỉ", 404, 2);
  }

  // Cập nhật thông tin địa chỉ
  Object.assign(user.addresses[index], updateData);

  // Nếu đặt mặc định, bỏ mặc định của các địa chỉ khác
  if (updateData.is_default) {
    user.addresses.forEach((addr, i) => (addr.is_default = i === index));
  }

  await user.save();
  return { addresses: user.addresses };
};

const saveDiscount = async (userId, discountId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }

  const discount = await Discount.findById(discountId);
  if (!discount) {
    throw new AppError("Mã giảm giá không tồn tại", 404, 2);
  }

  const alreadySaved = user.discounts.some((d) => d.equals(discount._id));
  if (alreadySaved) {
    throw new AppError("Mã giảm giá đã được lưu", 400, 3);
  }

  user.discounts.push(discount._id);
  await user.save();
  return user.discounts;
};

const getDiscountUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }
  const discounts = await Discount.find({ _id: { $in: user.discounts } });

  return discounts;
};

const deleteAddressService = async (userId, index) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }

  if (index < 0 || index >= user.addresses.length) {
    throw new AppError("Địa chỉ không tồn tại", 400, 2);
  }

  if (user.addresses[index].is_default) {
    // Nếu địa chỉ xóa là mặc định, đặt mặc định cho địa chỉ đầu tiên còn lại
    const newDefaultIndex = index === 0 ? 1 : 0;
    if (user.addresses[newDefaultIndex]) {
      user.addresses[newDefaultIndex].is_default = true;
    }
  }
  user.addresses.splice(index, 1);

  await user.save();

  return user.addresses;
};

const deleteSearchHistoryService = async (userId, index) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }

  if (index < 0 || index >= user.searchhistory.length) {
    throw new AppError("Chỉ số không phù hợp", 400, 2);
  }

  user.searchhistory.splice(index, 1);
  await user.save();

  return user.searchhistory;
};

export {
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
};
