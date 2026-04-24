import {
  handleWebhookService,
  getInfoOfPaymentService,
  deletePaymentService,
} from "../services/Payment.service.js";

import dotenv from "dotenv";
import handleControllerError from "../utils/HandleControllerError.js";

dotenv.config();

const paymentController = {
  async handleWebhook(req, res) {
    const data = req.body;
    const { signature } = req.body;
    try {
      const response = await handleWebhookService(data, signature);
      return res.success(response, response.message);
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async getInfoOfPayment(req, res) {
    const { orderCode } = req.params;
    try {
      const response = await getInfoOfPaymentService(orderCode);
      return res.success(response, "Lấy thông tin thanh toán thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async deletePayment(req, res) {
    const { orderCode } = req.body;
    try {
      const response = await deletePaymentService(orderCode);
      return res.success(response, "Hủy thông tin thanh toán thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};

export default paymentController;
