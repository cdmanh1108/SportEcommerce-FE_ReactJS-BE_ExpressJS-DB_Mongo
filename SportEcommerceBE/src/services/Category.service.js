import Category from "../models/Category.model.js";
import AppError from "../utils/AppError.js";

const createCategory = async (categoryData) => {
  const newCategory = new Category(categoryData);
  await newCategory.save();
  return newCategory;
};

const getDetailCategory = async (categoryId) => {
  const existingCategory = await Category.findById(categoryId);
  if (!existingCategory) {
    throw new AppError("Danh mục không tồn tại", 404, 2);
  }

  return existingCategory;
};

const getAllCategory = async (category_level = 1) => {
  const listCategory = await Category.find({ category_level });
  return listCategory;
};

const getSubCategory = async (categoryId) => {
  const existingCategory = await Category.findById(categoryId);
  if (!existingCategory) {
    throw new AppError("Danh mục không tồn tại", 404, 2);
  }
  const listSubCategory = await Category.find({
    category_parent_id: categoryId,
  });
  return listSubCategory;
};

const updateCategory = async (categoryId, updateData) => {
  const existingCategory = await Category.findById(categoryId);
  if (!existingCategory) {
    throw new AppError("Danh mục không tồn tại", 404, 2);
  }
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    updateData,
    { new: true, runValidators: true },
  );
  return updatedCategory;
};

const deleteCategory = async (categoryId) => {
  const existingCategory = await Category.findById(categoryId);
  if (!existingCategory) {
    throw new AppError("Danh mục không tồn tại", 404, 2);
  }
  await existingCategory.delete();
  return { message: "Xóa danh mục thành công" };
};

export {
  createCategory,
  getDetailCategory,
  getSubCategory,
  updateCategory,
  getAllCategory,
  deleteCategory,
};
