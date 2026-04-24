import Favourite from "../models/Favourite.model.js";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const updateProductToFavourService = async ({ user_id, product_id }) => {
  // Chuyển product_id thành ObjectId để đảm bảo đúng kiểu
  const productObjectId = new mongoose.Types.ObjectId(product_id);

  // Tìm danh sách yêu thích của user
  let favourite = await Favourite.findOne({ user_id });

  if (!favourite) {
    // Nếu chưa có danh sách yêu thích, tạo mới và thêm sản phẩm
    favourite = new Favourite({
      user_id,
      products: [productObjectId], // Thêm trực tiếp ObjectId
    });
  } else {
    // Kiểm tra xem product_id đã tồn tại hay chưa
    const index = favourite.products.indexOf(productObjectId);

    if (index !== -1) {
      // Nếu có rồi, xóa nó khỏi danh sách
      favourite.products.splice(index, 1);
    } else {
      // Nếu chưa có, thêm mới vào danh sách
      favourite.products.push(productObjectId);
    }
  }

  // Lưu lại vào database
  await favourite.save();

  return favourite;
};

const getFavouriteService = async (user_id) => {
  const favourite = await Favourite.findOne({ user_id });

  if (!favourite || !favourite.products || favourite.products.length === 0) {
    return [];
  }

  return favourite.products;
};

const clearFavouritesService = async (user_id) => {
  let favourite = await Favourite.findOne({ user_id });
  if (!favourite) {
    throw new AppError("Không tìm thấy danh sách yêu thích", 404, 2);
  }

  favourite.products = [];
  await favourite.save();

  return { message: "Xóa danh sách yêu thích thành công" };
};

export {
  updateProductToFavourService,
  getFavouriteService,
  clearFavouritesService,
};
