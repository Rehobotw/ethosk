import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserRole, VerificationTier } from "@shared/types";
import type { LoginInput, SignupInput } from "@shared/validation/schemas";
import { ApiRequestError, api, getToken, setToken } from "./api";

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

interface SignupResponse {
  success?: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    verification_tier: VerificationTier;
    access_token: string | null;
  };
  user_id?: string;
  role?: UserRole;
  verification_tier?: VerificationTier;
  access_token?: string | null;
}

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
    const result = await api<SignupResponse>("/auth/signup", { body: input });

    const userId = result.user?.id ?? result.user_id;
    const role = result.user?.role ?? result.role ?? input.role;
    const verificationTier = result.user?.verification_tier ?? result.verification_tier ?? "0_registered";
    const accessToken = result.user?.access_token ?? result.access_token ?? null;

    if (!userId) {
      throw new ApiRequestError(
        502,
        "EMPTY_RESPONSE",
        "The server created the account but returned no user details. Please try logging in if the account already exists.",
      );
    }

    if (accessToken) setToken(accessToken);
    const session: SessionUser = {
      user_id: userId,
      role,
      verification_tier: verificationTier,
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
