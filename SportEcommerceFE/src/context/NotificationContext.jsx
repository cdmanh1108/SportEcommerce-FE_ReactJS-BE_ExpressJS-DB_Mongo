import { createContext, useEffect, useState, useContext } from "react";
import { getUserNotifications } from "../services/api/NotificationApi";
import { useAuth } from "./AuthContext";
import { useUser } from "./UserContext";
import { initSocket, disconnectSocket } from "../services/socket";
import { usePopup } from "./PopupContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();
  const { selectedUser } = useUser();
  const { showPopup } = usePopup();

  const fetchNotifications = async () => {
    const res = await getUserNotifications();
    if (res.EC === 0) {
      setNotifications(res.result);
    } else return;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }
    
    // Gọi API ngay lần đầu
    fetchNotifications();

    // Khởi tạo socket
    const socket = initSocket();

    // Lắng nghe sự kiện newNotification
    const handleNewNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      showPopup(newNotification.notify_title || "Bạn có thông báo mới!", true);
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [token]);

  useEffect(() => {
    if (selectedUser?._id) {
      initSocket(selectedUser._id);
    }
  }, [selectedUser?._id]);

  return (
    <NotificationContext.Provider
      value={{ notifications, setNotifications, unreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
