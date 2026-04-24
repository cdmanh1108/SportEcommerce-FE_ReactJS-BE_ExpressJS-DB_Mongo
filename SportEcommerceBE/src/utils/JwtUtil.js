import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const createAccessToken = (user, login_history_id = null) => {
  const payload = {
    userId: user?._id || user.userId,
    user_name: user.user_name,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };
  if (user.role === "admin" && login_history_id) {
    payload.login_history_id = login_history_id;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "5h",
  });
};

const createRefreshToken = (user, login_history_id = null) => {
  const payload = {
    userId: user._id,
    user_name: user.user_name,
    email: user.email,
    role: user.role,
  };
  if (user.role === "admin" && login_history_id) {
    payload.login_history_id = login_history_id;
  }
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

export { createAccessToken, createRefreshToken, verifyRefreshToken };
