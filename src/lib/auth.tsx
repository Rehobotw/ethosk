import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  UserRole,
  VerificationTier,
  ResearcherVerificationLevel,
  SubscriptionTier,
} from "@shared/types";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResendCodeInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "@shared/validation/schemas";
import { api, getToken, setToken } from "./api";

export interface SessionUser {
  user_id: string;
  role: UserRole;
  verification_tier: VerificationTier;
  full_name: string;
  email: string;
  email_verified?: boolean;
  /** Researcher-only: identity verification level. */
  researcher_verification_level?: ResearcherVerificationLevel;
  /** Researcher-only: free or subscribed. */
  subscription_tier?: SubscriptionTier;
  /** Researcher-only: when the subscription expires. */
  subscription_expires_at?: string | null;
}

export interface SignupResult {
  success: boolean;
  verification_required?: boolean;
  email: string;
  message?: string;
  user_id?: string;
  role?: UserRole;
}

export interface VerifyResult {
  success: boolean;
  message?: string;
  user_id: string;
  email: string;
  role: UserRole;
  verification_tier: VerificationTier;
  full_name: string;
  access_token: string;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  signup: (input: SignupInput) => Promise<SignupResult>;
  verifyEmail: (input: VerifyEmailInput) => Promise<SessionUser>;
  resendCode: (input: ResendCodeInput) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<{ success: boolean; message: string }>;
  resetPassword: (input: ResetPasswordInput) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

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
      email: result.email || input.email,
      email_verified: result.email_verified ?? true,
      researcher_verification_level: (result as any).researcher_verification_level,
      subscription_tier: (result as any).subscription_tier,
      subscription_expires_at: (result as any).subscription_expires_at,
    };
    setUser(session);
    return session;
  }, []);

  const signup = useCallback(async (input: SignupInput): Promise<SignupResult> => {
    const result = await api<SignupResult>("/auth/signup", { body: input });
    return result;
  }, []);

  const verifyEmail = useCallback(async (input: VerifyEmailInput) => {
    const result = await api<VerifyResult>("/auth/verify-email", { body: input });
    if (result.access_token) {
      setToken(result.access_token);
    }
    const session: SessionUser = {
      user_id: result.user_id,
      role: result.role,
      verification_tier: result.verification_tier,
      full_name: result.full_name,
      email: result.email,
      email_verified: true,
    };
    setUser(session);
    return session;
  }, []);

  const resendCode = useCallback(async (input: ResendCodeInput) => {
    return await api<{ success: boolean; message: string }>("/auth/resend-code", {
      body: input,
    });
  }, []);

  const forgotPassword = useCallback(async (input: ForgotPasswordInput) => {
    return await api<{ success: boolean; message: string }>("/auth/forgot-password", {
      body: input,
    });
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    return await api<{ success: boolean; message: string }>("/auth/reset-password", {
      body: input,
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login,
      signup,
      verifyEmail,
      resendCode,
      forgotPassword,
      resetPassword,
      logout,
      refresh,
    }),
    [
      user,
      loading,
      login,
      signup,
      verifyEmail,
      resendCode,
      forgotPassword,
      resetPassword,
      logout,
      refresh,
    ],
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
    case "super_admin":
      return "/admin";
    case "respondent":
    default:
      return "/inbox";
  }
}

/** Check if a given route path is permitted for the user's role. */
export function isPathAllowedForRole(pathname: string | null | undefined, role: UserRole): boolean {
  if (!pathname || pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/auth")) {
    return true;
  }

  // Normalize path
  const cleanPath = pathname.split(/[?#]/, 1)[0] ?? "/";

  if (role === "respondent") {
    // Respondents must not access researcher or admin portals
    if (
      cleanPath.startsWith("/researcher") ||
      cleanPath.startsWith("/survey-builder") ||
      cleanPath.startsWith("/survey-posting") ||
      cleanPath.startsWith("/subscription") ||
      cleanPath.startsWith("/admin")
    ) {
      return false;
    }
    return true;
  }

  if (role === "researcher") {
    // Researchers must not access respondent-only dashboard pages or admin portals
    if (
      cleanPath === "/inbox" ||
      cleanPath === "/history" ||
      cleanPath.startsWith("/respondent/onboarding") ||
      cleanPath.startsWith("/admin")
    ) {
      return false;
    }
    return true;
  }

  if (role === "admin") {
    if (
      cleanPath === "/admin/users" ||
      cleanPath === "/admin/revenue" ||
      cleanPath === "/admin/settings"
    ) {
      return false;
    }
    return true;
  }

  if (role === "super_admin") {
    return true;
  }

  return true;
}
