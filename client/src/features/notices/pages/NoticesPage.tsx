import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { Notice, NoticeType } from "../../../types";
import {
  Zap,
  Droplets,
  Wrench,
  PartyPopper,
  AlertOctagon,
  Utensils,
  BellRing,
  Plus,
  Pin,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Filter,
} from "lucide-react";

const CATEGORIES: Array<{ type: NoticeType | "ALL"; label: string; icon: any }> = [
  { type: "ALL", label: "All Notices", icon: BellRing },
  { type: "ELECTRICITY", label: "Power & Electricity", icon: Zap },
  { type: "WATER", label: "Water Supply", icon: Droplets },
  { type: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  { type: "EVENT", label: "Events & Sports", icon: PartyPopper },
  { type: "EMERGENCY", label: "Emergency", icon: AlertOctagon },
  { type: "MESS", label: "Mess Updates", icon: Utensils },
];

export function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NoticeType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NoticeType>("ELECTRICITY");
  const [block, setBlock] = useState("All Blocks");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [affectedAreas, setAffectedAreas] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canManageNotices =
    user?.role === "WARDEN" ||
    user?.role === "SUPERVISOR" ||
    user?.role === "STUDENT_COORDINATOR" ||
    user?.role === "ADMIN";

  const canDeleteNotice =
    user?.role === "WARDEN" || user?.role === "SUPERVISOR" || user?.role === "ADMIN";

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory]);

  async function fetchNotices() {
    try {
      setLoading(true);
      const url = selectedCategory === "ALL" ? "/notices" : `/notices?type=${selectedCategory}`;
      const res = await api.get(url);
      if (res.data?.data) {
        setNotices(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditingNotice(null);
    setTitle("");
    setBody("");
    setType("ELECTRICITY");
    setBlock("All Blocks");
    setScheduledStart("");
    setScheduledEnd("");
    setAffectedAreas("Hostel Complex");
    setIsPinned(false);
    setIsEmergency(false);
    setIsModalOpen(true);
  };

  const openEditModal = (n: Notice) => {
    setEditingNotice(n);
    setTitle(n.title);
    setBody(n.body);
    setType(n.type);
    setBlock(n.block || "All Blocks");
    setScheduledStart(n.scheduledStart ? n.scheduledStart.slice(0, 16) : "");
    setScheduledEnd(n.scheduledEnd ? n.scheduledEnd.slice(0, 16) : "");
    setAffectedAreas(n.affectedAreas || "Hostel Complex");
    setIsPinned(Boolean(n.isPinned));
    setIsEmergency(Boolean(n.isEmergency));
    setIsModalOpen(true);
  };

  async function handleSaveNotice(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        body,
        type,
        block,
        scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
        affectedAreas,
        isPinned,
        isEmergency,
      };

      if (editingNotice) {
        await api.put(`/notices/${editingNotice._id}`, payload);
      } else {
        await api.post("/notices", payload);
      }

      setIsModalOpen(false);
      fetchNotices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save notice");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNotice(id: string) {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete notice");
    }
  }

  const getCategoryBadge = (t: NoticeType) => {
    switch (t) {
      case "ELECTRICITY":
        return "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 border-yellow-400/40";
      case "WATER":
        return "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/40";
      case "EMERGENCY":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40";
      case "EVENT":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40";
      case "MAINTENANCE":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40";
      case "MESS":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
      default:
        return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="drizzle-badge drizzle-badge-yellow">
              LIVE NOTICES & SCHEDULES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Hostel Notice Board
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Electricity cuts, water supply maintenance, event registrations & general hostel circulars.
          </p>
        </div>

        {canManageNotices && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.type;
          return (
            <button
              key={cat.type}
              onClick={() => setSelectedCategory(cat.type)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-yellow-400 text-zinc-950 font-bold shadow-xs shadow-yellow-400/20"
                  : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] text-zinc-600 dark:text-zinc-400 hover:border-yellow-400/40"
              }`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notices Feed */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="drizzle-card p-5 h-44 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="drizzle-card p-12 text-center">
          <BellRing size={32} className="mx-auto text-zinc-400 mb-2" />
          <h3 className="text-base font-bold">No notices in this category</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Check back later for electricity schedules and hostel events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`drizzle-card p-5 relative flex flex-col justify-between ${
                notice.isEmergency
                  ? "border-rose-500/50 bg-rose-500/5"
                  : notice.type === "ELECTRICITY"
                  ? "border-yellow-500/40 hover:border-yellow-400"
                  : ""
              }`}
            >
              <div>
                {/* Notice Top Meta */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`border px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${getCategoryBadge(notice.type)}`}>
                      {notice.type}
                    </span>
                    {notice.block && (
                      <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                        {notice.block}
                      </span>
                    )}
                    {notice.isPinned && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                        <Pin size={10} /> PINNED
                      </span>
                    )}
                  </div>

                  {canManageNotices && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(notice)}
                        className="rounded-lg p-1 text-zinc-400 hover:text-yellow-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Notice"
                      >
                        <Edit2 size={14} />
                      </button>
                      {canDeleteNotice && (
                        <button
                          onClick={() => handleDeleteNotice(notice._id)}
                          className="rounded-lg p-1 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Delete Notice"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {notice.title}
                </h3>

                {/* Scheduled Outage Box if Electricity / Water */}
                {(notice.scheduledStart || notice.scheduledEnd) && (
                  <div className="mt-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-2.5 text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2 font-mono">
                    <Clock size={14} className="shrink-0" />
                    <div>
                      <span className="font-bold">Scheduled Window: </span>
                      {notice.scheduledStart && new Date(notice.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {notice.scheduledEnd && ` — ${new Date(notice.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                    </div>
                  </div>
                )}

                <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {notice.body}
                </p>
              </div>

              {/* Bottom Footer: Author & Timestamp */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>By: {notice.createdBy?.fullName || "Hostel Admin"}</span>
                <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">
              {editingNotice ? "Edit Notice" : "Publish Hostel Notice"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Broadcast power cuts, water maintenance, and events to hostel residents.
            </p>

            <form onSubmit={handleSaveNotice} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  TITLE
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ⚡ Scheduled Substation Maintenance in Block B"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NoticeType)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="ELECTRICITY">⚡ Electricity & Power Cuts</option>
                    <option value="WATER">💧 Water Outage / Cleaning</option>
                    <option value="MAINTENANCE">🔧 General Maintenance</option>
                    <option value="EVENT">🎉 Event / Sports</option>
                    <option value="EMERGENCY">🚨 Emergency Alert</option>
                    <option value="MESS">🍽️ Mess Notification</option>
                    <option value="GENERAL">📢 General Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    TARGET BLOCK
                  </label>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  >
                    <option value="All Blocks">All Blocks</option>
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                    <option value="Dining Hall">Dining Hall</option>
                  </select>
                </div>
              </div>

              {/* Time Window for Electricity/Water */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    SCHEDULED START
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    SCHEDULED END
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  NOTICE CONTENT
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Provide complete details, safety instructions, or registration links..."
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded text-yellow-500 focus:ring-yellow-400"
                  />
                  <span>Pin to top of board</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="rounded text-rose-500 focus:ring-rose-400"
                  />
                  <span className="text-rose-500 font-semibold">Mark Emergency</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
                >
                  {submitting ? "Saving..." : editingNotice ? "Update Notice" : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
