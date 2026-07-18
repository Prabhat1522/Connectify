import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
axios.defaults.baseURL = backendUrl;
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Apply visual theme customization
  const applyTheme = (theme, accent) => {
    const root = document.documentElement;
    
    // Apply primary color accent to tailwind/CSS variables
    if (accent) {
      root.style.setProperty("--color-primary", accent);
      root.style.setProperty("--color-primary-hover", accent + "cc"); // transparency hover
    } else {
      root.style.setProperty("--color-primary", "#8b5cf6"); // violet default
    }

    // Set theme classes
    root.classList.remove("light", "dark", "theme-glass");
    if (theme === "light") {
      root.classList.add("light");
    } else if (theme === "glass") {
      root.classList.add("theme-glass");
    } else {
      root.classList.add("dark");
    }
  };

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.data);
        connectSocket(data.data);
        applyTheme(data.data.themePreference, data.data.accentColor);
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
      logout();
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.data.userData);
        connectSocket(data.data.userData);
        axios.defaults.headers.common["token"] = data.data.token;
        setToken(data.data.token);
        localStorage.setItem("token", data.data.token);
        applyTheme(data.data.userData.themePreference, data.data.userData.accentColor);
        toast.success(data.message || "Welcome back!");
      } else {
        toast.error(data.message || "Authentication failed.");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error(msg);
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    if (socket) socket.disconnect();
    toast.success("Logged out successfully.");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.data);
        applyTheme(data.data.themePreference, data.data.accentColor);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error(msg);
    }
  };

  const toggleBlockUser = async (targetId) => {
    try {
      const { data } = await axios.post(`/api/auth/block/${targetId}`);
      if (data.success) {
        setAuthUser((prev) => ({ ...prev, blockedUsers: data.data }));
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error(msg);
    }
    return false;
  };

  const reportUser = async (targetId) => {
    try {
      const { data } = await axios.post(`/api/auth/report/${targetId}`);
      if (data.success) {
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error(msg);
    }
    return false;
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });
    newSocket.connect();
    setSocket(newSocket);
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    const init = async () => {
      if (token) {
        axios.defaults.headers.common["token"] = token;
        await checkAuth();
      }
    };
    init();
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    toggleBlockUser,
    reportUser,
    applyTheme,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
