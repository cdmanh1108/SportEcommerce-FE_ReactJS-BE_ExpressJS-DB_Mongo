import {
  updateProductToFavourService,
  getFavouriteService,
  clearFavouritesService,
} from "../services/Favourite.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const favouriteController = {
  async updateFavourite(req, res) {
    try {
      const { userId } = req.user;
      const { productId } = req.body;
      const result = await updateProductToFavourService({
        user_id: userId,
        product_id: productId,
      });
      return res.success(result, "Cập nhật danh sách yêu thích thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async getFavourite(req, res) {
    const { userId } = req.user;
    try {
      const result = await getFavouriteService(userId);
      return res.success(result, "Lấy danh sách yêu thích thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async clearFavourites(req, res) {
    const { userId } = req.user;
    try {
      const result = await clearFavouritesService(userId);
      return res.success(null, result.message);
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};

export default favouriteController;
