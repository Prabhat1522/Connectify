import * as userService from "../services/userService.js";
import ApiResponse from "../utils/apiResponse.js";

export const signup = async (req, res, next) => {
  const { fullName, email, password, bio } = req.body;
  try {
    const result = await userService.createUserSignup(fullName, email, password, bio);
    return ApiResponse.success(res, result.message, null, 201);
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  const { email, otp, password } = req.body;
  try {
    const result = await userService.verifyUserOTP(email, otp, password);
    return ApiResponse.success(res, "Account verified and created successfully.", result, 200);
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const result = await userService.resendVerificationOTP(email);
    return ApiResponse.success(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await userService.loginUser(email, password);
    return ApiResponse.success(res, "Logged in successfully.", result, 200);
  } catch (error) {
    next(error);
  }
};

export const checkAuth = async (req, res, next) => {
  try {
    return ApiResponse.success(res, "User authenticated.", req.user, 200);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserProfile(req.user._id, req.body);
    return ApiResponse.success(res, "Profile updated successfully.", updatedUser, 200);
  } catch (error) {
    next(error);
  }
};

export const toggleBlock = async (req, res, next) => {
  const { id: targetId } = req.params;
  try {
    const result = await userService.toggleBlockUser(req.user._id, targetId);
    const msg = result.blocked ? "User blocked successfully." : "User unblocked successfully.";
    return ApiResponse.success(res, msg, result.blockedUsers, 200);
  } catch (error) {
    next(error);
  }
};

export const report = async (req, res, next) => {
  const { id: targetId } = req.params;
  try {
    const result = await userService.reportUser(req.user._id, targetId);
    return ApiResponse.success(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};