import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import { api } from "../../../lib/api";
import type { Notice, Complaint, HotTopic, SupervisorSummary } from "../../../types";
import {
  Zap,
  BellRing,
  AlertTriangle,
  Flame,
  UtensilsCrossed,
  MessageSquareText,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [aiSummary, setAiSummary] = useState<SupervisorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [noticesRes, complaintsRes, topicsRes] = await Promise.allSettled([
          api.get("/notices"),
          api.get("/complaints"),
          api.get("/community/topics"),
        ]);

        if (noticesRes.status === "fulfilled" && noticesRes.value.data?.data) {
          setNotices(noticesRes.value.data.data);
        }
        if (complaintsRes.status === "fulfilled" && complaintsRes.value.data?.data) {
          setComplaints(complaintsRes.value.data.data);
        }
        if (topicsRes.status === "fulfilled" && topicsRes.value.data?.data) {
          setHotTopics(topicsRes.value.data.data);
        }

        // Fetch AI supervisor summary if staff/admin/rep
        if (
          user?.role === "SUPERVISOR" ||
          user?.role === "WARDEN" ||
          user?.role === "ADMIN" ||
          user?.role === "STUDENT_COORDINATOR"
        ) {
          try {
            const summaryRes = await api.get("/complaints/supervisor-summary");
            if (summaryRes.data?.data) {
              setAiSummary(summaryRes.data.data);
            }
          } catch {
            // gracefully fallback
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.role]);

  // Find active power cuts or water disruptions
  const activePowerCut = notices.find(
    (n) => n.type === "ELECTRICITY" || n.title.toLowerCase().includes("power cut"),
  );
  const activeWaterAlert = notices.find(
    (n) => n.type === "WATER" || n.title.toLowerCase().includes("water"),
  );

  const urgentComplaints = complaints.filter(
    (c) => c.severity === "CRITICAL" || c.severity === "HIGH",
  );

  const getRoleWelcome = () => {
    switch (user?.role) {
      case "STUDENT_COORDINATOR":
        return {
          title: "Student Representative Console",
          desc: "Coordinate hostel notices, review student concerns, and optimize the mess menu.",
        };
      case "SUPERVISOR":
        return {
          title: "Hostel Supervisor Dashboard",
          desc: "Track maintenance tickets, view AI problem summaries, and manage student resident intake.",
        };
      case "WARDEN":
        return {
          title: "Hostel Warden Master Portal",
          desc: "Full administrative control over hostel discipline, student registry, and emergency alerts.",
        };
      case "MESS_COORDINATOR":
        return {
          title: "Mess & Catering Operations Center",
          desc: "Update daily menus, monitor dining turnout, log food wastage, and run Gemini AI reports.",
        };
      case "ADMIN":
        return {
          title: "System Administrator Panel",
          desc: "Full access to all database records, user permissions, and AI services.",
        };
      default:
        return {
          title: `Welcome back, ${user?.fullName?.split(" ")[0] || "Student"}!`,
          desc: `Resident in ${user?.block || "Block A"} · ${user?.roomNumber || "Room 101"}. All hostel utilities and community hub are active.`,
        };
    }
  };

  const welcome = getRoleWelcome();

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="drizzle-card p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="drizzle-badge drizzle-badge-yellow">
                ROLE: {user?.role?.replace("_", " ")}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {welcome.title}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
              {welcome.desc}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/complaints"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-yellow-300 shadow-sm transition-all"
            >
              <AlertTriangle size={15} />
              <span>Raise Ticket</span>
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18191f] px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-yellow-400/50 transition-all"
            >
              <MessageSquareText size={15} />
              <span>Hostel Chat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Electricity Power Cut / Emergency Notice Banner */}
      {activePowerCut && (
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 sm:p-5 relative overflow-hidden animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-400/20">
              <Zap size={20} className="fill-zinc-950" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  POWER CUT ALERT · {activePowerCut.block || "Affected Wings"}
                </span>
                {activePowerCut.scheduledStart && (
                  <span className="rounded-md bg-yellow-400/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-700 dark:text-yellow-300">
                    <Clock size={11} className="inline mr-1" />
                    Scheduled: {new Date(activePowerCut.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {activePowerCut.title}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">
                {activePowerCut.body}
              </p>
            </div>
            <Link
              to="/notices"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              <span>View details</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="drizzle-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500">ACTIVE NOTICES</span>
            <BellRing size={16} className="text-yellow-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{notices.length}</span>
            <span className="text-[11px] text-zinc-400">published</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Electricity & events</p>
        </div>

        <div className="drizzle-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500">PENDING CONCERNS</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{complaints.length}</span>
            {urgentComplaints.length > 0 && (
              <span className="text-[11px] font-bold text-rose-500">
                {urgentComplaints.length} urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">AI triage enabled</p>
        </div>

        <div className="drizzle-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500">HOT TOPICS</span>
            <Flame size={16} className="text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{hotTopics.length}</span>
            <span className="text-[11px] text-zinc-400">trending</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Reddit dynamic bento grid</p>
        </div>

        <div className="drizzle-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500">MESS EFFICIENCY</span>
            <UtensilsCrossed size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">86%</span>
            <span className="text-[11px] text-emerald-500 font-bold">Good</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Wastage monitored</p>
        </div>
      </div>

      {/* Main Grid: AI Supervisor Problem Summary & Hot Topics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights or Action Hub */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Supervisor Intelligence Card (If available) */}
          {aiSummary ? (
            <div className="drizzle-card p-5 border-yellow-500/40 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-yellow-400/20 text-yellow-500 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      Gemini AI · Supervisor Problem Intelligence
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Repeated hostel issues grouped across blocks & floors
                    </p>
                  </div>
                </div>
                <Link
                  to="/complaints"
                  className="text-xs font-semibold text-yellow-500 hover:underline"
                >
                  View all tickets
                </Link>
              </div>

              <div className="rounded-xl bg-zinc-50 dark:bg-[#18191f] p-3.5 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 leading-relaxed mb-4">
                {aiSummary.summary}
              </div>

              {/* Clustered Issues */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono text-zinc-400 uppercase">
                  Detected Problem Clusters
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {aiSummary.clusteredIssues?.slice(0, 4).map((cluster, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#14151a] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                        <span>{cluster.topic}</span>
                        <span className="font-mono text-[10px] bg-yellow-400/20 text-yellow-500 px-1.5 py-0.5 rounded">
                          {cluster.count} reports
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                        📍 {cluster.affectedArea}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        💡 {cluster.recommendedAction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="drizzle-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck size={17} className="text-yellow-500" />
                  Quick Action Tiles
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Role: {user?.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/notices"
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Notice Board</span>
                    <BellRing size={16} className="text-yellow-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Check electricity cuts, water maintenance, and upcoming events.
                  </p>
                </Link>

                <Link
                  to="/complaints"
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Complaints & Triage</span>
                    <AlertTriangle size={16} className="text-amber-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Report room issues with instant Gemini AI urgency scoring.
                  </p>
                </Link>

                <Link
                  to="/community"
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Reddit Hot Topics</span>
                    <Flame size={16} className="text-orange-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Participate in hostel forum (max 2 daily topics per student).
                  </p>
                </Link>

                <Link
                  to="/mess"
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Mess & Wastage</span>
                    <UtensilsCrossed size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    View weekly schedule, rate food quality, and track food waste.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Trending Hot Topics & Live Chat snippet */}
        <div className="space-y-4">
          <div className="drizzle-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                Hot Topics (Reddit Style)
              </h3>
              <Link to="/community" className="text-xs text-yellow-500 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2.5">
              {hotTopics.slice(0, 3).map((topic) => (
                <Link
                  key={topic._id}
                  to="/community"
                  className="block rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#14151a] p-3 hover:border-yellow-400/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      🔥 Heat: {topic.heatScore}
                    </span>
                    <span>{topic.commentCount} comments</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-2">
                    {topic.title}
                  </h4>
                  {topic.aiSummary && (
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                      💡 {topic.aiSummary}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Real-time Channels */}
          <div className="drizzle-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageSquareText size={16} className="text-yellow-500" />
                Hostel Channels
              </h3>
              <Link to="/chat" className="text-xs text-yellow-500 hover:underline">
                Open chat
              </Link>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <Link
                to="/chat"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                <span>#general-lounge</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </Link>
              <Link
                to="/chat"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                <span>#power-water-alerts</span>
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
              </Link>
              <Link
                to="/chat"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                <span>#mess-feedback</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
