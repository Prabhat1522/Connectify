import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  createGroup,
  getUserGroups,
  joinGroupViaInvite,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/create", protectRoute, createGroup);
groupRouter.get("/list", protectRoute, getUserGroups);
groupRouter.post("/join", protectRoute, joinGroupViaInvite);
groupRouter.put("/update/:groupId", protectRoute, updateGroup);
groupRouter.delete("/delete/:groupId", protectRoute, deleteGroup);

export default groupRouter;
