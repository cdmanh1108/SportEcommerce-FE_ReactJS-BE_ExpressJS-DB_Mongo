import {
  createUserService,
  loginService,
  sentOTPService,
  verifyOTPService,
  resetPasswordService,
  sendSignUpOTPService,
  verifySignUpOTPService,
  loginWithGoogleService,
  SignUpWithGoogleService,
} from "../services/Auth.service.js";
import handleControllerError from "../utils/HandleControllerError.js";

const authController = {
  async createUser(req, res) {
    const { user_name, email, password } = req.body;
    try {
      const user = await createUserService({
        user_name,
        email,
        password,
      });
      return res.success(user, "Đăng ký thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async loginUser(req, res) {
    const { user_name, password } = req.body;
    const ip = req.ip;
    const user_agent = req.headers["user-agent"] || "unknown";
    try {
      const result = await loginService(user_name, password, ip, user_agent);
      return res.success(result, "Đăng nhập thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async SignUpWithGoogle(req, res) {
    const { email, user_name, uid } = req.body;
    try {
      const result = await SignUpWithGoogleService(email, user_name, uid);
      return res.success(result, "Đăng ký thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async loginUserWithGoogle(req, res) {
    const { email, uid } = req.body;
    try {
      const result = await loginWithGoogleService(email, uid);
      return res.success(result, "Đăng nhập thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async sendOTP(req, res) {
    const { email } = req.body;
    try {
      const result = await sentOTPService(email);
      return res.success(result, "Gửi OTP thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async verifyOtp(req, res) {
    const { email, otp } = req.body;
    try {
      const result = await verifyOTPService(email, otp);
      return res.success(result, "Xác thực OTP thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async resetPassword(req, res) {
    const { email, newPassword } = req.body;
    try {
      const result = await resetPasswordService(email, newPassword);
      return res.success(result, "Đặt lại mật khẩu thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async sendSignUpOTP(req, res) {
    const { user_name, email, password } = req.body;
    try {
      const result = await sendSignUpOTPService({ user_name, email, password });
      return res.success(result, "Đã gửi mã xác thực đăng ký");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },

  async verifySignUpOtp(req, res) {
    const { email, otp } = req.body;
    try {
      const result = await verifySignUpOTPService(email, otp);
      return res.success(result, "Đăng ký thành công");
    } catch (error) {
      return handleControllerError(res, error);
    }
  },
};
export default authController;
