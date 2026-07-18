import * as groupService from "../services/groupService.js";
import ApiResponse from "../utils/apiResponse.js";
import { io } from "../server.js";

export const createGroup = async (req, res, next) => {
  const { name, description, avatar, members } = req.body;
  try {
    const group = await groupService.createGroup(
      req.user._id,
      name,
      description,
      avatar,
      members
    );

    // Notify all online group members via sockets to join room
    group.members.forEach((member) => {
      // Sockets can join on client side or we send socket event
      // We can broadcast a 'groupCreated' event
      // We will handle group socket joins in the socket server.js
    });

    return ApiResponse.success(res, "Group created successfully.", group, 201);
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req, res, next) => {
  try {
    const groups = await groupService.getUserGroups(req.user._id);
    return ApiResponse.success(res, "User groups retrieved successfully.", groups, 200);
  } catch (error) {
    next(error);
  }
};

export const joinGroupViaInvite = async (req, res, next) => {
  const { inviteLink } = req.body;
  try {
    const group = await groupService.joinGroupViaInvite(req.user._id, inviteLink);
    
    // Broadcast member joined
    io.to(group._id.toString()).emit("memberJoined", {
      groupId: group._id,
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        profilePic: req.user.profilePic,
      },
    });

    return ApiResponse.success(res, "Joined group successfully.", group, 200);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  const { groupId } = req.params;
  try {
    const group = await groupService.updateGroupDetails(req.user._id, groupId, req.body);
    
    // Notify room of group updates
    io.to(groupId).emit("groupUpdated", group);

    return ApiResponse.success(res, "Group details updated successfully.", group, 200);
  } catch (error) {
    next(error);
  }
};
