import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { Complaint, ComplaintCategory, ComplaintStatus, SupervisorSummary } from "../../../types";
import {
  AlertTriangle,
  Sparkles,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  FileText,
  HelpCircle,
  Zap,
  Droplets,
  Wifi,
  Utensils,
  Shield,
  Trash2,
  ArrowUpRight,
  User,
  UserCheck,
  Tag,
} from "lucide-react";

const CATEGORIES: ComplaintCategory[] = [
  "HEALTH",
  "MAINTENANCE",
  "ELECTRICITY",
  "PLUMBING",
  "CLEANLINESS",
  "WATER",
  "INTERNET",
  "SECURITY",
  "MESS",
  "OTHER",
];

export function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<"ALL" | "MY_CONCERNS">("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // New Complaint Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("ELECTRICITY");
  const [block, setBlock] = useState(user?.block || "Block A");
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || "Room 101");
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Supervisor Summary Modal
  const [aiSummary, setAiSummary] = useState<SupervisorSummary | null>(null);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  // Forward Modal
  const [forwardingComplaint, setForwardingComplaint] = useState<Complaint | null>(null);
  const [forwardTarget, setForwardTarget] = useState("Chief Warden & Electrician Team");
  const [coordinatorNotes, setCoordinatorNotes] = useState("");
  const [forwardSubmitting, setForwardSubmitting] = useState(false);

  const currentUserId = user?.id || (user as any)?._id;

  const canManageStatus =
    user?.role === "WARDEN" ||
    user?.role === "SUPERVISOR" ||
    user?.role === "STUDENT_COORDINATOR" ||
    user?.role === "ADMIN";

  const canForward =
    user?.role === "STUDENT_COORDINATOR" ||
    user?.role === "SUPERVISOR" ||
    user?.role === "WARDEN" ||
    user?.role === "ADMIN";

  useEffect(() => {
    fetchComplaints();
  }, [viewScope, filterStatus, filterCategory]);

  async function fetchComplaints() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (viewScope === "MY_CONCERNS") params.append("myOnly", "true");
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (filterCategory !== "ALL") params.append("category", filterCategory);

      const res = await api.get(`/complaints?${params.toString()}`);
      if (res.data?.data) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateComplaint(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/complaints", {
        title,
        description,
        category,
        block,
        roomNumber,
      });

      if (res.data?.data) {
        setComplaints((prev) => [res.data.data, ...prev]);
        setTitle("");
        setDescription("");
        setIsCreating(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create complaint");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: ComplaintStatus) {
    try {
      const res = await api.patch(`/complaints/${id}/status`, { status: newStatus });
      if (res.data?.data) {
        setComplaints((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c)),
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update complaint status");
    }
  }

  async function handleForwardComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!forwardingComplaint) return;
    setForwardSubmitting(true);

    try {
      const res = await api.post(`/complaints/${forwardingComplaint._id}/forward`, {
        forwardTarget,
        coordinatorNotes,
      });

      if (res.data?.data) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === forwardingComplaint._id
              ? {
                  ...c,
                  isForwarded: true,
                  forwardedTo: forwardTarget,
                  coordinatorNotes,
                  status: c.status === "OPEN" ? "ACKNOWLEDGED" : c.status,
                }
              : c,
          ),
        );
        setForwardingComplaint(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to forward complaint");
    } finally {
      setForwardSubmitting(false);
    }
  }

  async function openAiSupervisorSummary() {
    setIsAiSummaryOpen(true);
    setLoadingAiSummary(true);
    try {
      const res = await api.get("/complaints/ai/supervisor-summary");
      if (res.data?.data) {
        setAiSummary(res.data.data);
      }
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setLoadingAiSummary(false);
    }
  }

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "RESOLVED":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
      case "IN_PROGRESS":
        return "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/40";
      case "ACKNOWLEDGED":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40";
      case "REJECTED":
        return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/40";
      default:
        return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/40";
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold animate-pulse";
      case "HIGH":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold";
      case "LOW":
        return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/40";
      default:
        return "bg-yellow-500/15 text-yellow-500 border-yellow-500/40";
    }
  };

  const myComplaintsCount = complaints.filter((c) => {
    const sId = (c.studentId as any)?._id || (c.studentId as any)?.id || c.studentId;
    return sId === currentUserId;
  }).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="drizzle-badge drizzle-badge-yellow text-[10px] sm:text-xs">
              <Sparkles size={12} /> GEMINI AI COMPLAINT INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Student Concerns & Maintenance Triage
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Auto-categorization, priority scoring, supervisor problem cluster detection & live progress tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAiSupervisorSummary}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span>AI Summary</span>
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-yellow-400 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{isCreating ? "Cancel" : "Raise New Concern"}</span>
          </button>
        </div>
      </div>

      {/* New Complaint Form Card (Collapsible) */}
      {isCreating && (
        <div className="drizzle-card p-5 sm:p-6 border-yellow-500/40 animate-in fade-in zoom-in-95">
          <h2 className="text-base font-bold flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-yellow-500" />
            Submit Hostel Complaint
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Gemini AI will automatically classify severity, estimate priority score (0-100), and group related tickets.
          </p>

          <form onSubmit={handleCreateComplaint} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                COMPLAINT TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bathroom geyser sparking and emitting smoke in Room 304"
                required
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2.5 text-xs outline-hidden focus:border-yellow-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  CATEGORY (AI VERIFIED)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  HOSTEL BLOCK
                </label>
                <select
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Dining Hall">Dining Hall</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  ROOM / LOCATION
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 304 / Corridor"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                DETAILED PROBLEM DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain what happened, since when, and any safety hazards..."
                required
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300 cursor-pointer"
              >
                {submitting ? "Triage with Gemini..." : "Submit Concern"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main View Scope Toggle: All Hostel Concerns vs My Raised Concerns */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-1 text-xs">
          <button
            onClick={() => setViewScope("ALL")}
            className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all cursor-pointer ${
              viewScope === "ALL"
                ? "bg-yellow-400 text-zinc-950 font-bold shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            📋 All Hostel Concerns
          </button>
          <button
            onClick={() => setViewScope("MY_CONCERNS")}
            className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewScope === "MY_CONCERNS"
                ? "bg-yellow-400 text-zinc-950 font-bold shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <User size={13} />
            <span>My Raised Concerns</span>
          </button>
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  filterStatus === st
                    ? "bg-yellow-400 text-zinc-950 font-bold"
                    : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] text-zinc-600 dark:text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] px-2.5 py-1 text-xs outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="drizzle-card p-5 h-36 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="drizzle-card p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
          <h3 className="text-base font-bold">
            {viewScope === "MY_CONCERNS" ? "You haven't raised any concerns yet" : "No complaints found"}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {viewScope === "MY_CONCERNS"
              ? "When you submit a maintenance ticket, it will appear here with live resolution status."
              : "All tickets in this filter are resolved or none have been submitted."}
          </p>
          {viewScope === "MY_CONCERNS" && !isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300"
            >
              <Plus size={14} />
              <span>Raise a Concern</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => {
            const submitterId =
              (complaint.studentId as any)?._id ||
              (complaint.studentId as any)?.id ||
              complaint.studentId;

            const isMyComplaint = submitterId === currentUserId;

            return (
              <div
                key={complaint._id}
                className={`drizzle-card p-5 transition-all ${
                  isMyComplaint
                    ? "border-emerald-500/40 bg-emerald-500/5 shadow-xs"
                    : complaint.severity === "CRITICAL"
                    ? "border-rose-500/50 bg-rose-500/5"
                    : complaint.severity === "HIGH"
                    ? "border-amber-500/40"
                    : ""
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Tags & Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`border px-2 py-0.5 rounded-md font-mono text-[10px] uppercase ${getStatusBadge(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`border px-2 py-0.5 rounded-md font-mono text-[10px] uppercase ${getSeverityBadge(complaint.severity)}`}>
                        {complaint.severity} SEVERITY
                      </span>

                      {/* Person who raised concern badge */}
                      {isMyComplaint && (
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <UserCheck size={11} /> Raised by You
                        </span>
                      )}

                      <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                        {complaint.category}
                      </span>
                      <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                        {complaint.block} · {complaint.roomNumber}
                      </span>
                      <span className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded">
                        PRIORITY: {complaint.priorityScore}/100
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {complaint.title}
                    </h3>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {complaint.description}
                    </p>

                    {/* Submitter info line */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 pt-0.5">
                      <User size={12} className="text-zinc-400" />
                      <span>
                        Submitted by:{" "}
                        <strong>
                          {isMyComplaint
                            ? "You"
                            : (complaint.studentId as any)?.fullName || "Resident"}
                        </strong>{" "}
                        ({complaint.block} · {complaint.roomNumber})
                      </span>
                    </div>

                    {/* AI Reason explanation */}
                    {complaint.aiReason && (
                      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 text-[11px] text-yellow-700 dark:text-yellow-300 flex items-start gap-1.5 mt-2">
                        <Sparkles size={13} className="shrink-0 mt-0.5" />
                        <span>
                          <strong>AI Triage:</strong> {complaint.aiReason}
                        </span>
                      </div>
                    )}

                    {/* Forwarded Status if any */}
                    {complaint.forwardedTo && (
                      <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-2 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-1.5 mt-2">
                        <Send size={13} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>Forwarded to {complaint.forwardedTo}:</strong>{" "}
                          {complaint.coordinatorNotes || "Under review with technician."}
                          {complaint.forwardedBy && (
                            <span className="text-[10px] block text-purple-400">
                              By {complaint.forwardedBy.fullName} ({complaint.forwardedBy.role})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions: Status Dropdown & Forward Button */}
                  <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                    {canManageStatus && (
                      <select
                        value={complaint.status}
                        onChange={(e) => handleUpdateStatus(complaint._id, e.target.value as ComplaintStatus)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18191f] px-2.5 py-1.5 text-xs font-semibold outline-hidden focus:border-yellow-400 cursor-pointer"
                      >
                        <option value="OPEN">Status: OPEN</option>
                        <option value="ACKNOWLEDGED">Status: ACKNOWLEDGED</option>
                        <option value="IN_PROGRESS">Status: IN_PROGRESS</option>
                        <option value="RESOLVED">Status: RESOLVED</option>
                        <option value="REJECTED">Status: REJECTED</option>
                      </select>
                    )}

                    {canForward && (
                      <button
                        onClick={() => {
                          setForwardingComplaint(complaint);
                          setCoordinatorNotes(complaint.coordinatorNotes || "");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer"
                      >
                        <Send size={12} />
                        <span>Review & Forward</span>
                      </button>
                    )}

                    <div className="text-[10px] font-mono text-zinc-400 mt-1">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Forward Complaint Modal */}
      {forwardingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setForwardingComplaint(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Send size={17} className="text-purple-500" />
              Review & Forward Complaint
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ticket #{forwardingComplaint._id.slice(-6)}: {forwardingComplaint.title}
            </p>

            <form onSubmit={handleForwardComplaint} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  FORWARD RECIPIENT
                </label>
                <select
                  value={forwardTarget}
                  onChange={(e) => setForwardTarget(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3 py-2 text-xs outline-hidden focus:border-yellow-400"
                >
                  <option value="Chief Warden & Electrician Team">Chief Warden & Electrician Team</option>
                  <option value="Plumbing Contractor & Supervisor">Plumbing Contractor & Supervisor</option>
                  <option value="Campus Internet NOC">Campus Internet NOC</option>
                  <option value="Mess Manager & Hygiene Inspector">Mess Manager & Hygiene Inspector</option>
                  <option value="Hostel Estate Maintenance Office">Hostel Estate Maintenance Office</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  COORDINATOR / SUPERVISOR NOTES
                </label>
                <textarea
                  value={coordinatorNotes}
                  onChange={(e) => setCoordinatorNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Verified on 3rd floor. Urgent electrical fire hazard. Pls dispatch technician ASAP."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] px-3.5 py-2 text-xs outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForwardingComplaint(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forwardSubmitting}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500"
                >
                  {forwardSubmitting ? "Forwarding..." : "Confirm & Escalate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Supervisor Summary Modal */}
      {isAiSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsAiSummaryOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-yellow-500/40 bg-white dark:bg-[#111216] p-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-yellow-400/20 text-yellow-500">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Hostel Supervisor AI Problem Summary
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Repeated problem clusters & urgent maintenance hotspots
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiSummaryOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {loadingAiSummary ? (
              <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent mb-3" />
                Gemini analyzing recent complaints and grouping recurring issues...
              </div>
            ) : !aiSummary ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Failed to generate supervisor summary.
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                {/* Executive Overview */}
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                  <h3 className="font-bold text-yellow-600 dark:text-yellow-400 mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} /> Executive Supervisor Briefing
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {aiSummary.summary}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400">ACTIVE TICKETS</p>
                    <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                      {aiSummary.totalActiveComplaints ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <p className="text-[10px] text-rose-500">CRITICAL TICKETS</p>
                    <p className="text-base font-extrabold text-rose-500">
                      {aiSummary.criticalCount ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-[10px] text-amber-500">CLUSTERED ISSUES</p>
                    <p className="text-base font-extrabold text-amber-500">
                      {aiSummary.clusteredIssues?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Repeated Problem Clusters */}
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Identified Problem Clusters & Recurring Failures
                  </h4>
                  <div className="space-y-2">
                    {(aiSummary.clusteredIssues || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#18191f]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {item.topic}
                          </span>
                          <span className="font-mono text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                            {item.count} Occurrences
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Affected Areas: {item.affectedArea || "General"}
                        </p>
                        <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                          💡 Action: {item.recommendedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
