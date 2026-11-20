import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { Notice } from "./notice.model.js";
import { AppError } from "../../utils/appError.js";

export async function listNotices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { type, block, isPinned } = req.query;
    const query: any = {
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    if (type) query.type = type;
    if (block && block !== "All Blocks") {
      query.$or = [{ block: "All Blocks" }, { block }];
    }
    if (isPinned === "true") query.isPinned = true;

    const notices = await Notice.find(query)
      .populate("createdBy", "fullName role")
      .sort({ isPinned: -1, isEmergency: -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      message: "Notices fetched successfully",
      data: notices,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, body, type, block, scheduledStart, scheduledEnd, affectedAreas, isPinned, isEmergency, expiresAt } = req.body;

    if (!title || !body) {
      throw new AppError("Notice title and body content are required", 400, "VALIDATION_ERROR");
    }

    const notice = await Notice.create({
      title,
      body,
      type: type || "GENERAL",
      block: block || "All Blocks",
      scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
      affectedAreas: affectedAreas || "Entire Hostel",
      isPinned: Boolean(isPinned),
      isEmergency: Boolean(isEmergency) || type === "EMERGENCY",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user!.userId,
    });

    const populated = await Notice.findById(notice._id).populate("createdBy", "fullName role");

    res.status(201).json({
      success: true,
      message: "Notice published successfully",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      throw new AppError("Notice not found", 404, "NOT_FOUND");
    }

    const { title, body, type, block, scheduledStart, scheduledEnd, affectedAreas, isPinned, isEmergency, expiresAt } = req.body;

    if (title) notice.title = title;
    if (body) notice.body = body;
    if (type) notice.type = type;
    if (block !== undefined) notice.block = block;
    if (scheduledStart !== undefined) notice.scheduledStart = scheduledStart ? new Date(scheduledStart) : undefined;
    if (scheduledEnd !== undefined) notice.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : undefined;
    if (affectedAreas !== undefined) notice.affectedAreas = affectedAreas;
    if (isPinned !== undefined) notice.isPinned = Boolean(isPinned);
    if (isEmergency !== undefined) notice.isEmergency = Boolean(isEmergency);
    if (expiresAt !== undefined) notice.expiresAt = expiresAt ? new Date(expiresAt) : undefined;

    await notice.save();

    const populated = await Notice.findById(id).populate("createdBy", "fullName role");

    res.json({
      success: true,
      message: "Notice updated successfully",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
      throw new AppError("Notice not found", 404, "NOT_FOUND");
    }

    res.json({
      success: true,
      message: "Notice deleted successfully",
      data: { id },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
