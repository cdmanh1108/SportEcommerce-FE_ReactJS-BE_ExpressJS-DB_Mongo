import AxiosInstance from "./AxiosInstance";
import { auth, provider, signInWithPopup } from "../../config/firebase";

const networkError = (message = "Lỗi kết nối đến server") => ({
  EC: -1,
  EM: message,
  result: null,
});

export const signUp = async (user_name, email, password) => {
  try {
    const res = await AxiosInstance.post("/auth/sign_up", {
      user_name,
      email,
      password,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const sendSignUpOTP = async (user_name, email, password) => {
  try {
    const res = await AxiosInstance.post("/auth/send_sign_up_otp", {
      user_name,
      email,
      password,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError("Gửi mã xác thực thất bại");
  }
};

export const verifySignUpOTP = async (email, otp) => {
  try {
    const res = await AxiosInstance.post("/auth/verify_sign_up_otp", {
      email,
      otp,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError("Xác thực mã thất bại");
  }
};

// Đăng nhập
export const login = async (user_name, password) => {
  try {
    const res = await AxiosInstance.post("/auth/login", {
      user_name,
      password,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

// Gửi mã OTP qua email
export const sendOTP = async (email) => {
  try {
    const res = await AxiosInstance.post("/auth/send_otp", { email });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError("Gửi OTP thất bại");
  }
};

// Xác thực mã OTP
export const verifyOTP = async (email, otp) => {
  try {
    const res = await AxiosInstance.post("/auth/verify_otp", {
      email,
      otp,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError("Xác thực OTP thất bại");
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (email, newPassword) => {
  try {
    const res = await AxiosInstance.patch("/auth/reset_password", {
      email,
      newPassword,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const changePassword = async (oldPassword, newPassword) => {
  try {
    const res = await AxiosInstance.patch("/auth/change_password", {
      oldPassword,
      newPassword,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const signUpWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const res = await AxiosInstance.post("/auth/signup_with_google", {
      email: user.email,
      user_name: user.email,
      uid: user.uid,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const res = await AxiosInstance.post("/auth/login_with_google", {
      email: user.email,
      uid: user.uid,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("Không có refresh token, user chưa đăng nhập.");
  }

  try {
    const res = await AxiosInstance.post("/auth/refresh_token", {
      refreshToken,
    });
    return res.data;
  } catch (error) {
    return error.response?.data || networkError();
  }
};
