import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";
import type { Role } from "../../types";
import { ProfileModal } from "../profile/ProfileModal";
import {
  Sun,
  Moon,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Zap,
  MessageSquareText,
  Calendar,
  Settings,
} from "lucide-react";

interface NavbarProps {
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

const ROLES_LIST: Array<{ role: Role; label: string; desc: string }> = [
  { role: "STUDENT", label: "Student", desc: "Raise tickets, post topics, chat, reviews" },
  { role: "STUDENT_COORDINATOR", label: "Student Representative", desc: "Edit notices, edit mess menu, forward complaints" },
  { role: "SUPERVISOR", label: "Hostel Supervisor", desc: "Add students (no delete), edit notices, AI summaries" },
  { role: "WARDEN", label: "Hostel Warden", desc: "Add/edit/delete students, notices, full oversight" },
  { role: "MESS_COORDINATOR", label: "Mess Incharge", desc: "Edit menu, log wastage, generate AI reports" },
  { role: "ADMIN", label: "Administrator", desc: "Full system administration" },
];

export function Navbar({ onToggleMobileNav, isMobileNavOpen }: NavbarProps) {
  const { user, logout, quickSwitchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isChatActive = location.pathname === "/chat";

  const handleRoleSwitch = async (role: Role) => {
    setIsSwitching(true);
    setRoleDropdownOpen(false);
    await quickSwitchRole(role);
    setIsSwitching(false);
  };

  const getRoleBadgeColor = (role?: Role) => {
    switch (role) {
      case "WARDEN":
      case "ADMIN":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "SUPERVISOR":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "STUDENT_COORDINATOR":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "MESS_COORDINATOR":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
      default:
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-[#23252d] bg-white/90 dark:bg-[#090a0d]/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Left: Brand & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onToggleMobileNav}
              className="rounded-xl p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X size={19} /> : <Menu size={19} />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-400/20 shrink-0">
                <Zap size={17} className="fill-zinc-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                  <span>Campus</span>
                  <span className="text-yellow-500 dark:text-yellow-400">Nest</span>
                  <span className="hidden xs:inline-block rounded-md border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-yellow-600 dark:text-yellow-400">
                    SMART
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Quick Live Chat Pill */}
            <Link
              to="/chat"
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isChatActive
                  ? "border-yellow-400 bg-yellow-400 text-zinc-950 shadow-xs shadow-yellow-400/20"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] text-zinc-700 dark:text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-500"
              }`}
              title="Open Real-time Chat"
            >
              <MessageSquareText size={15} />
              <span className="hidden sm:inline">Live Chat</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Link>

            {/* Desktop-Only Quick Role Switcher Dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                disabled={isSwitching}
                className="flex items-center gap-1.5 rounded-xl border border-yellow-500/40 bg-yellow-500/5 px-2.5 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-yellow-500/10 hover:border-yellow-500 transition-all cursor-pointer"
                title="Click to test different roles instantly"
              >
                <Sparkles size={14} className="text-yellow-500 fill-yellow-500" />
                <span>Role:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {user?.role?.replace("_", " ") || "Select"}
                </span>
                <ChevronDown size={14} className="text-zinc-500" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#111216] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      Switch Test Account
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Test different permissions with 1-click
                    </p>
                  </div>
                  <div className="space-y-1">
                    {ROLES_LIST.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => handleRoleSwitch(r.role)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                          user?.role === r.role
                            ? "bg-yellow-400/15 border border-yellow-400/40 text-yellow-700 dark:text-yellow-400 font-bold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{r.label}</span>
                          {user?.role === r.role && (
                            <span className="text-[10px] font-mono font-bold bg-yellow-400/30 px-1 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {r.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle (Available on both desktop & mobile) */}
            <button
              onClick={toggleTheme}
              className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] text-zinc-700 dark:text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-500 transition-all cursor-pointer shrink-0"
              aria-label="Toggle Theme"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-yellow-400 fill-yellow-400/20" />
              ) : (
                <Moon size={16} className="text-zinc-700" />
              )}
            </button>

            {/* Desktop-Only User Info, Profile Trigger & Sign Out (Collapsed into Drawer on Mobile) */}
            {user && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 rounded-xl p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                  title="Profile & Change Password"
                >
                  <div className="relative h-8 w-8 rounded-xl border border-yellow-500/40 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="font-bold text-xs text-yellow-500">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 max-w-[110px]">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      Settings ⚙️
                    </div>
                  </div>
                </button>

                <div className={`hidden sm:inline-flex border px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </div>

                <button
                  onClick={logout}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all cursor-pointer"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Account Settings & Change Password Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
