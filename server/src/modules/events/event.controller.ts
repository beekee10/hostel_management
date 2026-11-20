import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { HostelEvent } from "./event.model.js";
import { User } from "../auth/user.model.js";
import { AppError } from "../../utils/appError.js";

async function ensureSampleEvents() {
  const count = await HostelEvent.countDocuments();
  if (count === 0) {
    const warden = await User.findOne({ email: "warden@campus.in" });
    const rep = await User.findOne({ email: "representative@campus.in" });
    const alex = await User.findOne({ email: "student@campus.in" });

    if (warden) {
      const nextSaturday = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      nextSaturday.setHours(18, 0, 0, 0);

      const nextSunday = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);
      nextSunday.setHours(10, 0, 0, 0);

      await HostelEvent.create([
        {
          title: "🏆 Annual Inter-Hostel Badminton & Table Tennis Championship",
          description: "Intra-hostel sports tournament between Block A, Block B, and Block C. Equipment provided on court. Medals and refreshments for all participants!",
          category: "SPORTS",
          venue: "Hostel Sports Complex & Recreation Hall",
          googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD_sample_sports_form/viewform",
          eventDate: nextSaturday,
          createdBy: warden._id,
          studentManagers: rep && alex ? [rep._id, alex._id] : [],
          attendees: alex ? [alex._id] : [],
          maxAttendees: 64,
          status: "UPCOMING",
        },
        {
          title: "💻 Hostel 24-Hour Web & AI Hackathon",
          description: "Collaborative coding jam to build smart campus tools! High-speed dedicated WiFi, midnight pizza & snacks, and prizes from alumni mentors.",
          category: "HACKATHON",
          venue: "Hostel Common Room & Study Lounge 3rd Floor",
          googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD_sample_hackathon_form/viewform",
          eventDate: nextSunday,
          createdBy: warden._id,
          studentManagers: rep ? [rep._id] : [],
          attendees: [],
          maxAttendees: 50,
          status: "UPCOMING",
        },
      ]);
    }
  }
}

export async function listEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await ensureSampleEvents();

    const { category, status } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const events = await HostelEvent.find(query)
      .populate("createdBy", "fullName email role roomNumber block avatarUrl")
      .populate("studentManagers", "fullName email role roomNumber block phoneNumber avatarUrl")
      .populate("attendees", "fullName email role roomNumber block department phoneNumber avatarUrl")
      .sort({ eventDate: 1 });

    res.json({
      success: true,
      message: "Hostel events fetched successfully",
      data: events,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, category, venue, eventDate, endDate, studentManagers, maxAttendees, googleFormUrl } = req.body;

    if (!title || !description || !venue || !eventDate) {
      throw new AppError("Title, description, venue, and event date are required", 400, "VALIDATION_ERROR");
    }

    const event = await HostelEvent.create({
      title: title.trim(),
      description: description.trim(),
      category: category || "CULTURAL",
      venue: venue.trim(),
      googleFormUrl: googleFormUrl?.trim() || "",
      eventDate: new Date(eventDate),
      endDate: endDate ? new Date(endDate) : undefined,
      studentManagers: Array.isArray(studentManagers) ? studentManagers : [],
      createdBy: req.user!.userId,
      attendees: [],
      maxAttendees: maxAttendees ? Number(maxAttendees) : 0,
      status: "UPCOMING",
    });

    const populated = await HostelEvent.findById(event._id)
      .populate("createdBy", "fullName email role roomNumber block avatarUrl")
      .populate("studentManagers", "fullName email role roomNumber block phoneNumber avatarUrl")
      .populate("attendees", "fullName email role roomNumber block department phoneNumber avatarUrl");

    res.status(201).json({
      success: true,
      message: "Hostel event organized and student managers assigned",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const event = await HostelEvent.findById(id);
    if (!event) throw new AppError("Event not found", 404, "NOT_FOUND");

    // Only the event creator, or Warden/Admin can edit the event
    const isCreator = event.createdBy.toString() === currentUserId;
    const isAdminOrWarden = currentUserRole === "WARDEN" || currentUserRole === "ADMIN";

    if (!isCreator && !isAdminOrWarden) {
      throw new AppError(
        "Permission Denied: Only the creator of this event (or Warden/Admin) has authorization to edit it.",
        403,
        "FORBIDDEN",
      );
    }

    const { title, description, category, venue, eventDate, endDate, studentManagers, status, maxAttendees, googleFormUrl } = req.body;

    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (category) event.category = category;
    if (venue) event.venue = venue.trim();
    if (googleFormUrl !== undefined) event.googleFormUrl = googleFormUrl.trim();
    if (eventDate) event.eventDate = new Date(eventDate);
    if (endDate) event.endDate = new Date(endDate);
    if (studentManagers) event.studentManagers = studentManagers;
    if (status) event.status = status;
    if (maxAttendees !== undefined) event.maxAttendees = Number(maxAttendees);

    await event.save();

    const populated = await HostelEvent.findById(id)
      .populate("createdBy", "fullName email role roomNumber block avatarUrl")
      .populate("studentManagers", "fullName email role roomNumber block phoneNumber avatarUrl")
      .populate("attendees", "fullName email role roomNumber block department phoneNumber avatarUrl");

    res.json({
      success: true,
      message: "Event updated successfully",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleRsvp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const event = await HostelEvent.findById(id);
    if (!event) throw new AppError("Event not found", 404, "NOT_FOUND");

    const hasRsvpd = event.attendees.some((a) => a.toString() === userId);

    if (hasRsvpd) {
      event.attendees = event.attendees.filter((a) => a.toString() !== userId) as any;
    } else {
      if (event.maxAttendees && event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
        throw new AppError("Event registration limit reached (Full capacity)", 400, "CAPACITY_FULL");
      }
      event.attendees.push(userId as any);
    }

    await event.save();

    const populated = await HostelEvent.findById(id)
      .populate("createdBy", "fullName email role roomNumber block avatarUrl")
      .populate("studentManagers", "fullName email role roomNumber block phoneNumber avatarUrl")
      .populate("attendees", "fullName email role roomNumber block department phoneNumber avatarUrl");

    res.json({
      success: true,
      message: hasRsvpd ? "RSVP cancelled" : "Registered for event successfully! See you there 👋",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const event = await HostelEvent.findById(id);
    if (!event) throw new AppError("Event not found", 404, "NOT_FOUND");

    // Deletion permissions:
    // 1. Creator of the event (Student or any user) can delete their own event.
    // 2. Student Representative (STUDENT_COORDINATOR), Warden (WARDEN), and Admin (ADMIN) can delete events.
    const isCreator = event.createdBy.toString() === currentUserId;
    const isModerator =
      currentUserRole === "STUDENT_COORDINATOR" ||
      currentUserRole === "WARDEN" ||
      currentUserRole === "ADMIN";

    if (!isCreator && !isModerator) {
      throw new AppError(
        "Permission Denied: Only the creator, Student Representative, Warden, or Admin can delete this event.",
        403,
        "FORBIDDEN",
      );
    }

    await HostelEvent.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Event deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
