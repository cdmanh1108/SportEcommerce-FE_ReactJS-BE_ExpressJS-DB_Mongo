import * as categoryService from "../services/Category.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const result = await categoryService.createCategory(categoryData);
    return res.success(result, "Tạo danh mục thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getDetailCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const result = await categoryService.getDetailCategory(categoryId);
    return res.success(result, "Lấy chi tiết danh mục thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getAllCategory = async (req, res) => {
  try {
    const category_level = req.query.category_level
      ? parseInt(req.query.category_level, 10)
      : 1;

    const result = await categoryService.getAllCategory(category_level);
    return res.success(result, "Lấy danh sách danh mục thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getSubCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const result = await categoryService.getSubCategory(categoryId);
    return res.success(result, "Lấy danh sách danh mục con thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updateData = req.body;
    if (!categoryId) {
      return res.error(1, "Category id is required");
    }
    const result = await categoryService.updateCategory(categoryId, updateData);
    return res.success(result, "Cập nhật danh mục thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const result = await categoryService.deleteCategory(categoryId);
    return res.success(null, result.message);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export {
  createCategory,
  getDetailCategory,
  getSubCategory,
  updateCategory,
  getAllCategory,
  deleteCategory,
};
