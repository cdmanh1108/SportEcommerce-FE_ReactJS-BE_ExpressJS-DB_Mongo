import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

export const getLoginHistory = async () => {
  try {
    const res = await AxiosInstance.get("/login_history");
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const getLoginHistoryById = async (id) => {
  try {
    const res = await AxiosInstance.get(`/login_history/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
