import axios from "axios";
import {
  normalizeErrorPayload,
  normalizeSuccessPayload,
} from "./ResponseAdapter";

const API_URL = import.meta.env.VITE_API_URL;

const AxiosInstance = axios.create({
  baseURL: API_URL,
});

AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

AxiosInstance.interceptors.response.use(
  (response) => {
    response.data = normalizeSuccessPayload(response.data);
    return response;
  },
  async (error) => {
    if (!error.response) {
      error.response = {
        status: 0,
        data: normalizeErrorPayload(null, -1),
      };
      return Promise.reject(error);
    }

    error.response.data = normalizeErrorPayload(
      error.response.data,
      error.response.status
    );

    const originalRequest = error.config || {};
    const isUnauthorized = error.response.status === 401;
    const isRefreshApi =
      typeof originalRequest.url === "string" &&
      originalRequest.url.includes("/auth/refresh_token");

    if (isUnauthorized && !isRefreshApi && !originalRequest._retry) {
      originalRequest._retry = true;
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        localStorage.removeItem("accessToken");
        return Promise.reject(error);
      }

      try {
        const refreshRes = await axios.post(`${API_URL}/auth/refresh_token`, {
          refreshToken: storedRefreshToken,
        });
        const normalizedRefresh = normalizeSuccessPayload(refreshRes.data);
        const newAccessToken = normalizedRefresh?.result?.accessToken;

        if (normalizedRefresh?.EC === 0 && newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return AxiosInstance(originalRequest);
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;
