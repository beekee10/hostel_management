import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { Complaint } from "./complaint.model.js";
import { User } from "../auth/user.model.js";
import { classifyComplaint, summarizeComplaints } from "../ai/ai.service.js";
import { AppError } from "../../utils/appError.js";

export async function createComplaint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, category } = req.body;
    if (!title || !description) {
      throw new AppError("Title and description are required", 400, "VALIDATION_ERROR");
    }

    const studentUser = await User.findById(req.user!.userId);

    const complaint = await Complaint.create({
      ...req.body,
      studentId: req.user!.userId,
      block: req.body.block || studentUser?.block || "Block A",
      roomNumber: req.body.roomNumber || studentUser?.roomNumber || "",
      category: category || "OTHER",
    });

    try {
      const ai = await classifyComplaint({ title, description });
      Object.assign(complaint, {
        category: ai.category,
        severity: ai.severity,
        urgencyScore: ai.urgencyScore,
        priorityScore: ai.priorityScore,
        aiProcessed: true,
        aiReason: ai.reason,
      });
      await complaint.save();
    } catch {
      // AI fallback gracefully handled in provider
    }

    const populated = await Complaint.findById(complaint._id)
      .populate("studentId", "fullName email roomNumber block avatarUrl")
      .populate("forwardedBy", "fullName role");

    return res.status(201).json({
      success: true,
      message: "Complaint registered and triaged",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function listComplaints(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status, category, severity, myOnly, search } = req.query;
    const query: any = {};

    if (myOnly === "true") {
      query.studentId = req.user!.userId;
    }
    if (status && status !== "ALL") query.status = status;
    if (category && category !== "ALL") query.category = category;
    if (severity && severity !== "ALL") query.severity = severity;
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { roomNumber: searchRegex }];
    }

    const complaints = await Complaint.find(query)
      .populate("studentId", "fullName email roomNumber block avatarUrl")
      .populate("forwardedBy", "fullName role")
      .sort({ priorityScore: -1, createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      message: "Complaints fetched successfully",
      data: complaints,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateComplaintStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new AppError("Complaint not found", 404, "NOT_FOUND");
    }

    if (status) complaint.status = status;
    if (status === "RESOLVED") {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    const populated = await Complaint.findById(id)
      .populate("studentId", "fullName email roomNumber block avatarUrl")
      .populate("forwardedBy", "fullName role");

    return res.json({
      success: true,
      message: "Complaint status updated",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function forwardComplaint(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { forwardTarget, coordinatorNotes } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new AppError("Complaint not found", 404, "NOT_FOUND");
    }

    complaint.isForwarded = true;
    complaint.forwardedTo = forwardTarget || "Chief Warden & Maintenance Team";
    complaint.forwardedBy = req.user!.userId as any;
    complaint.forwardedAt = new Date();
    if (coordinatorNotes) complaint.coordinatorNotes = coordinatorNotes;
    if (complaint.status === "OPEN") complaint.status = "ACKNOWLEDGED";

    await complaint.save();

    const populated = await Complaint.findById(id)
      .populate("studentId", "fullName email roomNumber block avatarUrl")
      .populate("forwardedBy", "fullName role");

    return res.json({
      success: true,
      message: "Complaint escalated/forwarded successfully",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function supervisorSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const complaints = await Complaint.find()
      .populate("studentId", "fullName roomNumber block")
      .sort({ createdAt: -1 })
      .limit(50);

    const summary = await summarizeComplaints(complaints);

    const totalActiveComplaints = complaints.filter(
      (c) => c.status !== "RESOLVED" && c.status !== "REJECTED",
    ).length;
    const criticalCount = complaints.filter(
      (c) => c.severity === "CRITICAL" && c.status !== "RESOLVED",
    ).length;
    const highCount = complaints.filter(
      (c) => c.severity === "HIGH" && c.status !== "RESOLVED",
    ).length;

    return res.json({
      success: true,
      message: "AI Supervisor Summary generated",
      data: {
        ...summary,
        totalActiveComplaints,
        criticalCount,
        highCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export const getSupervisorAiSummary = supervisorSummary;
