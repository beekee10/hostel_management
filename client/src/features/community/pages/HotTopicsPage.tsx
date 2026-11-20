import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { HotTopic, TopicComment, LendItem, ItemRequest } from "../../../types";
import {
  Flame,
  Sparkles,
  MessageSquare,
  ArrowBigUp,
  Plus,
  Share2,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Pin,
  X,
  Send,
  User as UserIcon,
  UtensilsCrossed,
  HandHeart,
  MessageCircle,
  ThumbsDown,
  AlertCircle,
  Moon,
  Zap,
  Trash2,
} from "lucide-react";

export function HotTopicsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"TOPICS" | "REQUESTS" | "LEND">("TOPICS");
  const [topics, setTopics] = useState<HotTopic[]>([]);
  const [quota, setQuota] = useState<{ limit: number; used: number; remaining: number; canPost: boolean }>({
    limit: 2,
    used: 0,
    remaining: 2,
    canPost: true,
  });
  const [loading, setLoading] = useState(true);

  // New Topic Modal
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");
  const [topicTags, setTopicTags] = useState("Discussion, Hostel");
  const [submittingTopic, setSubmittingTopic] = useState(false);

  // Comment Thread Drawer
  const [activeTopic, setActiveTopic] = useState<HotTopic | null>(null);
  const [comments, setComments] = useState<TopicComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Item Requests ("Ask for Maggi" / Peer Help)
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [reqItemName, setReqItemName] = useState("");
  const [reqCategory, setReqCategory] = useState<any>("FOOD_SNACKS");
  const [reqDescription, setReqDescription] = useState("");
  const [reqUrgency, setReqUrgency] = useState<any>("LATE_NIGHT");
  const [submittingItemRequest, setSubmittingItemRequest] = useState(false);

  // "I have it! 👋" Giver Modal
  const [offerTargetRequest, setOfferTargetRequest] = useState<ItemRequest | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [offerRoomHint, setOfferRoomHint] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Lend & Borrow
  const [lendItems, setLendItems] = useState<LendItem[]>([]);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemCategory, setItemCategory] = useState<any>("CYCLE");
  const [itemLocation, setItemLocation] = useState("");
  const [submittingItem, setSubmittingItem] = useState(false);

  const currentUserId = user?.id || (user as any)?._id;

  useEffect(() => {
    fetchTopicsAndQuota();
    fetchItemRequests();
    fetchLendItems();
  }, []);

  async function fetchTopicsAndQuota() {
    try {
      setLoading(true);
      const [topicsRes, quotaRes] = await Promise.allSettled([
        api.get("/community/topics"),
        api.get("/community/topics/quota"),
      ]);

      if (topicsRes.status === "fulfilled" && topicsRes.value.data?.data) {
        setTopics(topicsRes.value.data.data);
      }
      if (quotaRes.status === "fulfilled" && quotaRes.value.data?.data) {
        setQuota(quotaRes.value.data.data);
      }
    } catch (err) {
      console.error("Fetch topics error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchItemRequests() {
    try {
      const res = await api.get("/community/item-requests");
      if (res.data?.data) {
        setItemRequests(res.data.data);
      }
    } catch (err) {
      console.error("Fetch item requests error:", err);
    }
  }

  async function fetchLendItems() {
    try {
      const res = await api.get("/community/items");
      if (res.data?.data) {
        setLendItems(res.data.data);
      }
    } catch (err) {
      console.error("Fetch items error:", err);
    }
  }

  async function handleVote(topicId: string) {
    try {
      const res = await api.post(`/community/topics/${topicId}/vote`);
      if (res.data?.data) {
        const updated = res.data.data;
        setTopics((prev) => prev.map((t) => (t._id === topicId ? updated : t)));
      }
    } catch (err: any) {
      console.error("Vote failed:", err);
    }
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingTopic(true);
    try {
      const tagsArray = topicTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.post("/community/topics", {
        title: topicTitle,
        content: topicContent,
        tags: tagsArray,
      });

      if (res.data?.data) {
        setTopics((prev) => [res.data.data, ...prev]);
        setIsNewTopicOpen(false);
        setTopicTitle("");
        setTopicContent("");
        fetchTopicsAndQuota();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to publish topic");
    } finally {
      setSubmittingTopic(false);
    }
  }

  // Handle Delete Topic (Creator only)
  async function handleDeleteTopic(topicId: string, topicTitle: string) {
    if (!confirm(`Are you sure you want to delete your hot topic: "${topicTitle}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/community/topics/${topicId}`);
      setTopics((prev) => prev.filter((t) => t._id !== topicId));
      if (activeTopic?._id === topicId) {
        setActiveTopic(null);
      }
      fetchTopicsAndQuota();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete topic");
    }
  }

  async function openComments(topic: HotTopic) {
    setActiveTopic(topic);
    setLoadingComments(true);
    try {
      const res = await api.get(`/community/topics/${topic._id}/comments`);
      if (res.data?.data) {
        setComments(res.data.data);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTopic || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/community/topics/${activeTopic._id}/comments`, {
        content: commentText.trim(),
      });

      if (res.data?.data) {
        setComments((prev) => [...prev, res.data.data]);
        setCommentText("");
        setTopics((prev) =>
          prev.map((t) =>
            t._id === activeTopic._id ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t,
          ),
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  // Handle Item Request (Ask for Maggi / Item)
  async function handleCreateItemRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingItemRequest(true);
    try {
      const res = await api.post("/community/item-requests", {
        itemName: reqItemName,
        category: reqCategory,
        description: reqDescription,
        urgency: reqUrgency,
      });

      if (res.data?.data) {
        setItemRequests((prev) => [res.data.data, ...prev]);
        setIsNewRequestModalOpen(false);
        setReqItemName("");
        setReqDescription("");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post item request");
    } finally {
      setSubmittingItemRequest(false);
    }
  }

  // Handle Giver "I have it! 👋"
  const openOfferModal = (req: ItemRequest) => {
    setOfferTargetRequest(req);
    setOfferMessage(`I have ${req.itemName}! You can collect it from my room.`);
    setOfferRoomHint(`${user?.block || "Block A"} · ${user?.roomNumber || "Room 101"}`);
  };

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerTargetRequest) return;

    setSubmittingOffer(true);
    try {
      const res = await api.post(`/community/item-requests/${offerTargetRequest._id}/offer`, {
        message: offerMessage,
        roomHint: offerRoomHint,
      });

      if (res.data?.data) {
        const updated = res.data.data;
        setItemRequests((prev) =>
          prev.map((r) => (r._id === offerTargetRequest._id ? updated : r)),
        );
        setOfferTargetRequest(null);
        alert("Offer submitted! The requester will see your offer and can accept & chat with you.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send offer");
    } finally {
      setSubmittingOffer(false);
    }
  }

  // Handle Requester Response (Accept & Chat or Ignore)
  async function handleRespondToOffer(requestId: string, offerId: string, action: "ACCEPT" | "IGNORE") {
    try {
      const res = await api.post(`/community/item-requests/${requestId}/offers/${offerId}/respond`, {
        action,
      });

      if (res.data?.data) {
        const { request: updatedRequest, directChatId } = res.data.data;
        setItemRequests((prev) =>
          prev.map((r) => (r._id === requestId ? updatedRequest : r)),
        );

        if (action === "ACCEPT") {
          navigate("/chat", {
            state: {
              directConversationId: directChatId,
              initialMessage: "Hi! Thank you for offering to help with this item. When and where can I collect it?",
            },
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to respond to offer");
    }
  }

  // Handle Chat To Borrow Item Lender
  async function handleChatToBorrow(item: LendItem) {
    const ownerId = item.ownerId?._id || item.ownerId?.id || (item.ownerId as any);
    if (!ownerId) return;

    if (ownerId === currentUserId) {
      alert("You are the owner of this shared item.");
      return;
    }

    try {
      const res = await api.post("/chat/conversations/direct", {
        targetUserId: ownerId,
      });
      if (res.data?.data) {
        const conv = res.data.data;
        navigate("/chat", {
          state: {
            directConversationId: conv._id,
            initialMessage: `Hi ${item.ownerId?.fullName || "there"}! I'm interested in borrowing your "${item.title}". Is it currently available?`,
          },
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start direct chat with lender");
    }
  }

  // Handle Create Lend Item
  async function handleCreateLendItem(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingItem(true);
    try {
      const res = await api.post("/community/items", {
        title: itemTitle,
        description: itemDesc,
        category: itemCategory,
        locationHint: itemLocation,
      });

      if (res.data?.data) {
        setLendItems((prev) => [res.data.data, ...prev]);
        setIsNewItemOpen(false);
        setItemTitle("");
        setItemDesc("");
        setItemLocation("");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to list item");
    } finally {
      setSubmittingItem(false);
    }
  }

  // Handle Delete Lend Item (Owner or Moderator)
  async function handleDeleteLendItem(itemId: string, itemTitle: string) {
    if (!confirm(`Are you sure you want to remove your shared item: "${itemTitle}"?`)) return;

    try {
      await api.delete(`/community/items/${itemId}`);
      setLendItems((prev) => prev.filter((it) => it._id !== itemId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete shared item");
    }
  }

  const getBentoSpan = (cardSize?: string) => {
    switch (cardSize) {
      case "xl":
        return "col-span-1 md:col-span-2 lg:col-span-3 border-yellow-500/60 bg-linear-to-br from-yellow-500/5 via-transparent to-transparent";
      case "lg":
        return "col-span-1 md:col-span-2 border-yellow-500/40";
      case "md":
        return "col-span-1 border-zinc-200 dark:border-zinc-800";
      default:
        return "col-span-1 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getSentimentBadge = (s?: string) => {
    switch (s) {
      case "POSITIVE":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "CONCERN":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30";
    }
  };

  const getItemCategoryEmoji = (c?: string) => {
    switch (c) {
      case "FOOD_SNACKS":
        return "🍜 Food & Snacks";
      case "STUDY_TOOLS":
        return "📚 Study Tools";
      case "ELECTRONICS":
        return "🔌 Electronics";
      case "MEDICINE":
        return "💊 Medicine";
      case "DAILY_ESSENTIALS":
        return "🧴 Daily Essentials";
      default:
        return "📦 Other";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="drizzle-badge drizzle-badge-yellow">
              <Flame size={12} /> COMMUNITY & PEER SHARING
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Hostel Hot Topics & Peer Item Requests
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Reddit-style Bento feed, instant "Ask for Maggi / Items" with giver offers, and community sharing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-1 text-xs">
            <button
              onClick={() => setActiveTab("TOPICS")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === "TOPICS"
                  ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              🔥 Hot Topics
            </button>
            <button
              onClick={() => setActiveTab("REQUESTS")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === "REQUESTS"
                  ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              🍜 Ask for Items (Maggi)
            </button>
            <button
              onClick={() => setActiveTab("LEND")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === "LEND"
                  ? "bg-yellow-400 text-zinc-950 shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              📦 Lend & Borrow
            </button>
          </div>

          {activeTab === "TOPICS" && (
            <button
              onClick={() => setIsNewTopicOpen(true)}
              disabled={!quota.canPost && user?.role === "STUDENT"}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer ${
                quota.canPost || user?.role !== "STUDENT"
                  ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-300 shadow-yellow-400/20"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
              }`}
            >
              <Plus size={16} />
              <span>Create Topic</span>
            </button>
          )}

          {activeTab === "REQUESTS" && (
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Ask for Item / Maggi</span>
            </button>
          )}

          {activeTab === "LEND" && (
            <button
              onClick={() => setIsNewItemOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Share Item</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HOT TOPICS FEED */}
      {activeTab === "TOPICS" && (
        <>
          {/* Daily Quota Counter Banner */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-[#111216]/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-mono font-bold text-sm">
                {quota.used}/{quota.limit}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Your Daily Topic Quota: {quota.used} of {quota.limit} topics posted in last 24h
                </p>
                <p className="text-[11px] text-zinc-500">
                  {quota.canPost
                    ? `You can publish ${quota.remaining} more topic today.`
                    : "Daily limit reached. Upvote & join active discussions below!"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-zinc-400">
                Heat Algorithm:
              </span>
              <span className="drizzle-badge drizzle-badge-yellow text-[10px]">
                <Sparkles size={11} /> Gemini Dynamic Bento
              </span>
            </div>
          </div>

          {/* Bento Grid Feed */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="drizzle-card p-6 h-56 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="drizzle-card p-12 text-center">
              <Flame size={32} className="mx-auto text-orange-500 mb-2" />
              <h3 className="text-base font-bold">No hot topics yet</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Be the first resident to start a discussion today!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
              {topics.map((topic) => {
                const hasVoted = topic.upvotes?.includes(currentUserId);
                const isXL = topic.cardSize === "xl";
                const isLG = topic.cardSize === "lg";

                const isMyTopic =
                  (topic.authorId as any)?._id === currentUserId ||
                  topic.authorId?.id === currentUserId ||
                  (topic.authorId as any) === currentUserId;
                const canDeleteTopic = isMyTopic || user?.role === "ADMIN";

                return (
                  <motion.div
                    key={topic._id}
                    layout
                    className={`drizzle-card p-5 sm:p-6 flex flex-col justify-between transition-all ${getBentoSpan(
                      topic.cardSize,
                    )} ${isMyTopic ? "border-yellow-500/30" : ""}`}
                  >
                    <div>
                      {/* Top Topic Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {topic.isPinned && (
                            <span className="flex items-center gap-1 rounded-md bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 font-mono text-[10px] font-bold">
                              <Pin size={10} /> PINNED
                            </span>
                          )}
                          {isMyTopic && (
                            <span className="flex items-center gap-1 rounded-md bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 font-mono text-[10px] font-bold">
                              YOUR TOPIC
                            </span>
                          )}
                          <span className={`border px-2 py-0.5 rounded-md font-mono text-[10px] uppercase ${getSentimentBadge(topic.sentiment)}`}>
                            {topic.sentiment}
                          </span>
                          <span className="font-mono text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Flame size={11} /> HEAT: {topic.heatScore}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-zinc-400">
                            {new Date(topic.createdAt).toLocaleDateString()}
                          </span>
                          {canDeleteTopic && (
                            <button
                              onClick={() => handleDeleteTopic(topic._id, topic.title)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete your topic"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => openComments(topic)}
                        className={`font-bold text-zinc-900 dark:text-zinc-100 hover:text-yellow-500 transition-colors cursor-pointer ${
                          isXL ? "text-lg sm:text-xl leading-snug" : isLG ? "text-base sm:text-lg" : "text-sm"
                        }`}
                      >
                        {topic.title}
                      </h3>

                      {/* Content */}
                      <p
                        className={`text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed whitespace-pre-line ${
                          isXL ? "line-clamp-6" : isLG ? "line-clamp-4" : "line-clamp-3"
                        }`}
                      >
                        {topic.content}
                      </p>

                      {/* Gemini AI 1-sentence recap */}
                      {topic.aiSummary && (
                        <div className="mt-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-2.5 text-[11px] text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                          <Sparkles size={13} className="shrink-0 mt-0.5 text-yellow-500" />
                          <span>
                            <strong>AI Recap:</strong> {topic.aiSummary}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {topic.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {topic.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: Upvote & Open Comments */}
                    <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                        <UserIcon size={13} />
                        <span>{topic.authorId?.fullName || "Student"}</span>
                        <span>({topic.authorId?.block || "Campus"})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Upvote Button with Framer Motion Bounce */}
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleVote(topic._id)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                            hasVoted
                              ? "border-yellow-400 bg-yellow-400 text-zinc-950 shadow-xs shadow-yellow-400/20"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-yellow-400/50 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#18191f]"
                          }`}
                        >
                          <ArrowBigUp size={16} className={hasVoted ? "fill-zinc-950" : ""} />
                          <span>{topic.upvotes?.length || 0}</span>
                        </motion.button>

                        {/* Comment Button */}
                        <button
                          onClick={() => openComments(topic)}
                          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-300 hover:border-yellow-400/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <MessageSquare size={14} />
                          <span>{topic.commentCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: ITEM REQUESTS & "I HAVE IT!" GIVER FEED */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold">
                🍜
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Late-Night & Urgent Item Sharing (Maggi, Chargers, Medicine, Tools)
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  Ask hostel mates for anything. Givers click <strong>"I have it! 👋"</strong> and requesters can <strong>Accept & Chat</strong> or <strong>Ignore</strong>.
                </p>
              </div>
            </div>
          </div>

          {itemRequests.length === 0 ? (
            <div className="drizzle-card p-12 text-center">
              <UtensilsCrossed size={32} className="mx-auto text-yellow-500 mb-2 opacity-60" />
              <h3 className="text-base font-bold">No active item requests</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Need Maggi, a calculator, or an iron? Click "Ask for Item / Maggi" above to broadcast!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemRequests.map((req) => {
                const isMyRequest =
                  (req.requesterId as any)?._id === currentUserId ||
                  req.requesterId?.id === currentUserId ||
                  (req.requesterId as any) === currentUserId;

                const hasOffered = req.offers?.some(
                  (o) => (o.giverId as any)?._id === currentUserId || (o.giverId as any) === currentUserId,
                );

                const isAccepted = req.status === "ACCEPTED";

                return (
                  <div
                    key={req._id}
                    className={`drizzle-card p-5 flex flex-col justify-between ${
                      isAccepted
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="drizzle-badge drizzle-badge-yellow text-[10px]">
                            {getItemCategoryEmoji(req.category)}
                          </span>
                          {req.urgency === "LATE_NIGHT" && (
                            <span className="flex items-center gap-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-2 py-0.5 font-mono text-[10px] font-bold">
                              <Moon size={10} /> Late Night Craving
                            </span>
                          )}
                          {req.urgency === "URGENT" && (
                            <span className="flex items-center gap-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2 py-0.5 font-mono text-[10px] font-bold">
                              <Zap size={10} /> Urgent
                            </span>
                          )}
                        </div>

                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isAccepted
                              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                              : req.status === "OFFER_RECEIVED"
                              ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {req.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Item Name & Details */}
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {req.itemName}
                      </h3>
                      {req.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
                          {req.description}
                        </p>
                      )}

                      {/* Requester Info */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>
                          Requested by: <strong>{req.requesterId?.fullName || "Resident"}</strong> ({req.requesterId?.block || "Block A"} · {req.requesterId?.roomNumber || "Main"})
                        </span>
                        <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* Incoming Giver Offers (Viewable by Requester) */}
                      {isMyRequest && req.offers?.length > 0 && (
                        <div className="mt-3.5 space-y-2 rounded-xl bg-zinc-50 dark:bg-[#18191f] p-3 border border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            Incoming Offers from Givers ({req.offers.length}):
                          </span>

                          {req.offers.map((offer) => (
                            <div
                              key={offer._id}
                              className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                offer.status === "ACCEPTED"
                                  ? "border-emerald-500/40 bg-emerald-500/10"
                                  : offer.status === "IGNORED"
                                  ? "border-zinc-800 opacity-40 bg-zinc-900"
                                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#111216]"
                              }`}
                            >
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                  {offer.giverId?.fullName || "A Resident"} ({offer.roomHint || "Hostel"})
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">"{offer.message}"</p>
                              </div>

                              {offer.status === "PENDING" && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleRespondToOffer(req._id, offer._id, "ACCEPT")}
                                    className="rounded-lg bg-yellow-400 px-2.5 py-1 text-[11px] font-bold text-zinc-950 hover:bg-yellow-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <MessageCircle size={12} /> Accept & Chat
                                  </button>
                                  <button
                                    onClick={() => handleRespondToOffer(req._id, offer._id, "IGNORE")}
                                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    Ignore
                                  </button>
                                </div>
                              )}

                              {offer.status === "ACCEPTED" && (
                                <span className="font-mono text-[10px] font-bold text-emerald-500">
                                  ✓ Accepted
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button for Givers */}
                    {!isMyRequest && !isAccepted && (
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                        {hasOffered ? (
                          <div className="flex items-center justify-between text-xs text-emerald-500 font-mono">
                            <span>✓ You offered help! Waiting for response.</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openOfferModal(req)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300 transition-colors shadow-xs cursor-pointer"
                          >
                            <HandHeart size={15} />
                            <span>I have it! 👋 (Offer to Requester)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEND & BORROW CATALOG */}
      {activeTab === "LEND" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lendItems.length === 0 ? (
            <div className="drizzle-card p-12 text-center col-span-3">
              <Package size={32} className="mx-auto text-zinc-400 mb-2 opacity-50" />
              <h3 className="text-base font-bold">No shared items cataloged yet</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Share a bicycle, calculator, kettle, or iron for fellow residents!
              </p>
            </div>
          ) : (
            lendItems.map((item) => {
              const ownerId =
                (item.ownerId as any)?._id ||
                item.ownerId?.id ||
                (item.ownerId as any);

              const isMyItem = ownerId === currentUserId;
              const isModerator =
                user?.role === "STUDENT_COORDINATOR" ||
                user?.role === "WARDEN" ||
                user?.role === "ADMIN";

              const canDelete = isMyItem || isModerator;

              return (
                <div
                  key={item._id}
                  className={`drizzle-card p-5 flex flex-col justify-between transition-all ${
                    isMyItem ? "border-yellow-500/40 bg-yellow-500/5 shadow-xs" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="drizzle-badge drizzle-badge-yellow text-[10px]">
                          {item.category}
                        </span>
                        {isMyItem ? (
                          <span className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-400/20 px-2 py-0.5 rounded">
                            YOUR ITEM
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            AVAILABLE
                          </span>
                        )}
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteLendItem(item._id, item.title)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete this shared item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    {item.locationHint && (
                      <p className="text-[11px] text-zinc-400 font-mono mt-2">
                        📍 Location: {item.locationHint}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Owner: {isMyItem ? "You (Lender)" : item.ownerId?.fullName || "Student"}</span>
                    {isMyItem ? (
                      <button
                        onClick={() => handleDeleteLendItem(item._id, item.title)}
                        className="text-rose-500 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        <Trash2 size={11} />
                        <span>Remove Item</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChatToBorrow(item)}
                        className="text-yellow-500 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Chat to Borrow</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal 1: Create Hot Topic */}
      {isNewTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsNewTopicOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Flame size={18} className="text-yellow-500" />
              Create Community Topic (Max 2/day)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gemini AI will score engagement velocity to dynamically scale your post's Bento size.
            </p>

            <form onSubmit={handleCreateTopic} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">TOPIC TITLE</label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Request for 24/7 Library access during exams"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">DISCUSSION DETAILS</label>
                <textarea
                  value={topicContent}
                  onChange={(e) => setTopicContent(e.target.value)}
                  rows={4}
                  placeholder="Share your thoughts, suggestions, or debate points..."
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={topicTags}
                  onChange={(e) => setTopicTags(e.target.value)}
                  placeholder="Discussion, Library, Midterms"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewTopicOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTopic}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submittingTopic ? "Publishing with AI..." : "Publish Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ask for Item / Maggi Modal */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsNewRequestModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              🍜 Ask for an Item (Maggi, Tools & Essentials)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Broadcast an instant request to fellow hostel residents.
            </p>

            <form onSubmit={handleCreateItemRequest} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">ITEM NEEDED</label>
                <input
                  type="text"
                  value={reqItemName}
                  onChange={(e) => setReqItemName(e.target.value)}
                  placeholder="e.g. Maggi 2-pack / Scientific Calculator / Iron"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">CATEGORY</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="FOOD_SNACKS">🍜 Food & Snacks</option>
                    <option value="STUDY_TOOLS">📚 Study Tools</option>
                    <option value="ELECTRONICS">🔌 Electronics</option>
                    <option value="MEDICINE">💊 Medicine</option>
                    <option value="DAILY_ESSENTIALS">🧴 Daily Essentials</option>
                    <option value="OTHER">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">URGENCY</label>
                  <select
                    value={reqUrgency}
                    onChange={(e) => setReqUrgency(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="LATE_NIGHT">🌙 Late Night Craving</option>
                    <option value="URGENT">⚡ Urgent (Exam/Need)</option>
                    <option value="CASUAL">☕ Casual Borrow</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">NOTE / REWARD / DETAILS</label>
                <textarea
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Studying for exam in Room 204. Can pay cash/UPI!"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItemRequest}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submittingItemRequest ? "Broadcasting..." : "Broadcast Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: "I have it! 👋" Giver Response Modal */}
      {offerTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setOfferTargetRequest(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <HandHeart size={18} className="text-yellow-500" />
              Offer Help: {offerTargetRequest.itemName}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Let {offerTargetRequest.requesterId?.fullName} know you have this item available.
            </p>

            <form onSubmit={handleSubmitOffer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">YOUR MESSAGE</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={2}
                  required
                  placeholder="e.g. I have 2 packets in Block B Room 304! Come collect them."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">YOUR ROOM / LOCATION</label>
                <input
                  type="text"
                  value={offerRoomHint}
                  onChange={(e) => setOfferRoomHint(e.target.value)}
                  placeholder="Block B · Room 304"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setOfferTargetRequest(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submittingOffer ? "Sending Offer..." : "Send 'I Have It!' Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Lend Item Modal */}
      {isNewItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsNewItemOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Package size={18} className="text-yellow-500" />
              List an Item for Sharing
            </h2>

            <form onSubmit={handleCreateLendItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">ITEM TITLE</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Hero Sprint Bicycle / Electric Kettle"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">CATEGORY</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                >
                  <option value="CYCLE">Bicycle</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="BOOK">Study Book / Notes</option>
                  <option value="FOOD">Food / Kettle</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">LOCATION / ROOM</label>
                <input
                  type="text"
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  placeholder="Block A Cycle Stand / Room 204"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewItemOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItem}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submittingItem ? "Listing..." : "Share Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Over Comment Drawer */}
      <AnimatePresence>
        {activeTopic && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTopic(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#111216] border-l border-zinc-200 dark:border-zinc-800 h-full p-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-yellow-500" />
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Community Discussion Thread
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {((activeTopic.authorId as any)?._id === currentUserId ||
                      activeTopic.authorId?.id === currentUserId ||
                      (activeTopic.authorId as any) === currentUserId ||
                      user?.role === "ADMIN") && (
                      <button
                        onClick={() => handleDeleteTopic(activeTopic._id, activeTopic.title)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Topic"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTopic(null)}
                      className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{activeTopic.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{activeTopic.content}</p>
                </div>

                {/* Comments Stream */}
                <div className="mt-5 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {loadingComments ? (
                    <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                      Loading comment thread...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      No comments yet. Join the conversation!
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c._id}
                        className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#18191f] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">
                            {c.authorId?.fullName || "Student"}
                          </span>
                          <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-200 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comment Input Box */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="rounded-xl bg-yellow-400 p-2.5 text-zinc-950 font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
