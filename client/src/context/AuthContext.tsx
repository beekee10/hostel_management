import { createContext } from "react";
import type { User, Role } from "../types";

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  quickSwitchRole: (role: Role) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
