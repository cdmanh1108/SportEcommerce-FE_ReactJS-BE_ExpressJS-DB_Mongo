import Feedback from "../models/Feedback.model.js";
import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import checkFeedbackAndModerate from "../utils/OpenAIModeration.js";
import AppError from "../utils/AppError.js";

const createFeedback = async (newFeedback) => {
  const { order_id, product_id, user_id, variant, color, content } =
    newFeedback;

  const existingFeedback = await Feedback.findOne({
    order_id,
    product_id,
    user_id,
    variant,
    color,
  });

  if (existingFeedback) {
    throw new AppError(
      "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi!",
      400,
      2,
    );
  }

  const moderationFeedback = await checkFeedbackAndModerate(content);
  if (moderationFeedback.isFlagged) {
    throw new AppError("Feedback chứa nội dung không phù hợp", 400, 3);
  }

  const feedback = new Feedback(newFeedback);
  await feedback.save();

  const allFeedbacks = await Feedback.find({ product_id });
  const totalRating = allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0);
  const avgRating = totalRating / allFeedbacks.length;

  await Order.findByIdAndUpdate(order_id, {
    $set: { is_feedback: true },
  });
  // Cập nhật product_rate
  await Product.findByIdAndUpdate(product_id, {
    $set: { product_rate: avgRating.toFixed(1) },
  });

  return feedback;
};

const updateFeedback = async (feedbackId, updateData) => {
  const updatedFeedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    updateData,
    { new: true, runValidators: true },
  );

  if (!updatedFeedback) {
    throw new AppError("Đánh giá không tồn tại", 404, 2);
  }

  return updatedFeedback;
};

const deleteFeedback = async (feedbackId) => {
  const existFeedback = await Feedback.findById(feedbackId);
  if (!existFeedback) {
    throw new AppError("Đánh giá không tồn tại", 404, 1);
  }
  await Feedback.findByIdAndDelete(feedbackId);
  return { message: "Xóa đánh giá thành công" };
};

const getAllFeedback = async (productId) => {
  const existingProduct = await Product.findById(productId);
  if (!existingProduct) {
    throw new AppError("Sản phẩm không tồn tại", 404, 1);
  }

  const list_feedback = await Feedback.find({ product_id: productId }).populate(
    "user_id",
    "user_name avt_img",
  );
  return list_feedback;
};
export { createFeedback, updateFeedback, deleteFeedback, getAllFeedback };
