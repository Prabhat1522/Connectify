import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  translate,
  summarize,
  getRepliesSuggestions,
  askAiAssistant,
  getGroupChatMessages,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);

messageRouter.post("/react/:id", protectRoute, reactToMessage);
messageRouter.post("/edit/:id", protectRoute, editMessage);
messageRouter.post("/delete/:id", protectRoute, deleteMessage);
messageRouter.post("/pin/:id", protectRoute, togglePinMessage);

// AI helpers
messageRouter.post("/ai/translate", protectRoute, translate);
messageRouter.post("/ai/summarize", protectRoute, summarize);
messageRouter.post("/ai/replies", protectRoute, getRepliesSuggestions);
messageRouter.post("/ai/ask", protectRoute, askAiAssistant);

// Group messages
messageRouter.get("/group/:groupId", protectRoute, getGroupChatMessages);

export default messageRouter;