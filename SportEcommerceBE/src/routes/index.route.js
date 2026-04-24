import authRouter from "./Auth.route.js";
import cartRouter from "./Cart.route.js";
import favouriteRouter from "./Favourite.route.js";
import productRouter from "./Product.route.js";
import orderRouter from "./Order.route.js";
import feedbackRouter from "./Feedback.route.js";
import discountRouter from "./Discount.route.js";
import categoryRouter from "./Category.route.js";
import userRouter from "./User.route.js";
import paymentRouter from "./Payment.route.js";
import chatbotRouter from "./Chatbot.route.js";
import notificationRouter from "./Notification.route.js";
import storeRouter from "./Store.route.js";
import loginHistory from "./LoginHistory.route.js";
import knowledgeChunkRouter from "./KnowledgeChunk.route.js";
import chatConversationRouter from "./ChatConversation.route.js";
import chatMessageRouter from "./ChatMessage.route.js";
function router(app) {
  app.use("/auth", authRouter);
  app.use("/favourite", favouriteRouter);
  app.use("/cart", cartRouter);
  app.use("/product", productRouter);
  app.use("/order", orderRouter);
  app.use("/feedback", feedbackRouter);
  app.use("/discount", discountRouter);
  app.use("/category", categoryRouter);
  app.use("/user", userRouter);
  app.use("/payment", paymentRouter);
  app.use("/chat", chatbotRouter);
  app.use("/notification", notificationRouter);
  app.use("/login_history", loginHistory);
  app.use("/store", storeRouter);
  app.use("/knowledge-chunk", knowledgeChunkRouter);
  app.use("/chat-conversation", chatConversationRouter);
  app.use("/chat-message", chatMessageRouter);
  app.get("/", (req, res) => {
    res.send("Hello WTM Sport Ecommerce Service");
  });
}

export default router;
