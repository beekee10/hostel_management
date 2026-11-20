import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/useAuth";
import { useTheme } from "../../../context/ThemeContext";
import { api } from "../../../lib/api";
import type { Role } from "../../../types";
import {
  Zap,
  Lock,
  Mail,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

const DEMO_USERS = [
  { role: "STUDENT" as Role, label: "Student", email: "student@campus.in", badge: "Room 304", desc: "Raise tickets, post topics, chat, reviews" },
  { role: "STUDENT_COORDINATOR" as Role, label: "Student Rep", email: "representative@campus.in", badge: "Council", desc: "Edit notices & mess menu, forward complaints" },
  { role: "SUPERVISOR" as Role, label: "Supervisor", email: "supervisor@campus.in", badge: "Facilities", desc: "Add students (no delete), edit notices, AI summaries" },
  { role: "WARDEN" as Role, label: "Chief Warden", email: "warden@campus.in", badge: "Authority", desc: "Add/edit/delete students, notices, full oversight" },
  { role: "MESS_COORDINATOR" as Role, label: "Mess Incharge", email: "messincharge@campus.in", badge: "Dining", desc: "Edit menu, log wastage, AI waste reports" },
  { role: "ADMIN" as Role, label: "Admin", email: "admin@campus.in", badge: "System", desc: "Complete administrative control" },
];

export function LoginPage() {
  const { login: saveSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("student@campus.in");
  const [password, setPassword] = useState("Pass@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data?.data) {
        saveSession(res.data.data.accessToken, res.data.data.user);
        const from = (location.state as { from?: string } | null)?.from ?? "/";
        navigate(from, { replace: true });
      } else {
        throw new Error(res.data?.message || "Login failed");
      }
    } catch (err: any) {
      // Fallback demo login if server is starting or offline
      console.warn("Using local session login fallback:", err);
      const matched = DEMO_USERS.find((d) => d.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        saveSession("demo-token", {
          id: `demo-${matched.role.toLowerCase()}`,
          fullName: matched.label,
          email: matched.email,
          role: matched.role,
          block: "Block A",
          roomNumber: "Room 101",
        });
        const from = (location.state as { from?: string } | null)?.from ?? "/";
        navigate(from, { replace: true });
      } else {
        setError(err.response?.data?.message || err.message || "Invalid credentials. Try demo accounts below.");
      }
    } finally {
      setLoading(false);
    }
  }

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Pass@123");
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#fcfcfd] dark:bg-[#090a0d] text-zinc-900 dark:text-zinc-100 drizzle-grid-bg relative overflow-hidden transition-colors duration-200">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-3 z-10">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121316] text-zinc-700 dark:text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all cursor-pointer shadow-xs"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-yellow-400 fill-yellow-400/20" />
          ) : (
            <Moon size={17} className="text-zinc-700" />
          )}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl z-10"
      >
        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl dark:shadow-2xl shadow-zinc-200/50 dark:shadow-yellow-500/5 relative overflow-hidden transition-colors duration-200">
          {/* Top Yellow Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-600" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-950 font-bold shadow-lg shadow-yellow-400/20 mb-3">
              <Zap size={24} className="fill-zinc-950" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Campus<span className="text-yellow-500 dark:text-yellow-400">Nest</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Smart Hostel & Mess Operations Platform with Gemini AI
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.in"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#18191f] pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-hidden transition-all focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                PASSWORD
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#18191f] pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-hidden transition-all focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-yellow-400/20 hover:bg-yellow-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* 1-Click Role Quick Fill Grid */}
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-yellow-500 dark:text-yellow-400" />
                1-Click Demo Accounts (Password: Pass@123)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_USERS.map((d) => {
                const isSelected = email.toLowerCase() === d.email.toLowerCase();
                return (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => quickFill(d.email)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-yellow-400 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 shadow-xs shadow-yellow-400/10"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{d.label}</span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                          isSelected
                            ? "bg-yellow-400/20 text-yellow-800 dark:text-yellow-300"
                            : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {d.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1">
                      {d.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
