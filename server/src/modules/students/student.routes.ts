import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  listStudents,
  createStudent,
  updateStudent,
  adminResetStudentPassword,
  deleteStudent,
} from "./student.controller.js";

const router = Router();

router.use(requireAuth);

// List students for directory and event student manager appointment
router.get(
  "/",
  listStudents,
);

// Create student: Supervisors, Wardens, Admins
router.post(
  "/",
  requireRole("SUPERVISOR", "WARDEN", "ADMIN"),
  createStudent,
);

// Update student: Supervisors, Wardens, Admins
router.put(
  "/:id",
  requireRole("SUPERVISOR", "WARDEN", "ADMIN"),
  updateStudent,
);

// Admin / Warden Reset Student Password from directory
router.post(
  "/:id/reset-password",
  requireRole("WARDEN", "ADMIN"),
  adminResetStudentPassword,
);

// Delete student: Handled inside controller with explicit check blocking SUPERVISOR
router.delete(
  "/:id",
  requireRole("SUPERVISOR", "WARDEN", "ADMIN"),
  deleteStudent,
);

export default router;
