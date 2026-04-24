import AxiosInstance from "./AxiosInstance";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

export const getPaymentInfoByOrderCode = async (orderCode) => {
    try {
      const response = await AxiosInstance.get(`/payment/info-of-payment/${orderCode}`);
      return response.data;
    } catch (error) {
      return error.response?.data || networkError();
    }
  };
