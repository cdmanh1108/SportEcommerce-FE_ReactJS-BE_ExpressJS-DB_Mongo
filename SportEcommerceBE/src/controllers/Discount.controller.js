import * as discountService from "../services/Discount.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createDiscount = async (req, res) => {
  try {
    const newDiscount = req.body;
    const result = await discountService.createDiscount(newDiscount);
    return res.success(result, "Tạo mã giảm giá mới thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getDetailDiscount = async (req, res) => {
  try {
    const discountId = req.params.discountId;
    const result = await discountService.getDetailDiscount(discountId);
    return res.success(result, "Lấy mã giảm giá thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getAllDiscount = async (req, res) => {
  try {
    const result = await discountService.getAllDiscount();
    return res.success(result, "Lấy tất cả mã giảm giá thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateDiscount = async (req, res) => {
  try {
    const discountId = req.params.discountId;
    const updateData = req.body;
    const result = await discountService.updateDiscount(discountId, updateData);
    return res.success(result, "Cập nhật mã giảm giá thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteDiscount = async (req, res) => {
  try {
    const discountId = req.params.discountId;
    const result = await discountService.deleteDiscount(discountId);
    return res.success(null, result.message);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getForOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productIds } = req.body;
    const result = await discountService.getForOrder(userId, productIds);
    const message =
      result.length === 0
        ? "Không tìm thấy mã giảm giá"
        : "Lấy mã giảm giá thành công";
    return res.success(result, message);
  } catch (error) {
    return handleControllerError(res, error);
  }
};
export {
  createDiscount,
  getDetailDiscount,
  getAllDiscount,
  updateDiscount,
  deleteDiscount,
  getForOrder,
};
