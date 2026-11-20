import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { User, Role } from "../types";
import { api } from "../lib/api";

const DEMO_EMAILS: Record<Role, string> = {
  STUDENT: "student@campus.in",
  STUDENT_COORDINATOR: "representative@campus.in",
  SUPERVISOR: "supervisor@campus.in",
  WARDEN: "warden@campus.in",
  MESS_COORDINATOR: "messincharge@campus.in",
  ADMIN: "admin@campus.in",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken"),
  );

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const login = (token: string, nextUser: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("authUser", JSON.stringify(nextUser));
    setAccessToken(token);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setAccessToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (role: Role) => {
    try {
      const email = DEMO_EMAILS[role];
      const res = await api.post("/auth/login", {
        email,
        password: "Pass@123",
      });

      if (res.data?.data) {
        login(res.data.data.accessToken, res.data.data.user);
      }
    } catch {
      // Fallback local session if server is offline
      const mockUser: User = {
        id: `mock-${role.toLowerCase()}`,
        fullName: `Demo ${role.replace("_", " ")}`,
        email: DEMO_EMAILS[role],
        role,
        block: "Block A",
        roomNumber: "Room 101",
      };
      login("demo-token", mockUser);
    }
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      login,
      logout,
      quickSwitchRole,
    }),
    [accessToken, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
