import * as feedbackService from "../services/Feedback.service.js";
import upload from "../middlewares/UploadMiddleWare.js";
import { processFiles } from "../utils/UploadUtil.js";
import handleControllerError from "../utils/HandleControllerError.js";

const createFeedback = async (req, res) => {
  try {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res.error(-1, err.message);
      }
      try {
        const { userId } = req.user;

        const {
          product_id,
          variant_id,
          order_id,
          content,
          rating,
          color,
          variant,
        } = req.body;

        if (
          !product_id ||
          !order_id ||
          !content ||
          !rating ||
          !color ||
          !variant
        ) {
          return res.error(3, "Các thông tin là bắt buộc");
        }

        const { images, videos } = processFiles(req.files);

        const feedbackData = {
          product_id,
          color,
          variant,
          order_id,
          user_id: userId,
          content,
          rating,
          feedback_media: { images, videos },
        };

        const result = await feedbackService.createFeedback(feedbackData);
        return res.success(result, "Đánh giá thành công");
      } catch (error) {
        return handleControllerError(res, error);
      }
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateFeedback = async (req, res) => {
  try {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res.error(-1, err.message);
      }
      try {
        const feedbackId = req.params.id;
        const { content, rating, replied_by_admin } = req.body;

        const { images, videos } = processFiles(req.files);

        const updateData = {};
        if (content) updateData.content = content;
        if (rating) updateData.rating = rating;
        if (replied_by_admin) updateData.replied_by_admin = replied_by_admin;
        if (images.length || videos.length) {
          updateData.feedback_media = { images, videos };
        }

        const result = await feedbackService.updateFeedback(
          feedbackId,
          updateData,
        );
        return res.success({ feedback: result }, "Cập nhật đánh giá thành công");
      } catch (error) {
        return handleControllerError(res, error);
      }
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const result = await feedbackService.deleteFeedback(feedbackId);
    return res.success(null, result.message);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const productId = req.params.productId;
    const result = await feedbackService.getAllFeedback(productId);
    return res.success(result, "Lấy danh sách đánh giá thành công");
  } catch (error) {
    return handleControllerError(res, error);
  }
};

export { createFeedback, updateFeedback, deleteFeedback, getAllFeedback };
