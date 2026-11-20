import { Router } from "express";
import {
  listTopics,
  createTopic,
  deleteTopic,
  voteTopic,
  getTopicComments,
  addTopicComment,
  getDailyTopicQuota,
  listItems,
  createItem,
  deleteLendItem,
  listItemRequests,
  createItemRequest,
  offerHelpForItem,
  respondToItemOffer,
} from "./community.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Hot Topics
router.get("/topics", listTopics);
router.get("/topics/quota", getDailyTopicQuota);
router.post("/topics", createTopic);
router.delete("/topics/:id", deleteTopic);
router.post("/topics/:id/vote", voteTopic);
router.get("/topics/:id/comments", getTopicComments);
router.post("/topics/:id/comments", addTopicComment);

// Lend & Borrow
router.get("/items", listItems);
router.post("/items", createItem);
router.delete("/items/:id", deleteLendItem);

// Item Requests ("Ask for Maggi" / "I have it!" / Accept or Ignore)
router.get("/item-requests", listItemRequests);
router.post("/item-requests", createItemRequest);
router.post("/item-requests/:id/offer", offerHelpForItem);
router.post("/item-requests/:id/offers/:offerId/respond", respondToItemOffer);

export default router;
