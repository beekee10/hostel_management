import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import type { Role } from "../../types";
import { ProfileModal } from "../profile/ProfileModal";
import {
  LayoutDashboard,
  BellRing,
  AlertTriangle,
  Flame,
  UtensilsCrossed,
  MessageSquareText,
  Users,
  Calendar,
  X,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES_LIST: Array<{ role: Role; label: string; desc: string }> = [
  { role: "STUDENT", label: "Student", desc: "Tickets, topics, chat, reviews" },
  { role: "STUDENT_COORDINATOR", label: "Student Representative", desc: "Notices, mess menu, complaints" },
  { role: "SUPERVISOR", label: "Hostel Supervisor", desc: "Add students, notices, AI summary" },
  { role: "WARDEN", label: "Hostel Warden", desc: "Full management, notices, oversight" },
  { role: "MESS_COORDINATOR", label: "Mess Incharge", desc: "Menu, log wastage, AI reports" },
  { role: "ADMIN", label: "Administrator", desc: "Full system administration" },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, logout, quickSwitchRole } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const isStaffOrAdmin =
    user?.role === "SUPERVISOR" ||
    user?.role === "WARDEN" ||
    user?.role === "ADMIN" ||
    user?.role === "STUDENT_COORDINATOR";

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/notices", label: "Notice Board", icon: BellRing },
    { to: "/events", label: "Campus Events", icon: Calendar },
    { to: "/complaints", label: "Concerns & Triage", icon: AlertTriangle },
    { to: "/community", label: "Hot Topics & Maggi", icon: Flame },
    { to: "/mess", label: "Mess & Wastage", icon: UtensilsCrossed },
    { to: "/chat", label: "Real-time Chat", icon: MessageSquareText },
  ];

  if (isStaffOrAdmin) {
    navItems.push({ to: "/students", label: "Student Directory", icon: Users });
  }

  // 5 Primary bottom navigation items
  const bottomNavItems = [
    { to: "/", label: "Home", icon: LayoutDashboard },
    { to: "/notices", label: "Notices", icon: BellRing },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/complaints", label: "Concerns", icon: AlertTriangle },
    { to: "/chat", label: "Chat", icon: MessageSquareText },
  ];

  const handleRoleSwitch = async (role: Role) => {
    setRoleSwitcherOpen(false);
    await quickSwitchRole(role);
    onClose();
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  const openProfile = () => {
    setIsProfileOpen(true);
  };

  return (
    <>
      {/* Mobile Drawer (When hamburger opened) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#111216] p-5 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-left duration-200 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Campus</span>
                  <span className="text-yellow-500">Nest</span>
                  <span className="rounded bg-yellow-400/20 px-1 py-0.2 font-mono text-[9px] font-bold text-yellow-600 dark:text-yellow-400">
                    SMART
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User Profile Card (Collapsed from top navbar) */}
              {user && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18191f] p-3.5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-xl border border-yellow-400/50 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="font-bold text-sm text-yellow-500">
                          {user.fullName?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[9px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 px-1.5 py-0.2 rounded">
                          {user.role}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {user.block || "Block A"} · {user.roomNumber || "Main"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Settings Trigger Button */}
                  <button
                    onClick={openProfile}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-yellow-400/50 transition-colors cursor-pointer"
                  >
                    <Settings size={13} className="text-yellow-500" />
                    <span>Account Settings & Password</span>
                  </button>
                </div>
              )}

              {/* Mobile Role Switcher */}
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-2.5">
                <button
                  onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                    <Sparkles size={13} className="fill-yellow-400" />
                    <span>Switch Test Role</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-zinc-400 transition-transform ${roleSwitcherOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {roleSwitcherOpen && (
                  <div className="mt-2 space-y-1 pt-2 border-t border-yellow-500/20 max-h-48 overflow-y-auto pr-1">
                    {ROLES_LIST.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => handleRoleSwitch(r.role)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          user?.role === r.role
                            ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 font-bold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span>{r.label}</span>
                        {user?.role === r.role && (
                          <span className="text-[9px] font-mono font-bold bg-yellow-400/30 px-1 rounded">
                            ACTIVE
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Links List */}
              <nav className="space-y-1">
                <p className="px-2 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                  Menu Navigation
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 border border-yellow-400/40 font-semibold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Drawer Footer: Sign Out Button & Version */}
            <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>

              <p className="text-[10px] text-zinc-400 font-mono text-center">
                CampusNest Smart Hostel v2.0
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-[#23252d] bg-white/95 dark:bg-[#090a0d]/95 backdrop-blur-md md:hidden px-2 py-1.5 flex justify-around items-center shadow-lg">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[54px] rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "text-yellow-500 font-bold bg-yellow-400/10"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`
              }
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Change Password Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
