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
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import {
  validateSignup,
  validateLogin,
  validateVerifyOTP,
} from "../validators/authValidator.js";

const userRouter = express.Router();

userRouter.post("/signup", validateSignup, signup);
userRouter.post("/verify-otp", validateVerifyOTP, verifyOTP);
userRouter.post("/resend-otp", resendOTP);
userRouter.post("/login", validateLogin, login);

userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

userRouter.post("/block/:id", protectRoute, toggleBlock);
userRouter.post("/report/:id", protectRoute, report);

export default userRouter;