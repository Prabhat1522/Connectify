import express from "express";
import {
  checkAuth,
  login,
  signup,
  updateProfile,
  verifyOTP,
  resendOTP,
  toggleBlock,
  report,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import {
  validateSignup,
  validateLogin,
  validateVerifyOTP,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} from "../validators/authValidator.js";

const userRouter = express.Router();

userRouter.post("/signup", validateSignup, signup);
userRouter.post("/verify-otp", validateVerifyOTP, verifyOTP);
userRouter.post("/resend-otp", resendOTP);
userRouter.post("/login", validateLogin, login);
userRouter.post("/forgot-password", validateForgotPassword, forgotPassword);
userRouter.post("/reset-password", validateResetPassword, resetPassword);

userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.put("/change-password", protectRoute, validateChangePassword, changePassword);
userRouter.get("/check", protectRoute, checkAuth);

userRouter.post("/block/:id", protectRoute, toggleBlock);
userRouter.post("/report/:id", protectRoute, report);

export default userRouter;