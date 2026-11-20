import { Router } from "express";
import {
  getMenu,
  updateDayMenu,
  listReviews,
  createReview,
  addWastage,
  wastageSummary,
  generateAiWastageReport,
} from "./mess.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

// Menu
router.get("/menu", getMenu);
router.put(
  "/menu",
  requireRole("MESS_COORDINATOR", "STUDENT_COORDINATOR", "ADMIN"),
  updateDayMenu,
);

// Reviews
router.get("/reviews", listReviews);
router.post("/reviews", createReview);

// Wastage Tracker & AI Report
router.get("/wastage", wastageSummary);
router.post(
  "/wastage",
  requireRole("MESS_COORDINATOR", "ADMIN", "SUPERVISOR"),
  addWastage,
);
router.post(
  "/ai-report",
  requireRole("MESS_COORDINATOR", "STUDENT_COORDINATOR", "SUPERVISOR", "WARDEN", "ADMIN"),
  generateAiWastageReport,
);

export default router;
