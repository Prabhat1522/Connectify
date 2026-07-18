import Group from "../models/Group.js";
import ApiError from "../utils/apiError.js";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";

export const createGroup = async (creatorId, name, description, avatar, memberIds = []) => {
  if (!name || name.trim() === "") {
    throw new ApiError(400, "Group name is required.");
  }

  let avatarUrl = "";
  if (avatar) {
    if (avatar.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(avatar);
      avatarUrl = upload.secure_url;
    } else {
      avatarUrl = avatar;
    }
  }

  const inviteLink = crypto.randomBytes(8).toString("hex");

  // Ensure creator is in members and admins lists
  const membersSet = new Set([creatorId.toString(), ...memberIds.map(m => m.toString())]);
  const members = Array.from(membersSet);

  const group = await Group.create({
    name,
    description,
    avatar: avatarUrl,
    createdBy: creatorId,
    members,
    admins: [creatorId],
    inviteLink,
  });

  return group.populate("members admins", "fullName email profilePic bio customStatus");
};

export const getUserGroups = async (userId) => {
  const groups = await Group.find({ members: userId })
    .populate("members admins", "fullName email profilePic bio customStatus")
    .sort({ updatedAt: -1 });
  return groups;
};

export const joinGroupViaInvite = async (userId, inviteLink) => {
  const group = await Group.findOne({ inviteLink });
  if (!group) {
    throw new ApiError(404, "Invalid or expired group invite link.");
  }

  if (group.members.includes(userId)) {
    return group.populate("members admins", "fullName email profilePic bio customStatus");
  }

  group.members.push(userId);
  await group.save();

  return group.populate("members admins", "fullName email profilePic bio customStatus");
};

export const updateGroupDetails = async (userId, groupId, updateData) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Only admins can update details
  if (!group.admins.includes(userId)) {
    throw new ApiError(403, "Only group administrators can modify group details.");
  }

  const { name, description, avatar } = updateData;

  if (name !== undefined && name.trim() !== "") group.name = name;
  if (description !== undefined) group.description = description;

  if (avatar) {
    if (avatar.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(avatar);
      group.avatar = upload.secure_url;
    } else {
      group.avatar = avatar;
    }
  }

  await group.save();
  return group.populate("members admins", "fullName email profilePic bio customStatus");
};
