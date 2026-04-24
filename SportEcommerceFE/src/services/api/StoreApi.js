import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

// Tạo store
export const createStore = async (storeData) => {
  try {
    const res = await AxiosInstance.post("/store/create", storeData);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Cập nhật store
export const updateStore = async (updateData, storeId) => {
  try {
    const res = await AxiosInstance.patch(
      `/store/update/${storeId}`,
      updateData,
    );
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Lấy store theo id
export const getDetailStore = async (storeId) => {
  try {
    const res = await AxiosInstance.get(`/store/get-detail/${storeId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
