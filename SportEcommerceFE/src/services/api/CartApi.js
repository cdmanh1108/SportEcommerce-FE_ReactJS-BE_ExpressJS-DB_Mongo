import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

export const getCart = async () => {
  try {
    const res = await AxiosInstance.get("/cart");
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const addToCart = async (
  product_id,
  color_name,
  variant_name,
  quantity
) => {
  try {
    const res = await AxiosInstance.post("/cart", {
      product_id,
      color_name,
      variant_name,
      quantity,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const removeFromCart = async (productId, color_name, variant_name) => {
  try {
    const res = await AxiosInstance.delete(`/cart/${productId}`, {
      data: { color_name, variant_name },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const clearCart = async () => {
  try {
    const res = await AxiosInstance.delete("/cart");
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const decreaseQuantity = async (productId, color_name, variant_name) => {
  try {
    const res = await AxiosInstance.patch("/cart/decrease_quantity", {
      productId,
      color_name,
      variant_name,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
