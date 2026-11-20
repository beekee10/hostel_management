import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import { socket } from "../../../lib/socket";
import { api } from "../../../lib/api";
import type { Conversation, Message, User } from "../../../types";
import {
  Hash,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  User as UserIcon,
  X,
  Menu,
  ChefHat,
  UtensilsCrossed,
} from "lucide-react";

export function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<{
    channels: Conversation[];
    directChats: Conversation[];
  }>({
    channels: [],
    directChats: [],
  });

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New Direct Message Modal
  const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Blocking state
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = user?.id || (user as any)?._id;

  useEffect(() => {
    fetchConversations();

    // Socket message listener
    socket.on("new-message", (newMsg: Message) => {
      if (activeConversation && newMsg.conversationId === activeConversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      socket.off("new-message");
    };
  }, [activeConversation?._id, user?.role, location.key]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await api.get("/chat/conversations");
      if (res.data?.data) {
        const fetchedChannels: Conversation[] = res.data.data.channels || [];
        const fetchedDirects: Conversation[] = res.data.data.directChats || [];

        setConversations({
          channels: fetchedChannels,
          directChats: fetchedDirects,
        });

        // 1. If routed with a specific direct conversation (e.g. from "Chat to Borrow" or "Accept & Chat")
        const targetConvId = (location.state as any)?.directConversationId;
        const initialMsg = (location.state as any)?.initialMessage;

        if (initialMsg) {
          setMessageInput(initialMsg);
        }

        if (targetConvId) {
          const directMatch = fetchedDirects.find((c) => c._id === targetConvId);
          if (directMatch) {
            selectConversation(directMatch);
            return;
          }
        }

        // 2. If Mess Coordinator, ensure active conversation is mess-feedback or allowed DM
        if (user?.role === "MESS_COORDINATOR") {
          const messChannel = fetchedChannels.find((c) => c.name === "mess-feedback");
          if (
            !activeConversation ||
            (activeConversation.type === "CHANNEL" && activeConversation.name !== "mess-feedback")
          ) {
            if (messChannel) {
              selectConversation(messChannel);
            }
          }
        } else if (!activeConversation && fetchedChannels.length > 0) {
          selectConversation(fetchedChannels[0]);
        }
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
    }
  }

  async function selectConversation(conv: Conversation) {
    if (activeConversation) {
      socket.emit("leave-room", activeConversation._id);
    }
    setActiveConversation(conv);
    setIsSidebarOpen(false);
    socket.emit("join-room", conv._id);

    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/conversations/${conv._id}/messages`);
      if (res.data?.data) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleToggleBlock() {
    if (!activeConversation || activeConversation.type !== "DIRECT") return;

    const isBlocked = activeConversation.blockedBy?.some(
      (id) => id.toString() === currentUserId,
    );

    const actionText = isBlocked ? "Unblock this resident" : "Block this resident";
    if (!confirm(`Are you sure you want to ${actionText.toLowerCase()}?`)) return;

    setBlockingInProgress(true);
    try {
      const res = await api.post(`/chat/conversations/${activeConversation._id}/block`);
      if (res.data?.data) {
        const updatedBlockedBy = res.data.data.blockedBy;
        setActiveConversation((prev) =>
          prev ? { ...prev, blockedBy: updatedBlockedBy } : null,
        );
        setConversations((prev) => ({
          ...prev,
          directChats: prev.directChats.map((c) =>
            c._id === activeConversation._id ? { ...c, blockedBy: updatedBlockedBy } : c,
          ),
        }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to toggle block status");
    } finally {
      setBlockingInProgress(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    const textToSend = messageInput.trim();
    setMessageInput("");

    try {
      const res = await api.post(`/chat/conversations/${activeConversation._id}/messages`, {
        text: textToSend,
      });

      if (res.data?.data) {
        const newMsg = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Broadcast to room via socket
        socket.emit("send-message", {
          conversationId: activeConversation._id,
          message: newMsg,
        });

        // Update last message in sidebar
        const nowIso = new Date().toISOString();
        setConversations((prev) => ({
          channels: prev.channels.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    text: textToSend,
                    senderName: user?.fullName || "User",
                    sentAt: nowIso,
                  },
                }
              : c,
          ),
          directChats: prev.directChats.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    text: textToSend,
                    senderName: user?.fullName || "User",
                    sentAt: nowIso,
                  },
                }
              : c,
          ),
        }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send message");
    }
  }

  async function openNewDirectModal() {
    setIsNewDirectModalOpen(true);
    setUserSearch("");
    try {
      setLoadingUsers(true);
      const res = await api.get("/students");
      if (res.data?.data) {
        setDirectoryUsers(res.data.data);
      }
    } catch (err) {
      console.error("Fetch directory users error:", err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function startDirectChatWith(targetUser: User) {
    const targetUserId = targetUser.id || (targetUser as any)._id;
    try {
      const res = await api.post("/chat/conversations/direct", {
        targetUserId,
      });

      if (res.data?.data) {
        const directConv = res.data.data;
        setIsNewDirectModalOpen(false);

        // Add to direct chats list if not already present
        setConversations((prev) => {
          const exists = prev.directChats.some((c) => c._id === directConv._id);
          return {
            ...prev,
            directChats: exists ? prev.directChats : [directConv, ...prev.directChats],
          };
        });

        selectConversation(directConv);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start direct conversation");
    }
  }

  const getConversationTitle = (conv: Conversation) => {
    if (conv.type === "CHANNEL") {
      return `#${conv.name}`;
    }
    const other = conv.participants?.find(
      (p: any) => (p.id || p._id) !== currentUserId,
    );
    return other?.fullName || conv.name || "Direct Message";
  };

  const getConversationSubtitle = (conv: Conversation) => {
    if (conv.type === "CHANNEL") {
      return conv.topic || "Public Channel";
    }
    const other = conv.participants?.find(
      (p: any) => (p.id || p._id) !== currentUserId,
    );
    return other ? `${other.role} · ${other.block || "Block A"}` : "Private Chat";
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "WARDEN":
      case "ADMIN":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30";
      case "SUPERVISOR":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30";
      case "STUDENT_COORDINATOR":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
      case "MESS_COORDINATOR":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30";
      default:
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30";
    }
  };

  // Blocked status check for current active direct chat
  const isBlockedByMe =
    activeConversation?.type === "DIRECT" &&
    activeConversation.blockedBy?.some((id) => id.toString() === currentUserId);

  const isBlockedByOther =
    activeConversation?.type === "DIRECT" &&
    activeConversation.blockedBy?.some((id) => id.toString() !== currentUserId);

  const isMessagingDisabled = Boolean(isBlockedByMe || isBlockedByOther);

  const filteredUsers = directoryUsers.filter((u) => {
    const uid = u.id || (u as any)._id;
    if (uid === currentUserId) return false;

    // Mess coordinator can only DM Student Representative, Warden, Supervisor, and Admin
    if (user?.role === "MESS_COORDINATOR") {
      const allowedRoles = ["STUDENT_COORDINATOR", "WARDEN", "SUPERVISOR", "ADMIN"];
      if (!allowedRoles.includes(u.role)) return false;
    }

    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.roomNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)] overflow-hidden rounded-2xl border border-zinc-200 dark:border-[#23252d] bg-white dark:bg-[#111216] shadow-xl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Conversations Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#111216] border-r border-zinc-200 dark:border-[#23252d] flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-[#23252d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareText size={18} className="text-yellow-500" />
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Live Channels</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mess Coordinator Scoped Access Banner */}
          {user?.role === "MESS_COORDINATOR" && (
            <div className="mx-3 my-2 p-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-[11px] text-orange-700 dark:text-orange-300 flex items-start gap-2">
              <UtensilsCrossed size={14} className="shrink-0 text-orange-500 mt-0.5" />
              <div>
                <strong>Mess Coordinator Access:</strong>
                <p className="mt-0.5 text-[10px] opacity-90 leading-tight">
                  Authorized to access <strong>#mess-feedback</strong> & DM Student Coordinators, Wardens, and Supervisors.
                </p>
              </div>
            </div>
          )}

          {/* Channels & DMs Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Public / Scoped Channels */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {user?.role === "MESS_COORDINATOR" ? "Authorized Channel (1)" : "Public Channels"}
                </span>
              </div>
              <div className="space-y-1">
                {conversations.channels.map((ch) => {
                  const isSelected = activeConversation?._id === ch._id;
                  return (
                    <button
                      key={ch._id}
                      onClick={() => selectConversation(ch)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                        isSelected
                          ? "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 border border-yellow-400/40"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash size={15} className="text-yellow-500 shrink-0" />
                        <span className="truncate">{ch.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Messages */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Direct Messages
                </span>
                <button
                  onClick={openNewDirectModal}
                  className="p-1 rounded-lg text-yellow-500 hover:bg-yellow-400/10 cursor-pointer"
                  title={user?.role === "MESS_COORDINATOR" ? "DM Student Rep, Warden, Supervisor" : "Start New Direct Message"}
                >
                  <Plus size={14} />
                </button>
              </div>

              {conversations.directChats.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-zinc-400 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-[11px]">No direct messages yet.</p>
                  <button
                    onClick={openNewDirectModal}
                    className="mt-1 font-bold text-yellow-500 hover:underline text-[11px] cursor-pointer"
                  >
                    + Start a direct chat
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.directChats.map((chat) => {
                    const isSelected = activeConversation?._id === chat._id;
                    const otherUser = chat.participants?.find(
                      (p: any) => (p.id || p._id) !== currentUserId,
                    );
                    const isBlocked = Boolean(chat.blockedBy && chat.blockedBy.length > 0);

                    return (
                      <button
                        key={chat._id}
                        onClick={() => selectConversation(chat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 border border-yellow-400/40 font-semibold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <div className="relative h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {otherUser?.avatarUrl ? (
                              <img src={otherUser.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              <span>{otherUser?.fullName?.charAt(0) || "U"}</span>
                            )}
                            {isBlocked && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full border-2 border-white dark:border-[#111216]" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="truncate font-bold text-zinc-800 dark:text-zinc-200">
                              {otherUser?.fullName || "Resident"}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {otherUser?.role?.replace("_", " ") || "Student"}
                            </p>
                          </div>
                        </div>

                        {isBlocked && (
                          <span className="text-[9px] font-mono text-rose-500 font-bold">
                            BLOCKED
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User Status Bar */}
          <div className="p-3 border-t border-zinc-200 dark:border-[#23252d] bg-zinc-50/50 dark:bg-[#18191f]/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {user?.fullName}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${getRoleBadge(user?.role)}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#090a0d] min-w-0">
        {/* Chat Active Header */}
        <div className="h-14 border-b border-zinc-200 dark:border-[#23252d] px-4 flex items-center justify-between gap-3 bg-white/70 dark:bg-[#111216]/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                {activeConversation?.type === "CHANNEL" ? (
                  <Hash size={16} className="text-yellow-500 shrink-0" />
                ) : (
                  <UserIcon size={16} className="text-yellow-500 shrink-0" />
                )}
                <span className="truncate">
                  {activeConversation ? getConversationTitle(activeConversation) : "Select a conversation"}
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {activeConversation ? getConversationSubtitle(activeConversation) : "Real-time communication"}
              </p>
            </div>
          </div>

          {/* Right Action: Block / Unblock Resident in Direct Chats */}
          {activeConversation?.type === "DIRECT" && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleToggleBlock}
                disabled={blockingInProgress}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isBlockedByMe
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    : "border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                }`}
                title={isBlockedByMe ? "Unblock resident" : "Block resident"}
              >
                {isBlockedByMe ? (
                  <>
                    <ShieldCheck size={14} />
                    <span>Unblock</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={14} />
                    <span>Block Resident</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Blocking Warnings Banner */}
        {isBlockedByMe && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="shrink-0" />
              <span>You have blocked this resident. You cannot send or receive direct messages with them.</span>
            </div>
            <button
              onClick={handleToggleBlock}
              className="font-bold underline hover:text-rose-400 text-xs shrink-0 cursor-pointer"
            >
              Unblock
            </button>
          </div>
        )}

        {isBlockedByOther && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>This resident has blocked direct messaging from you.</span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loadingMessages ? (
            <div className="py-16 text-center text-xs text-zinc-400 font-mono">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent mb-2" />
              Connecting to live message stream...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 max-w-sm mx-auto">
              <MessageSquareText size={32} className="mx-auto text-zinc-400 mb-2 opacity-50" />
              <p className="font-bold text-zinc-700 dark:text-zinc-300">Start the conversation</p>
              <p className="mt-1">
                Messages sent here are delivered instantly via Socket.IO.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId = msg.senderId?._id || msg.senderId?.id || (msg.senderId as any);
              const isMe = senderId === currentUserId;

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-zinc-400">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {msg.senderId?.fullName || (isMe ? user?.fullName : "Resident")}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded ${getRoleBadge(msg.senderId?.role || (isMe ? user?.role : "STUDENT"))}`}>
                      {msg.senderId?.role || (isMe ? user?.role : "STUDENT")}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isMe
                        ? "bg-yellow-400 text-zinc-950 font-medium rounded-tr-xs shadow-sm shadow-yellow-400/10"
                        : "border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] text-zinc-800 dark:text-zinc-200 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-zinc-200 dark:border-[#23252d] bg-white/70 dark:bg-[#111216]/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              disabled={isMessagingDisabled}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                isBlockedByMe
                  ? "You have blocked this resident. Unblock them to chat."
                  : isBlockedByOther
                  ? "Direct messaging with this resident is restricted."
                  : `Type a message to ${activeConversation ? getConversationTitle(activeConversation) : "chat"}...`
              }
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-4 py-2.5 text-xs outline-hidden focus:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              disabled={isMessagingDisabled || !messageInput.trim()}
              className="rounded-xl bg-yellow-400 p-2.5 text-zinc-950 font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Start New Direct Message Modal */}
      {isNewDirectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsNewDirectModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <UserIcon size={18} className="text-yellow-500" />
                  {user?.role === "MESS_COORDINATOR" ? "DM Student Rep, Warden or Supervisor" : "Direct Message Resident / Staff"}
                </h2>
                <button
                  onClick={() => setIsNewDirectModalOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              {user?.role === "MESS_COORDINATOR" && (
                <p className="text-[11px] text-zinc-500 mt-2">
                  As Mess Incharge, you can start direct messaging with Student Representatives, Wardens, Supervisors, and Administrators.
                </p>
              )}

              <div className="mt-3">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search student rep, warden, supervisor..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              {/* Users List */}
              <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {loadingUsers ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">Loading hostel directory...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No authorized residents or staff found.</p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id || (u as any)._id}
                      onClick={() => startDirectChatWith(u)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#18191f] hover:border-yellow-400/40 text-left transition-all cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{u.fullName}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{u.email} · {u.block || "Block A"}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-right">
              <button
                onClick={() => setIsNewDirectModalOpen(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
