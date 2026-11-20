import { Router } from "express";
import {
  login,
  register,
  getMe,
  handleChangePassword,
  handleUpdateProfile,
} from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, handleChangePassword);
router.put("/profile", requireAuth, handleUpdateProfile);

export default router;
