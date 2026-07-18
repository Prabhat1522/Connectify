import * as messageService from "../services/messageService.js";
import * as aiService from "../services/aiService.js";
import ApiResponse from "../utils/apiResponse.js";
import { io, userSocketMap } from "../server.js";
import Group from "../models/Group.js";

// Emit real-time socket events helper
const emitToRecipientOrGroup = async (senderId, targetId, isGroup, eventName, data) => {
  if (isGroup) {
    // Send to Socket.IO group room
    io.to(targetId).emit(eventName, data);
  } else {
    // Send to direct recipient socket if online
    const recipientSocketId = userSocketMap[targetId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit(eventName, data);
    }
  }
};

export const getUsersForSidebar = async (req, res, next) => {
  try {
    const result = await messageService.getSidebarUsers(req.user._id);
    return ApiResponse.success(res, "Sidebar users fetched successfully.", result, 200);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  const { id: selectedUserId } = req.params;
  try {
    const messages = await messageService.getDirectMessages(req.user._id, selectedUserId);
    return ApiResponse.success(res, "Messages retrieved successfully.", messages, 200);
  } catch (error) {
    next(error);
  }
};

export const markMessageAsSeen = async (req, res, next) => {
  const { id } = req.params;
  try {
    await Message.findByIdAndUpdate(id, { seen: true });
    return ApiResponse.success(res, "Message marked as seen.", null, 200);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  const { id: targetId } = req.params; // userId or groupId
  const { isGroup } = req.body; // boolean flag
  try {
    const message = await messageService.sendChatMessage(req.user._id, targetId, isGroup === true || isGroup === "true", req.body);

    // Emit live message event to recipient/room
    if (isGroup === true || isGroup === "true") {
      io.to(targetId).emit("newMessage", message);
    } else {
      const recipientSocketId = userSocketMap[targetId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", message);
      }
    }

    return ApiResponse.success(res, "Message sent successfully.", message, 201);
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = async (req, res, next) => {
  const { id: messageId } = req.params;
  const { emoji, targetId, isGroup } = req.body;
  try {
    const message = await messageService.toggleMessageReaction(req.user._id, messageId, emoji);

    // Notify online clients about reaction
    await emitToRecipientOrGroup(req.user._id, targetId, isGroup === true || isGroup === "true", "messageReaction", {
      messageId,
      reactions: message.reactions,
    });

    return ApiResponse.success(res, "Reaction toggled.", message, 200);
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  const { id: messageId } = req.params;
  const { text, targetId, isGroup } = req.body;
  try {
    const message = await messageService.editChatMessage(req.user._id, messageId, text);

    await emitToRecipientOrGroup(req.user._id, targetId, isGroup === true || isGroup === "true", "messageEdit", {
      messageId,
      text: message.text,
      edited: message.edited,
    });

    return ApiResponse.success(res, "Message edited successfully.", message, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  const { id: messageId } = req.params;
  const { targetId, isGroup } = req.body;
  try {
    const message = await messageService.deleteChatMessage(req.user._id, messageId);

    await emitToRecipientOrGroup(req.user._id, targetId, isGroup === true || isGroup === "true", "messageDelete", {
      messageId,
      text: message.text,
      deleted: message.deleted,
    });

    return ApiResponse.success(res, "Message deleted successfully.", message, 200);
  } catch (error) {
    next(error);
  }
};

export const togglePinMessage = async (req, res, next) => {
  const { id: messageId } = req.params;
  const { targetId, isGroup } = req.body;
  try {
    const message = await messageService.toggleMessagePin(messageId);

    await emitToRecipientOrGroup(req.user._id, targetId, isGroup === true || isGroup === "true", "messagePin", {
      messageId,
      pinned: message.pinned,
    });

    return ApiResponse.success(res, "Message pin toggled.", message, 200);
  } catch (error) {
    next(error);
  }
};

// --- AI Assistants controllers ---

export const translate = async (req, res, next) => {
  const { text, targetLanguage } = req.body;
  try {
    const translatedText = await aiService.translateText(text, targetLanguage);
    return ApiResponse.success(res, "Translation complete.", { translatedText }, 200);
  } catch (error) {
    next(error);
  }
};

export const summarize = async (req, res, next) => {
  const { messages } = req.body;
  try {
    const summary = await aiService.summarizeChat(messages);
    return ApiResponse.success(res, "Summary generated.", { summary }, 200);
  } catch (error) {
    next(error);
  }
};

export const getRepliesSuggestions = async (req, res, next) => {
  const { lastMessageText } = req.body;
  try {
    const suggestions = await aiService.getSmartReplies(lastMessageText);
    return ApiResponse.success(res, "Suggestions fetched.", { suggestions }, 200);
  } catch (error) {
    next(error);
  }
};

export const askAiAssistant = async (req, res, next) => {
  const { prompt, chatHistory } = req.body;
  try {
    const answer = await aiService.askAiAssistant(prompt, chatHistory);
    return ApiResponse.success(res, "AI response retrieved.", { answer }, 200);
  } catch (error) {
    next(error);
  }
};

export const getGroupChatMessages = async (req, res, next) => {
  const { groupId } = req.params;
  try {
    const messages = await messageService.getGroupMessages(groupId);
    return ApiResponse.success(res, "Group messages retrieved successfully.", messages, 200);
  } catch (error) {
    next(error);
  }
};
