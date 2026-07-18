import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import ApiError from "../utils/apiError.js";
import cloudinary from "../config/cloudinary.js";

export const getSidebarUsers = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  // Exclude users who are blocked by the current user
  const excludedIds = [userId, ...(user.blockedUsers || [])];

  // Also exclude users who blocked this user
  const blockedByOthers = await User.find({ blockedUsers: userId }).select("_id");
  blockedByOthers.forEach((u) => excludedIds.push(u._id.toString()));

  const filteredUsers = await User.find({ _id: { $nin: excludedIds } }).select("-password");

  // Count unseen messages for each user
  const unseenMessages = {};
  const promises = filteredUsers.map(async (u) => {
    const messages = await Message.find({
      senderId: u._id,
      receiverId: userId,
      seen: false,
    });
    if (messages.length > 0) {
      unseenMessages[u._id] = messages.length;
    }
  });

  await Promise.all(promises);

  return {
    users: filteredUsers,
    unseenMessages,
  };
};

export const getDirectMessages = async (userId, otherUserId) => {
  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }).populate("replyTo");

  // Mark all unread received messages as seen
  await Message.updateMany(
    { senderId: otherUserId, receiverId: userId, seen: false },
    { seen: true }
  );

  return messages;
};

export const getGroupMessages = async (groupId) => {
  const messages = await Message.find({ groupId }).populate("senderId", "fullName email profilePic").populate("replyTo");
  return messages;
};

export const sendChatMessage = async (senderId, targetId, isGroup, payload) => {
  const { text, image, fileData, fileName, fileType, replyToId } = payload;

  let imageUrl = "";
  let fileUrl = "";

  // 1. Upload image to Cloudinary if present
  if (image) {
    if (image.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    } else {
      imageUrl = image;
    }
  }

  // 2. Upload file/audio to Cloudinary if present
  if (fileData) {
    if (fileData.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(fileData, {
        resource_type: "auto",
      });
      fileUrl = uploadResponse.secure_url;
    } else {
      fileUrl = fileData;
    }
  }

  const messageData = {
    senderId,
    text,
    image: imageUrl || undefined,
    fileUrl: fileUrl || undefined,
    fileName: fileUrl ? fileName || "Attachment" : undefined,
    fileType: fileUrl ? fileType || "application/octet-stream" : undefined,
    replyTo: replyToId || null,
  };

  if (isGroup) {
    messageData.groupId = targetId;
  } else {
    // Check block list before sending direct message
    const sender = await User.findById(senderId);
    const receiver = await User.findById(targetId);

    if (!sender || !receiver) {
      throw new ApiError(404, "User not found.");
    }

    if (sender.blockedUsers.includes(targetId) || receiver.blockedUsers.includes(senderId)) {
      throw new ApiError(403, "You cannot send messages to this user.");
    }

    messageData.receiverId = targetId;
  }

  const newMessage = await Message.create(messageData);
  let populatedMessage = await newMessage.populate("replyTo");
  if (isGroup) {
    populatedMessage = await populatedMessage.populate("senderId", "fullName email profilePic");
  }

  return populatedMessage;
};

export const toggleMessageReaction = async (userId, messageId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found.");

  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString()
  );

  if (existingReactionIndex > -1) {
    const currentReaction = message.reactions[existingReactionIndex];
    if (currentReaction.emoji === emoji) {
      // Remove reaction if it's the same emoji clicked
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Edit reaction emoji
      currentReaction.emoji = emoji;
    }
  } else {
    // Add new reaction
    message.reactions.push({ userId, emoji });
  }

  await message.save();
  return message.populate("replyTo");
};

export const editChatMessage = async (userId, messageId, newText) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found.");

  if (message.senderId.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only edit your own messages.");
  }

  if (message.deleted) {
    throw new ApiError(400, "Cannot edit a deleted message.");
  }

  message.text = newText;
  message.edited = true;
  await message.save();

  return message.populate("replyTo");
};

export const deleteChatMessage = async (userId, messageId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found.");

  if (message.senderId.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own messages.");
  }

  message.text = "This message was deleted";
  message.image = undefined;
  message.fileUrl = undefined;
  message.fileName = undefined;
  message.fileType = undefined;
  message.deleted = true;
  await message.save();

  return message.populate("replyTo");
};

export const toggleMessagePin = async (messageId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found.");

  message.pinned = !message.pinned;
  await message.save();

  return message.populate("replyTo");
};
