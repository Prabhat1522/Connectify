import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRouts.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { Server } from "socket.io";
import User from "./models/User.js";

// create an express app and HTTP server  
const app = express();
const server = http.createServer(app);

// Initialise Socket.IO server
export const io = new Server(server, {
  cors: { origin: "*" },
});

// store online users
export const userSocketMap = {}; // { userId: socketId }

// handle socket connections
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId; // get userId from query params
  console.log("User connected:", userId);
  
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id; // store the socket id for the user
    // Update online status in DB (optional: set lastSeen to null/active)
    User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(err => console.error("Error updating connection status:", err));
  }
  
  // emit online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // --- Real-time Socket events for Chat App ---

  // Handle joining group room
  socket.on("joinGroup", (groupId) => {
    if (groupId) {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group room: ${groupId}`);
    }
  });

  // Handle leaving group room
  socket.on("leaveGroup", (groupId) => {
    if (groupId) {
      socket.leave(groupId);
      console.log(`Socket ${socket.id} left group room: ${groupId}`);
    }
  });

  // Typing indicators
  socket.on("typing", (data) => {
    // data: { senderId, receiverId, groupId, senderName }
    if (data.groupId) {
      socket.to(data.groupId).emit("typing", data);
    } else if (data.receiverId) {
      const recipientSocketId = userSocketMap[data.receiverId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing", data);
      }
    }
  });

  socket.on("stopTyping", (data) => {
    // data: { senderId, receiverId, groupId }
    if (data.groupId) {
      socket.to(data.groupId).emit("stopTyping", data);
    } else if (data.receiverId) {
      const recipientSocketId = userSocketMap[data.receiverId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("stopTyping", data);
      }
    }
  });

  // Handle manual disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    if (userId && userId !== "undefined") {
      delete userSocketMap[userId]; // remove the socket id for the user
      // Save last seen timestamp in DB
      User.findByIdAndUpdate(userId, { lastSeen: new Date() })
        .then(() => {
          // Emit updated online status
          io.emit("getOnlineUsers", Object.keys(userSocketMap));
        })
        .catch(err => console.error("Error updating lastSeen:", err));
    } else {
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// middleware setup
app.use(express.json({ limit: "10mb" })); // Increase limits for drag-n-drop file support
app.use(cors());

// routes setup
app.use("/api/status", (req, res) => {
  res.send("Connectify server is running smoothly.");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

// Centralized error handling middleware
app.use(errorHandler);

// connect to database
await connectDB();

const PORT = process.env.PORT || 4000;
// start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export server for Vercel
export default server;