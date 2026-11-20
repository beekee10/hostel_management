import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { Conversation } from "./conversation.model.js";
import { Message } from "../messages/message.model.js";
import { User } from "../auth/user.model.js";
import { AppError } from "../../utils/appError.js";

const ALLOWED_MESS_COORDINATOR_DM_ROLES = [
  "STUDENT_COORDINATOR",
  "WARDEN",
  "SUPERVISOR",
  "ADMIN",
];

async function ensureDefaultChannels() {
  const count = await Conversation.countDocuments({ type: "CHANNEL" });
  if (count === 0) {
    await Conversation.insertMany([
      {
        type: "CHANNEL",
        name: "general-lounge",
        topic: "General hostel announcements, questions, and casual student chat",
        isDefault: true,
        lastMessage: {
          text: "Welcome to CampusNest Community Chat!",
          senderName: "Hostel Warden",
          sentAt: new Date(),
        },
      },
      {
        type: "CHANNEL",
        name: "power-water-alerts",
        topic: "Real-time updates regarding electricity, maintenance, and water supplies",
        isDefault: true,
        lastMessage: {
          text: "All primary utility lines are operational.",
          senderName: "Hostel Supervisor",
          sentAt: new Date(),
        },
      },
      {
        type: "CHANNEL",
        name: "mess-feedback",
        topic: "Daily menu discussions, food suggestions, and special meal queries",
        isDefault: true,
        lastMessage: {
          text: "Check out today's special dinner menu on the Mess page!",
          senderName: "Mess Incharge",
          sentAt: new Date(),
        },
      },
      {
        type: "CHANNEL",
        name: "maintenance-room",
        topic: "Quick coordinator communication for plumbing, lights, and appliance repairs",
        isDefault: true,
        lastMessage: {
          text: "Maintenance technicians are on duty from 9 AM to 6 PM.",
          senderName: "Student Representative",
          sentAt: new Date(),
        },
      },
    ]);
  }
}

export async function getConversations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await ensureDefaultChannels();

    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let channels = await Conversation.find({ type: "CHANNEL" }).sort({ createdAt: 1 });
    let directChats = await Conversation.find({
      type: { $in: ["DIRECT", "GROUP"] },
      participants: userId,
    })
      .populate("participants", "fullName email role roomNumber block avatarUrl")
      .sort({ updatedAt: -1 });

    // Mess Coordinator Scope Enforcement:
    // 1. Only access mess-feedback channel.
    // 2. Only direct message with Student Representative, Warden, Supervisor, and Admin.
    if (userRole === "MESS_COORDINATOR") {
      channels = channels.filter((c) => c.name === "mess-feedback");
      directChats = directChats.filter((chat) => {
        const other = (chat.participants as any[])?.find(
          (p: any) => (p._id || p.id || p).toString() !== userId,
        );
        return other && other.role && ALLOWED_MESS_COORDINATOR_DM_ROLES.includes(other.role);
      });
    }

    res.json({
      success: true,
      message: "Conversations fetched successfully",
      data: {
        channels,
        directChats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "fullName email role roomNumber block",
    );
    if (!conversation) throw new AppError("Conversation not found", 404, "NOT_FOUND");

    // Mess Coordinator Permissions Check
    if (userRole === "MESS_COORDINATOR") {
      if (conversation.type === "CHANNEL" && conversation.name !== "mess-feedback") {
        throw new AppError(
          "Permission Denied: Mess Coordinator only has authorization to access the #mess-feedback channel.",
          403,
          "FORBIDDEN_CHANNEL",
        );
      }
      if (conversation.type === "DIRECT") {
        const other = (conversation.participants as any[])?.find(
          (p: any) => (p._id || p.id || p).toString() !== userId,
        );
        if (!other || !other.role || !ALLOWED_MESS_COORDINATOR_DM_ROLES.includes(other.role)) {
          throw new AppError(
            "Permission Denied: Mess Coordinator can only direct message Student Representatives, Wardens, and Supervisors.",
            403,
            "FORBIDDEN_DM",
          );
        }
      }
    }

    const messages = await Message.find({ conversationId })
      .populate("senderId", "fullName email role roomNumber block avatarUrl")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      success: true,
      message: "Messages fetched",
      data: messages,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { conversationId } = req.params;
    const { text, tag } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (!text || !text.trim()) {
      throw new AppError("Message content cannot be empty", 400, "VALIDATION_ERROR");
    }

    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "fullName email role roomNumber block",
    );
    if (!conversation) throw new AppError("Conversation not found", 404, "NOT_FOUND");

    // Mess Coordinator Permissions Check
    if (userRole === "MESS_COORDINATOR") {
      if (conversation.type === "CHANNEL" && conversation.name !== "mess-feedback") {
        throw new AppError(
          "Permission Denied: Mess Coordinator can only post in the #mess-feedback channel.",
          403,
          "FORBIDDEN_CHANNEL",
        );
      }
      if (conversation.type === "DIRECT") {
        const other = (conversation.participants as any[])?.find(
          (p: any) => (p._id || p.id || p).toString() !== userId,
        );
        if (!other || !other.role || !ALLOWED_MESS_COORDINATOR_DM_ROLES.includes(other.role)) {
          throw new AppError(
            "Permission Denied: Mess Coordinator can only direct message Student Representatives, Wardens, and Supervisors.",
            403,
            "FORBIDDEN_DM",
          );
        }
      }
    }

    // Blocking Verification for Direct Messages
    if (conversation.type === "DIRECT" && conversation.blockedBy && conversation.blockedBy.length > 0) {
      const isBlockedBySelf = conversation.blockedBy.some((b) => b.toString() === userId);
      if (isBlockedBySelf) {
        throw new AppError(
          "You have blocked this resident. Please unblock them first to send messages.",
          400,
          "BLOCKED_BY_SELF",
        );
      }

      const isBlockedByOther = conversation.blockedBy.some((b) => b.toString() !== userId);
      if (isBlockedByOther) {
        throw new AppError(
          "You cannot send messages to this resident because they have blocked direct communication with you.",
          403,
          "BLOCKED_BY_RECIPIENT",
        );
      }
    }

    const sender = await User.findById(userId);

    const message = await Message.create({
      conversationId,
      senderId: userId,
      text: text.trim(),
      tag: tag || "GENERAL",
      readBy: [userId],
    });

    conversation.lastMessage = {
      text: text.trim(),
      senderName: sender?.fullName || "User",
      sentAt: new Date(),
    };
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      "senderId",
      "fullName email role roomNumber block avatarUrl",
    );

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleBlockDirectChat(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user!.userId;

    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "fullName email role roomNumber block",
    );
    if (!conversation) throw new AppError("Conversation not found", 404, "NOT_FOUND");

    if (conversation.type !== "DIRECT") {
      throw new AppError("Only 1-on-1 direct conversations support resident blocking", 400, "INVALID_CHAT_TYPE");
    }

    conversation.blockedBy = conversation.blockedBy || [];
    const isCurrentlyBlocked = conversation.blockedBy.some((id) => id.toString() === currentUserId);

    if (isCurrentlyBlocked) {
      // Unblock
      conversation.blockedBy = conversation.blockedBy.filter(
        (id) => id.toString() !== currentUserId,
      ) as any;
    } else {
      // Block
      conversation.blockedBy.push(currentUserId as any);
    }

    await conversation.save();

    res.json({
      success: true,
      message: isCurrentlyBlocked ? "Resident unblocked successfully" : "Resident blocked successfully",
      data: {
        conversationId: conversation._id,
        isBlocked: !isCurrentlyBlocked,
        blockedBy: conversation.blockedBy,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function startDirectChat(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (!targetUserId) throw new AppError("Target user ID is required", 400, "VALIDATION_ERROR");
    if (targetUserId === currentUserId) throw new AppError("Cannot chat with yourself", 400, "INVALID_TARGET");

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new AppError("Target user not found", 404, "NOT_FOUND");

    // Mess Coordinator DM Scope Check:
    if (
      currentUserRole === "MESS_COORDINATOR" &&
      !ALLOWED_MESS_COORDINATOR_DM_ROLES.includes(targetUser.role)
    ) {
      throw new AppError(
        "Permission Denied: Mess Coordinator can only direct message Student Representatives, Wardens, and Supervisors.",
        403,
        "FORBIDDEN_TARGET",
      );
    }

    let chat = await Conversation.findOne({
      type: "DIRECT",
      participants: { $all: [currentUserId, targetUserId] },
    }).populate("participants", "fullName email role roomNumber block avatarUrl");

    if (!chat) {
      chat = await Conversation.create({
        type: "DIRECT",
        name: targetUser.fullName,
        participants: [currentUserId, targetUserId],
        lastMessage: {
          text: "Started conversation",
          senderName: "System",
          sentAt: new Date(),
        },
      });

      chat = await Conversation.findById(chat._id).populate(
        "participants",
        "fullName email role roomNumber block avatarUrl",
      );
    }

    res.json({
      success: true,
      message: "Direct conversation ready",
      data: chat,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
