import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import complaintRoutes from "./modules/complaints/complaint.routes.js";
import noticeRoutes from "./modules/notices/notice.routes.js";
import communityRoutes from "./modules/community/community.routes.js";
import messRoutes from "./modules/mess/mess.routes.js";
import chatRoutes from "./modules/conversations/chat.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import helpRequesRoutes from "./modules/help-requests/help-request.routes.js";
import helpOfferRoutes from "./modules/help-offers/help-offer.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Disable ETags to prevent conditional 304 Not Modified responses on API calls & auth errors
app.set("etag", false);

app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" })); // Supports profile picture base64 uploads

// Prevent browser/client from caching dynamic API routes and returning 304s
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "Smart Hostel Management API (CampusNest)",
    data: null,
    timestamp: new Date().toISOString(),
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "API healthy",
    data: null,
    timestamp: new Date().toISOString(),
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/help-requests", helpRequesRoutes);
app.use("/api/help-offers", helpOfferRoutes);

app.use(errorHandler);

export default app;
