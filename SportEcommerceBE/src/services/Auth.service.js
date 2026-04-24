import User from "../models/User.model.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/JwtUtil.js";
import generateOTP from "../utils/GenerateOTP.js";
import redis from "../config/Redis.js";
import sendEmail from "../config/Nodemailer.js";
import bcrypt from "bcrypt";
import { logLoginHistory } from "./LoginHistory.service.js";
import AppError from "../utils/AppError.js";

const OTP_EXPIRE_SECONDS = 300;
const OTP_VERIFIED_EXPIRE_SECONDS = 600;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizeUserName = (user_name = "") => String(user_name).trim();
const buildForgotPasswordOtpKey = (email) => `otp:${email}`;
const buildForgotPasswordVerifiedKey = (email) => `otp_verified:${email}`;
const buildSignUpOtpKey = (email) => `signup_otp:${email}`;
const buildSignUpPayloadKey = (email) => `signup_payload:${email}`;

const toUserPayload = (user) => ({
  id: user._id,
  user_name: user.user_name,
  email: user.email,
  role: user.role,
});

const assertSignUpAvailable = async ({ user_name, email }) => {
  const existingUser = await User.findOne({
    $or: [{ user_name }, { email }],
  });
  if (existingUser) {
    throw new AppError("Tên đăng nhập hoặc email đã tồn tại", 400, 2);
  }
};

const createUserService = async ({ user_name, email, password }) => {
  const normalizedUserName = normalizeUserName(user_name);
  const normalizedEmail = normalizeEmail(email);

  await assertSignUpAvailable({
    user_name: normalizedUserName,
    email: normalizedEmail,
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    user_name: normalizedUserName,
    email: normalizedEmail,
    password: hashedPassword,
    full_name: normalizedUserName,
  });

  await newUser.save();
  return toUserPayload(newUser);
};

const loginService = async (user_name, password, ip, user_agent) => {
  const user = await User.findOne({
    $or: [{ user_name: user_name }],
  });

  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404, 1);
  }

  const isMatchPassword = await bcrypt.compare(password, user.password);
  if (!isMatchPassword) {
    throw new AppError("Mật khẩu không chính xác", 400, 3);
  }

  let login_history_id = null;
  if (user.role === "admin") {
    const loginHistory = await logLoginHistory({
      user_id: user._id,
      role: user.role,
      ip,
      user_agent,
    });
    login_history_id = loginHistory._id;
  }

  const accessToken = createAccessToken(user, login_history_id);
  const refreshToken = createRefreshToken(user, login_history_id);

  return {
    accessToken,
    refreshToken,
    user: {
      ...toUserPayload(user),
    },
  };
};

const loginWithGoogleService = async (email, uidToPassword) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({
    $or: [{ email: normalizedEmail }],
  });

  if (!user) {
    throw new AppError("Tài khoản Google chưa được đăng ký", 404, 1);
  } else {
    const isMatchPassword = await bcrypt.compare(uidToPassword, user.password);
    if (!isMatchPassword) {
      throw new AppError("Mật khẩu không chính xác", 400, 3);
    }
  }
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: {
      ...toUserPayload(user),
    },
  };
};

const SignUpWithGoogleService = async (email, user_name, uidToPassword) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUserName = normalizeUserName(user_name);
  const user = await User.findOne({
    $or: [{ email: normalizedEmail }],
  });
  if (!user) {
    const hashedPassword = await bcrypt.hash(uidToPassword, 10);
    const newUser = new User({
      user_name: normalizedUserName,
      email: normalizedEmail,
      password: hashedPassword,
      full_name: normalizedUserName,
    });
    await newUser.save();
    const accessToken = createAccessToken(newUser);
    const refreshToken = createRefreshToken(newUser);
    return {
      accessToken,
      refreshToken,
      user: {
        ...toUserPayload(newUser),
      },
    };
  } else {
    throw new AppError("Tài khoản Google này đã được sử dụng", 400, 1);
  }
};

const sentOTPService = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (!existingUser) {
    throw new AppError("Không tìm thấy người dùng", 404, 2);
  }

  const otp = generateOTP();
  await redis.set(buildForgotPasswordOtpKey(normalizedEmail), otp, {
    EX: OTP_EXPIRE_SECONDS,
  });
  await sendEmail(normalizedEmail, otp, {
    purpose: "reset_password",
    expiresInMinutes: OTP_EXPIRE_SECONDS / 60,
  });

  return { email: normalizedEmail };
};

const verifyOTPService = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp || "").trim();
  const storedOTP = await redis.get(buildForgotPasswordOtpKey(normalizedEmail));

  if (!storedOTP) {
    throw new AppError("OTP không hợp lệ", 400, 2);
  }

  if (storedOTP !== normalizedOtp) {
    throw new AppError("OTP không hợp lệ", 400, 3);
  }

  await redis.del(buildForgotPasswordOtpKey(normalizedEmail));
  await redis.set(buildForgotPasswordVerifiedKey(normalizedEmail), "true", {
    EX: OTP_VERIFIED_EXPIRE_SECONDS,
  });

  return { email: normalizedEmail };
};

const resetPasswordService = async (email, newPassword) => {
  const normalizedEmail = normalizeEmail(email);
  const isVerified = await redis.get(
    buildForgotPasswordVerifiedKey(normalizedEmail),
  );

  if (!isVerified) {
    throw new AppError(
      "Xác thực OTP là bắt buộc trước khi đặt lại mật khẩu",
      400,
      2,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const user = await User.findOne({ email: normalizedEmail });
  user.password = hashedPassword;
  await user.save();

  await redis.del(buildForgotPasswordVerifiedKey(normalizedEmail));
  return { email: normalizedEmail };
};

const sendSignUpOTPService = async ({ user_name, email, password }) => {
  const normalizedUserName = normalizeUserName(user_name);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedUserName || !normalizedEmail || !password) {
    throw new AppError("Thiếu thông tin đăng ký", 400, 1);
  }

  await assertSignUpAvailable({
    user_name: normalizedUserName,
    email: normalizedEmail,
  });

  const otp = generateOTP();
  const hashedPassword = await bcrypt.hash(password, 10);
  const signUpPayload = JSON.stringify({
    user_name: normalizedUserName,
    email: normalizedEmail,
    password: hashedPassword,
  });

  const signUpOtpKey = buildSignUpOtpKey(normalizedEmail);
  const signUpPayloadKey = buildSignUpPayloadKey(normalizedEmail);

  await Promise.all([
    redis.set(signUpOtpKey, otp, { EX: OTP_EXPIRE_SECONDS }),
    redis.set(signUpPayloadKey, signUpPayload, { EX: OTP_EXPIRE_SECONDS }),
  ]);

  await sendEmail(normalizedEmail, otp, {
    purpose: "sign_up",
    expiresInMinutes: OTP_EXPIRE_SECONDS / 60,
  });

  return { email: normalizedEmail };
};

const verifySignUpOTPService = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp || "").trim();
  const signUpOtpKey = buildSignUpOtpKey(normalizedEmail);
  const signUpPayloadKey = buildSignUpPayloadKey(normalizedEmail);

  if (!normalizedEmail || !normalizedOtp) {
    throw new AppError("Thiếu thông tin xác thực", 400, 1);
  }

  const [storedOTP, storedPayload] = await Promise.all([
    redis.get(signUpOtpKey),
    redis.get(signUpPayloadKey),
  ]);

  if (!storedOTP || !storedPayload) {
    throw new AppError("Mã xác thực đã hết hạn hoặc không hợp lệ", 400, 2);
  }

  if (storedOTP !== normalizedOtp) {
    throw new AppError("Mã xác thực không chính xác", 400, 3);
  }

  let payload = null;
  try {
    payload = JSON.parse(storedPayload);
  } catch {
    throw new AppError("Dữ liệu đăng ký không hợp lệ", 400, 4);
  }

  try {
    await assertSignUpAvailable({
      user_name: payload.user_name,
      email: payload.email,
    });
  } catch (error) {
    await Promise.all([redis.del(signUpOtpKey), redis.del(signUpPayloadKey)]);
    throw error;
  }

  const newUser = new User({
    user_name: payload.user_name,
    email: payload.email,
    password: payload.password,
    full_name: payload.user_name,
  });

  await newUser.save();
  await Promise.all([redis.del(signUpOtpKey), redis.del(signUpPayloadKey)]);

  return toUserPayload(newUser);
};

const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token là bắt buộc", 400, 1);
  }
  const user = verifyRefreshToken(refreshToken);
  if (!user) {
    throw new AppError("Lỗi xác thực refresh token", 401, 2);
  }
  const newAccessToken = createAccessToken(user);

  return {
    accessToken: newAccessToken,
  };
};

export {
  createUserService,
  loginService,
  sentOTPService,
  resetPasswordService,
  verifyOTPService,
  sendSignUpOTPService,
  verifySignUpOTPService,
  loginWithGoogleService,
  SignUpWithGoogleService,
  refreshTokenService,
};
