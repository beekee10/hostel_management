import { Router } from "express";
import {
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "./notice.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

// All authenticated users can read active notices
router.get("/", listNotices);

// Create Notice: Warden, Supervisor, Student Representative, Admin
router.post(
  "/",
  requireRole("WARDEN", "SUPERVISOR", "STUDENT_COORDINATOR", "ADMIN"),
  createNotice,
);

// Edit Notice: Warden, Supervisor, Student Representative, Admin
router.put(
  "/:id",
  requireRole("WARDEN", "SUPERVISOR", "STUDENT_COORDINATOR", "ADMIN"),
  updateNotice,
);

// Delete Notice: Warden, Supervisor, Admin
router.delete(
  "/:id",
  requireRole("WARDEN", "SUPERVISOR", "ADMIN"),
  deleteNotice,
);

export default router;
