import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken } from "../helpers/tokenHelper.js";
import { sendOTPEmail, sendAccountCreatedEmail, sendResetPasswordOTPEmail } from "../helpers/emailHelper.js";
import cloudinary from "../config/cloudinary.js";

export const createUserSignup = async (fullName, email, password, bio) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "An account with this email already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // OTP temporarily disabled for deployment.
  // Re-enable after configuring a verified email domain.
  //
  // const otp = crypto.randomInt(100000, 999999).toString();
  // const otpExpiry = Date.now() + 5 * 60 * 1000;
  // console.log(`[DEBUG] OTP for ${email}: ${otp}`);
  // sendOTPEmail(email, otp).catch(err => console.error("Async sendOTPEmail error:", err.message));
  // await User.deleteOne({ email, isVerified: false });

  await User.create({
    fullName,
    email,
    password: hashedPassword,
    bio,
    isVerified: true, // Temporarily set to true — re-enable OTP to set false again
  });

  return { message: "Account created successfully." };
};

export const verifyUserOTP = async (email, otp, password) => {
  const user = await User.findOne({ email });
  if (!user || user.isVerified) {
    throw new ApiError(400, "Verification request invalid or user already verified.");
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(400, "The OTP code provided is invalid or has expired.");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  // Finalize password save (in case they changed it since step 1)
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user.save();
  const token = generateToken(user._id);

  sendAccountCreatedEmail(user.email, user.fullName);

  return {
    token,
    userData: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      profilePic: user.profilePic,
      themePreference: user.themePreference,
      accentColor: user.accentColor,
      customStatus: user.customStatus,
      blockedUsers: user.blockedUsers,
      reportedUsers: user.reportedUsers,
    },
  };
};

export const resendVerificationOTP = async (email) => {
  const user = await User.findOne({ email, isVerified: false });
  if (!user) {
    throw new ApiError(404, "Unverified user not found.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  await user.save();

  console.log(`[DEBUG] Resend OTP for ${email}: ${otp}`);
  sendOTPEmail(email, otp).catch(err => console.error("Async resendOTPEmail error:", err.message));
  return { message: "Verification OTP resent." };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "Invalid email or password.");
  }

  // OTP temporarily disabled for deployment.
  // Re-enable after configuring a verified email domain.
  // if (!user.isVerified) {
  //   throw new ApiError(401, "Your account is not verified. Please register again.");
  // }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid email or password.");
  }

  const token = generateToken(user._id);
  return {
    token,
    userData: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      profilePic: user.profilePic,
      themePreference: user.themePreference,
      accentColor: user.accentColor,
      customStatus: user.customStatus,
      blockedUsers: user.blockedUsers,
      reportedUsers: user.reportedUsers,
    },
  };
};

export const updateUserProfile = async (userId, updateData) => {
  const { profilePic, bio, fullName, themePreference, accentColor, customStatus } = updateData;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (themePreference !== undefined) user.themePreference = themePreference;
  if (accentColor !== undefined) user.accentColor = accentColor;
  if (customStatus !== undefined) user.customStatus = customStatus;

  if (profilePic) {
    // If it's a new base64 image, upload to Cloudinary
    if (profilePic.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(profilePic);
      user.profilePic = upload.secure_url;
    } else {
      user.profilePic = profilePic;
    }
  }

  await user.save();
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    bio: user.bio,
    profilePic: user.profilePic,
    themePreference: user.themePreference,
    accentColor: user.accentColor,
    customStatus: user.customStatus,
    blockedUsers: user.blockedUsers,
    reportedUsers: user.reportedUsers,
  };
};

export const toggleBlockUser = async (userId, targetId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, "Target user not found.");

  const index = user.blockedUsers.indexOf(targetId);
  let blocked = false;
  if (index > -1) {
    user.blockedUsers.splice(index, 1);
  } else {
    user.blockedUsers.push(targetId);
    blocked = true;
  }
  await user.save();
  return { blockedUsers: user.blockedUsers, blocked };
};

export const reportUser = async (userId, targetId) => {
  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, "Target user not found.");

  if (!target.reportedUsers.includes(userId)) {
    target.reportedUsers.push(userId);
    await target.save();
  }
  return { message: "User reported successfully." };
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account registered with this email address.");
  }

  if (!user.isVerified) {
    throw new ApiError(400, "This account is not verified yet. Please sign up first.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  await user.save();

  console.log(`[DEBUG] Reset Password OTP for ${email}: ${otp}`);
  sendResetPasswordOTPEmail(email, otp).catch(err => console.error("Async sendResetPasswordOTPEmail error:", err.message));
  return { message: "Password reset OTP sent to your email." };
};

export const resetUserPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account registered with this email address.");
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    throw new ApiError(400, "The OTP code provided is invalid or has expired.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return { message: "Password reset successfully." };
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(400, "Incorrect current password.");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from your current password.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();

  return { message: "Password updated successfully." };
};


