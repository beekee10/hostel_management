import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  startDirectChat,
  toggleBlockDirectChat,
} from "./chat.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/conversations", getConversations);
router.post("/direct", startDirectChat);
router.post("/conversations/direct", startDirectChat);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.post("/conversations/:conversationId/block", toggleBlockDirectChat);

export default router;
