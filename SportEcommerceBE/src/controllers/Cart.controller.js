import {
  updateCartService,
  getCartService,
  removeFromCartService,
  clearCartService,
  decreaseProductQuantity,
} from "../services/Cart.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const cartController = {
  // Thêm sản phẩm vào giỏ hàng
  async addProductToCart(req, res) {
    const { userId } = req.user;
    const { product_id, color_name, variant_name, quantity } = req.body;
    try {
      const result = await updateCartService({
        user_id: userId,
        product_id,
        color_name,
        variant_name,
        quantity,
      });
      return res.success(result, "Cập nhật giỏ hàng thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  // Lấy giỏ hàng của user
  async getCart(req, res) {
    const { userId } = req.user;
    try {
      const result = await getCartService(userId);
      return res.success(result, "Lấy giỏ hàng thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  async removeProductFromCart(req, res) {
    const { userId } = req.user;
    const { productId } = req.params;
    const { color_name, variant_name } = req.body;
    try {
      const result = await removeFromCartService({
        user_id: userId,
        product_id: productId,
        color_name,
        variant_name,
      });
      return res.success(result, "Xóa sản phẩm khỏi giỏ hàng thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  // Xóa toàn bộ giỏ hàng
  async clearCart(req, res) {
    const { userId } = req.user;
    try {
      const result = await clearCartService(userId);
      return res.success(null, result.message);
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async decreaseProductQuantity(req, res) {
    const { userId } = req.user;
    const { productId, color_name, variant_name } = req.body;
    try {
      const result = await decreaseProductQuantity(
        userId,
        productId,
        color_name,
        variant_name,
      );

      return res.success(result, "Giảm số lượng sản phẩm thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};

export default cartController;
