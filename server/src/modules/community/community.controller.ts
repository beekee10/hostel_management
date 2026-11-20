import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { HotTopic, TopicComment } from "./hot-topic.model.js";
import { LendItem, BorrowRequest } from "./lend-item.model.js";
import { ItemRequest } from "./item-request.model.js";
import { Conversation } from "../conversations/conversation.model.js";
import { User } from "../auth/user.model.js";
import { analyzeHotTopic } from "../ai/ai.service.js";
import { AppError } from "../../utils/appError.js";

// =======================
// REDDIT-STYLE HOT TOPICS
// =======================

export async function listTopics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { tag, sort } = req.query;
    const query: any = {};
    if (tag) query.tags = tag;

    let sortOption: any = { isPinned: -1, heatScore: -1, createdAt: -1 };
    if (sort === "new") sortOption = { isPinned: -1, createdAt: -1 };
    if (sort === "top") sortOption = { isPinned: -1, "upvotes.length": -1, createdAt: -1 };

    const topics = await HotTopic.find(query)
      .populate("authorId", "fullName email role roomNumber block")
      .sort(sortOption)
      .limit(50);

    res.json({
      success: true,
      message: "Hot topics fetched successfully",
      data: topics,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDailyTopicQuota(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await HotTopic.countDocuments({
      authorId: req.user!.userId,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    res.json({
      success: true,
      message: "Daily topic quota checked",
      data: {
        limit: 2,
        used: count,
        remaining: Math.max(0, 2 - count),
        canPost: count < 2,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      throw new AppError("Title and discussion content are required", 400, "VALIDATION_ERROR");
    }

    // Rate Limiting: Max 2 topics per user per 24 hours (Warden and Admin exempt)
    if (req.user?.role === "STUDENT" || req.user?.role === "STUDENT_COORDINATOR") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await HotTopic.countDocuments({
        authorId: req.user!.userId,
        createdAt: { $gte: twentyFourHoursAgo },
      });

      if (recentCount >= 2) {
        throw new AppError(
          "Daily limit reached: You can only post a maximum of 2 topics per 24 hours to keep discussions focused and spam-free.",
          429,
          "DAILY_TOPIC_LIMIT_REACHED",
        );
      }
    }

    const initialTags = Array.isArray(tags) ? tags : [];

    let aiAnalysis: {
      heatScore: number;
      cardSize: "sm" | "md" | "lg" | "xl";
      tags: string[];
      sentiment: "POSITIVE" | "NEUTRAL" | "CONCERN" | "CRITICAL";
      summary: string;
    } = {
      heatScore: 35,
      cardSize: "sm",
      tags: initialTags.length > 0 ? initialTags : ["Discussion", "Campus"],
      sentiment: "NEUTRAL",
      summary: title,
    };

    try {
      const aiResult = await analyzeHotTopic({
        title,
        content,
        commentCount: 0,
        upvotesCount: 0,
      });
      aiAnalysis = {
        heatScore: aiResult.heatScore,
        cardSize: aiResult.cardSize,
        tags: Array.from(new Set([...initialTags, ...(aiResult.tags || [])])).slice(0, 4),
        sentiment: aiResult.sentiment,
        summary: aiResult.summary,
      };
    } catch {
      // Fallback
    }

    const topic = await HotTopic.create({
      title,
      content,
      authorId: req.user!.userId,
      tags: aiAnalysis.tags,
      heatScore: aiAnalysis.heatScore,
      cardSize: aiAnalysis.cardSize,
      sentiment: aiAnalysis.sentiment,
      aiSummary: aiAnalysis.summary,
      upvotes: [req.user!.userId],
      commentCount: 0,
    });

    const populated = await HotTopic.findById(topic._id).populate(
      "authorId",
      "fullName email role roomNumber block avatarUrl",
    );

    res.status(201).json({
      success: true,
      message: "Hot topic published successfully",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const topic = await HotTopic.findById(id);
    if (!topic) throw new AppError("Topic not found", 404, "NOT_FOUND");

    const isCreator = topic.authorId.toString() === currentUserId;
    const isAdmin = currentUserRole === "ADMIN";

    if (!isCreator && !isAdmin) {
      throw new AppError(
        "Permission Denied: Hot topics can only be deleted by their creator.",
        403,
        "FORBIDDEN",
      );
    }

    await HotTopic.findByIdAndDelete(id);
    await TopicComment.deleteMany({ topicId: id });

    res.json({
      success: true,
      message: "Hot topic deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function voteTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const topic = await HotTopic.findById(id);
    if (!topic) throw new AppError("Topic not found", 404, "NOT_FOUND");

    const hasVoted = topic.upvotes.some((u) => u.toString() === userId);
    if (hasVoted) {
      topic.upvotes = topic.upvotes.filter((u) => u.toString() !== userId) as any;
    } else {
      topic.upvotes.push(userId as any);
    }

    const upvotesCount = topic.upvotes.length;
    const commentsCount = topic.commentCount || 0;
    const calculatedHeat = Math.min(100, Math.max(10, upvotesCount * 4 + commentsCount * 6 + 15));
    topic.heatScore = calculatedHeat;

    if (calculatedHeat >= 75) topic.cardSize = "xl";
    else if (calculatedHeat >= 50) topic.cardSize = "lg";
    else if (calculatedHeat >= 30) topic.cardSize = "md";
    else topic.cardSize = "sm";

    await topic.save();

    const populated = await HotTopic.findById(id).populate(
      "authorId",
      "fullName email role roomNumber block",
    );

    res.json({
      success: true,
      message: hasVoted ? "Vote removed" : "Upvoted topic",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getTopicComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const comments = await TopicComment.find({ topicId: id })
      .populate("authorId", "fullName email role roomNumber block")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      message: "Topic comments fetched",
      data: comments,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function addTopicComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      throw new AppError("Comment text is required", 400, "VALIDATION_ERROR");
    }

    const topic = await HotTopic.findById(id);
    if (!topic) throw new AppError("Topic not found", 404, "NOT_FOUND");

    const comment = await TopicComment.create({
      topicId: id,
      authorId: req.user!.userId,
      content,
      upvotes: [],
    });

    topic.commentCount = (topic.commentCount || 0) + 1;
    const upvotesCount = topic.upvotes.length;
    const calculatedHeat = Math.min(
      100,
      Math.max(10, upvotesCount * 4 + topic.commentCount * 6 + 15),
    );
    topic.heatScore = calculatedHeat;

    if (calculatedHeat >= 75) topic.cardSize = "xl";
    else if (calculatedHeat >= 50) topic.cardSize = "lg";
    else if (calculatedHeat >= 30) topic.cardSize = "md";
    else topic.cardSize = "sm";

    await topic.save();

    const populatedComment = await TopicComment.findById(comment._id).populate(
      "authorId",
      "fullName email role roomNumber block",
    );

    res.status(201).json({
      success: true,
      message: "Comment posted",
      data: populatedComment,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// ITEM REQUESTS & "I HAVE IT!" GIVER MODULE
// ============================================

export async function listItemRequests(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Auto-seed sample item requests if empty
    const count = await ItemRequest.countDocuments();
    if (count === 0) {
      const alex = await User.findOne({ email: "student@campus.in" });
      const rep = await User.findOne({ email: "representative@campus.in" });

      if (alex) {
        await ItemRequest.create([
          {
            requesterId: alex._id,
            itemName: "Maggi 2-Pack (Spicy / Masala)",
            category: "FOOD_SNACKS",
            description: "Craving late night Maggi during midterm prep! Block A, Room 204. Can pay cash or UPI immediately.",
            urgency: "LATE_NIGHT",
            status: "OPEN",
            offers: rep
              ? [
                  {
                    giverId: rep._id,
                    message: "I have 2 extra packets in Room 102 Block A! Come grab them.",
                    roomHint: "Block A · Room 102",
                    status: "PENDING",
                    offeredAt: new Date(),
                  },
                ]
              : [],
          },
          {
            requesterId: alex._id,
            itemName: "Scientific Calculator (Casio fx-991EX)",
            category: "STUDY_TOOLS",
            description: "Need for Tomorrow morning Engineering Physics exam (8:30 AM to 11:30 AM). Will return safely right after.",
            urgency: "URGENT",
            status: "OPEN",
            offers: [],
          },
        ]);
      }
    }

    const requests = await ItemRequest.find()
      .populate("requesterId", "fullName email role roomNumber block")
      .populate("offers.giverId", "fullName email role roomNumber block")
      .populate("acceptedGiverId", "fullName email role roomNumber block")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Item requests fetched",
      data: requests,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createItemRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { itemName, category, description, urgency } = req.body;
    const userId = req.user!.userId;

    if (!itemName || !itemName.trim()) {
      throw new AppError("Item name is required (e.g. Maggi, Calculator, Iron)", 400, "VALIDATION_ERROR");
    }

    const request = await ItemRequest.create({
      requesterId: userId,
      itemName: itemName.trim(),
      category: category || "FOOD_SNACKS",
      description: description?.trim() || "",
      urgency: urgency || "LATE_NIGHT",
      status: "OPEN",
      offers: [],
    });

    const populated = await ItemRequest.findById(request._id).populate(
      "requesterId",
      "fullName email role roomNumber block",
    );

    res.status(201).json({
      success: true,
      message: "Item request broadcasted to hostel community",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function offerHelpForItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { message, roomHint } = req.body;
    const giverId = req.user!.userId;

    const request = await ItemRequest.findById(id);
    if (!request) throw new AppError("Item request not found", 404, "NOT_FOUND");

    if (request.requesterId.toString() === giverId) {
      throw new AppError("You cannot offer an item to your own request", 400, "SELF_OFFER");
    }

    const alreadyOffered = request.offers.some((o) => o.giverId.toString() === giverId && o.status === "PENDING");
    if (alreadyOffered) {
      throw new AppError("You have already sent an offer for this item", 400, "DUPLICATE_OFFER");
    }

    const giver = await User.findById(giverId);

    request.offers.push({
      giverId: giverId as any,
      message: message?.trim() || "I have this item! You can collect it from me.",
      roomHint: roomHint || `${giver?.block || "Block A"} · ${giver?.roomNumber || "Main"}`,
      status: "PENDING",
      offeredAt: new Date(),
    });

    if (request.status === "OPEN") {
      request.status = "OFFER_RECEIVED";
    }

    await request.save();

    const populated = await ItemRequest.findById(id)
      .populate("requesterId", "fullName email role roomNumber block")
      .populate("offers.giverId", "fullName email role roomNumber block");

    res.json({
      success: true,
      message: "Offer sent to requester! They can now accept & chat with you or ignore.",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function respondToItemOffer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id, offerId } = req.params;
    const { action } = req.body; // "ACCEPT" | "IGNORE"
    const userId = req.user!.userId;

    const request = await ItemRequest.findById(id);
    if (!request) throw new AppError("Item request not found", 404, "NOT_FOUND");

    if (request.requesterId.toString() !== userId) {
      throw new AppError("Only the original requester can accept or ignore offers", 403, "FORBIDDEN");
    }

    const offer = (request.offers as any).id(offerId);
    if (!offer) throw new AppError("Offer not found", 404, "OFFER_NOT_FOUND");

    let directChatId: string | null = null;

    if (action === "ACCEPT") {
      offer.status = "ACCEPTED";
      request.status = "ACCEPTED";
      request.acceptedOfferId = offer._id;
      request.acceptedGiverId = offer.giverId;

      // Mark other pending offers as IGNORED
      request.offers.forEach((o) => {
        if (o._id.toString() !== offerId && o.status === "PENDING") {
          o.status = "IGNORED";
        }
      });

      // Automatically create or fetch 1-on-1 direct conversation with the giver
      const giverId = offer.giverId.toString();
      const giver = await User.findById(giverId);

      let chat = await Conversation.findOne({
        type: "DIRECT",
        participants: { $all: [userId, giverId] },
      });

      if (!chat) {
        chat = await Conversation.create({
          type: "DIRECT",
          name: giver?.fullName || "Resident",
          participants: [userId, giverId],
          lastMessage: {
            text: `Accepted your offer for: ${request.itemName}! 👋`,
            senderName: "Requester",
            sentAt: new Date(),
          },
        });
      }
      directChatId = chat._id.toString();
    } else if (action === "IGNORE") {
      offer.status = "IGNORED";

      const hasOtherPending = request.offers.some((o) => o.status === "PENDING");
      if (!hasOtherPending && request.status === "OFFER_RECEIVED") {
        request.status = "OPEN";
      }
    } else {
      throw new AppError("Invalid action. Must be 'ACCEPT' or 'IGNORE'", 400, "INVALID_ACTION");
    }

    await request.save();

    const populated = await ItemRequest.findById(id)
      .populate("requesterId", "fullName email role roomNumber block")
      .populate("offers.giverId", "fullName email role roomNumber block")
      .populate("acceptedGiverId", "fullName email role roomNumber block");

    res.json({
      success: true,
      message: action === "ACCEPT" ? "Offer accepted! You can now chat with the giver." : "Offer ignored.",
      data: {
        request: populated,
        directChatId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// =======================
// LEND & BORROW MODULE
// =======================

export async function listItems(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const items = await LendItem.find()
      .populate("ownerId", "fullName email roomNumber block")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Lend & borrow items fetched",
      data: items,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, category, locationHint } = req.body;
    if (!title) throw new AppError("Item title is required", 400, "VALIDATION_ERROR");

    const item = await LendItem.create({
      title,
      description: description || "",
      category: category || "OTHER",
      locationHint: locationHint || "",
      ownerId: req.user!.userId,
      status: "AVAILABLE",
    });

    const populated = await LendItem.findById(item._id).populate(
      "ownerId",
      "fullName email roomNumber block avatarUrl",
    );

    res.status(201).json({
      success: true,
      message: "Item listed for sharing",
      data: populated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteLendItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const item = await LendItem.findById(id);
    if (!item) throw new AppError("Lend item not found", 404, "NOT_FOUND");

    const isOwner = item.ownerId.toString() === currentUserId;
    const isModerator =
      currentUserRole === "STUDENT_COORDINATOR" ||
      currentUserRole === "WARDEN" ||
      currentUserRole === "ADMIN";

    if (!isOwner && !isModerator) {
      throw new AppError(
        "Permission Denied: Only the person lending this item (or Student Representative, Warden, Admin) can delete it.",
        403,
        "FORBIDDEN",
      );
    }

    await LendItem.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Shared lend item deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

