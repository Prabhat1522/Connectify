import ApiError from "../utils/apiError.js";

export const validateSignup = (req, res, next) => {
  const { fullName, email, password, bio } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    throw new ApiError(400, "Full name is required and must be a valid string.");
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password is required and must be at least 6 characters long.");
  }

  if (!bio || typeof bio !== 'string' || bio.trim() === '') {
    throw new ApiError(400, "Bio is required and must be a valid string.");
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  next();
};

export const validateVerifyOTP = (req, res, next) => {
  const { email, otp, password } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!otp || otp.length !== 6) {
    throw new ApiError(400, "A 6-digit OTP is required.");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password is required and must be at least 6 characters long.");
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  next();
};

export const validateResetPassword = (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!otp || otp.length !== 6) {
    throw new ApiError(400, "A 6-digit OTP is required.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password is required and must be at least 6 characters long.");
  }

  next();
};

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    throw new ApiError(400, "Current password is required.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password is required and must be at least 6 characters long.");
  }

  next();
};


