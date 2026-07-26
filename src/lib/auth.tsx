import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserRole, VerificationTier } from "@shared/types";
import type { LoginInput, SignupInput } from "@shared/validation/schemas";
import { api, getToken, setToken } from "./api";

export interface SessionUser {
  user_id: string;
  role: UserRole;
  verification_tier: VerificationTier;
  full_name: string;
  phone: string;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  signup: (input: SignupInput) => Promise<SessionUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<SessionUser>("/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const result = await api<SessionUser & { access_token: string }>("/auth/login", {
      body: input,
    });
    setToken(result.access_token);
    const session: SessionUser = {
      user_id: result.user_id,
      role: result.role,
      verification_tier: result.verification_tier,
      full_name: result.full_name,
      phone: result.phone,
    };
    setUser(session);
    return session;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await api<{
      user_id: string;
      role: UserRole;
      verification_tier: VerificationTier;
      access_token: string | null;
    }>("/auth/signup", { body: input });

    if (result.access_token) setToken(result.access_token);
    const session: SessionUser = {
      user_id: result.user_id,
      role: result.role,
      verification_tier: result.verification_tier,
      full_name: input.full_name,
      phone: input.phone,
    };
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, signup, logout, refresh }),
    [user, loading, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

/** Where each role lands after signing in. */
export function homePathForRole(role: UserRole): string {
  switch (role) {
    case "researcher":
      return "/researcher";
    case "admin":
      return "/admin/review-queue";
    case "respondent":
    default:
      return "/inbox";
  }
}
