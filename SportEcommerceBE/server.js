import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connect } from "./src/config/Db.js";
import route from "./src/routes/index.route.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./src/config/Swagger.js";
import responseHandler from "./src/middlewares/ResponseHandler.js";
import errorHandler from "./src/middlewares/ErrorHandler.js";
import "./src/chronos/OrderChecker.js";
import http from "http";
import { initSocket } from "./src/services/Socket.service.js";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connect();
const app = express();
const PORT = process.env.PORT || 5000;
// Gọi hàm setWebhook khi server khởi chạy

// Middleware
app.use(morgan("combined")); // HTTP Logger (console các thông tin request)
app.use(express.static(path.join(__dirname, "public"))); // Static files
app.use(express.urlencoded({ extended: true })); // Xử lý form
app.use(express.json()); // Xử lý dữ liệu JSON trong request body.

app.use(cors()); // CORS (cho phép truy cập từ các domain khác nhau)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // api documentation

app.use(responseHandler); // Thêm middleware chuẩn hóa response
// Routes
route(app);

// Global error handler
app.use(errorHandler);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running on http://0.0.0.0:" + PORT);
});

export default app;
