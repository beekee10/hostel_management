import { Router } from "express";
import {
  createComplaint,
  listComplaints,
  supervisorSummary,
  updateComplaintStatus,
  forwardComplaint,
} from "./complaint.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listComplaints);
router.post("/", createComplaint);

// AI Supervisor Summary: available to all authenticated users viewing complaints triage
router.get("/ai/supervisor-summary", supervisorSummary);
router.get("/supervisor-summary", supervisorSummary);
router.get("/ai/summary", supervisorSummary);

// Update status: Warden, Supervisor, Student Representative, Admin
router.patch(
  "/:id/status",
  requireRole("SUPERVISOR", "WARDEN", "ADMIN", "STUDENT_COORDINATOR"),
  updateComplaintStatus,
);

// Review & Forward complaints: Student Representative, Supervisor, Warden, Admin
router.post(
  "/:id/forward",
  requireRole("STUDENT_COORDINATOR", "SUPERVISOR", "WARDEN", "ADMIN"),
  forwardComplaint,
);

export default router;
