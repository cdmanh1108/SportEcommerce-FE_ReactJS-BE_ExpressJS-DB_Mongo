import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

export const generateKnowledgeChunkFromProduct = async (productId) => {
  try {
    const response = await AxiosInstance.get(
      `/knowledge-chunk/generate-from-product/${productId}`,
    );
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const upsertKnowledgeChunkFromProduct = async (productId, payload) => {
  try {
    const response = await AxiosInstance.post(
      `/knowledge-chunk/upsert-from-product/${productId}`,
      payload,
    );
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const getKnowledgeChunksByProduct = async (productId) => {
  try {
    const response = await AxiosInstance.get(
      `/knowledge-chunk/get-by-product/${productId}`,
    );
    return response.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
