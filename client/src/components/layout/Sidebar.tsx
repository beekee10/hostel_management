import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  LayoutDashboard,
  BellRing,
  AlertTriangle,
  Flame,
  UtensilsCrossed,
  MessageSquareText,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();

  const isStaffOrAdmin =
    user?.role === "SUPERVISOR" ||
    user?.role === "WARDEN" ||
    user?.role === "ADMIN" ||
    user?.role === "STUDENT_COORDINATOR";

  const navItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      to: "/notices",
      label: "Notice Board",
      icon: BellRing,
      badge: "Power Cuts",
    },
    {
      to: "/events",
      label: "Campus Events",
      icon: Calendar,
      badge: "Activities",
    },
    {
      to: "/complaints",
      label: "Concerns & AI Triage",
      icon: AlertTriangle,
      badge: "AI Active",
    },
    {
      to: "/community",
      label: "Hot Topics & Maggi",
      icon: Flame,
      badge: "Peer Help",
    },
    {
      to: "/mess",
      label: "Mess & Food Wastage",
      icon: UtensilsCrossed,
      badge: "AI Report",
    },
    {
      to: "/chat",
      label: "Real-time Chat",
      icon: MessageSquareText,
      badge: "Live",
    },
  ];

  if (isStaffOrAdmin) {
    navItems.push({
      to: "/students",
      label: "Student Directory",
      icon: Users,
      badge: user?.role === "SUPERVISOR" ? "Add Only" : "Manage",
    });
  }

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-zinc-200 dark:border-[#23252d] bg-white/50 dark:bg-[#090a0d]/50 p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-mono font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
            Navigation
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border border-yellow-400/30 shadow-xs shadow-yellow-400/10 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={
                            isActive
                              ? "text-yellow-500"
                              : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"
                          }
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                            isActive
                              ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* AI Features Badge Panel */}
        <div className="rounded-xl border border-yellow-500/20 bg-linear-to-b from-yellow-500/5 to-transparent p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            <Sparkles size={14} className="fill-yellow-400" />
            <span>Gemini AI Connected</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Automatic complaint triage, supervisor problem cluster grouping, Reddit topic sizing, and mess food wastage analytics.
          </p>
        </div>
      </div>

      {/* Role Footer Info */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 px-1 text-[11px] text-zinc-500">
        <div className="flex items-center justify-between font-mono">
          <span>HOSTEL-SYS</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
}
