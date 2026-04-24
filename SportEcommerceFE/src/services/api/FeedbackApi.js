import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

// Tạo feedback mới
export const createFeedback = async (feedbackData) => {
  try {
    const res = await AxiosInstance.post("/feedback/create", feedbackData);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Cập nhật feedback
export const updateFeedback = async (feedbackId, updateData) => {
  try {
    const res = await AxiosInstance.patch(
      `/feedback/update/${feedbackId}`,
      updateData
    );
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Xóa feedback
export const deleteFeedback = async (feedbackId) => {
  try {
    const res = await AxiosInstance.delete(`/feedback/delete/${feedbackId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Lấy danh sách feedback theo productId
export const getAllFeedback = async (productId) => {
  try {
    const res = await AxiosInstance.get(`/feedback/get-all/${productId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
