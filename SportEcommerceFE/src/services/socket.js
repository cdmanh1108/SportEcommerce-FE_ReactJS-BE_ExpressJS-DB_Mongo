import { io } from "socket.io-client";

// Lấy API URL (cắt bỏ phần /api nếu có để lấy domain gốc)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = API_URL.replace("/api", "");

let socket = null;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected to socket server");
      if (userId) {
        socket.emit("join", userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });
  } else if (userId) {
    // Nếu socket đã khởi tạo nhưng userId mới (vd: vừa đăng nhập)
    socket.emit("join", userId);
  }
  
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
