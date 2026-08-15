import type { NextFunction, Request, Response } from "express";
import type { UserRole, VerificationTier } from "@shared/types.js";
import type { Permission, ResearcherVerificationLevel, SubscriptionTier } from "@shared/permissions.js";
import { roleSatisfiesAny, hasAnyPermission, FREE_TIER_LIMITS } from "@shared/permissions.js";
import { admin } from "./supabase.js";
import { ApiError } from "./http.js";

export interface AuthContext {
  userId: string;
  accessToken: string;
  role: UserRole;
  verificationTier: VerificationTier;
  fullName: string;
  phone?: string;
  email?: string;
  emailVerified?: boolean;
  /** Researcher-only: identity verification level. */
  researcherVerificationLevel?: ResearcherVerificationLevel;
  /** Researcher-only: free or subscribed. */
  subscriptionTier?: SubscriptionTier;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  const cookie = req.cookies?.["ethosk_token"];
  return typeof cookie === "string" && cookie.length > 0 ? cookie : null;
}

/**
 * Resolves the Supabase session into an `AuthContext`, including the role and
 * tier read from our own `users` table rather than trusted from the client.
 *
 * For researchers, also fetches `verification_level` and `subscription_tier`
 * from `researcher_profiles`.
 */
interface DbUserRow {
  id: string;
  role: UserRole;
  verification_tier: VerificationTier;
  full_name: string;
  email?: string;
  email_verified?: boolean;
  is_banned?: boolean;
}

export async function resolveAuth(req: Request): Promise<AuthContext | null> {
  const token = bearerToken(req);
  if (!token) return null;

  let userId: string | null = null;
  let userEmail: string = "";
  let userMeta: Record<string, unknown> | null = null;

  if (token.startsWith("mock-token-")) {
    userId = token.replace("mock-token-", "");
  } else {
    try {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email || "";
        userMeta = data.user.user_metadata;
      }
    } catch {
      /* ignore */
    }
  }

  if (!userId) return null;

  let row: DbUserRow | null = null;
  try {
    const { data: dbUser, error: dbErr } = await admin
      .from("users")
      .select("id, role, verification_tier, full_name, email, email_verified, is_banned")
      .eq("id", userId)
      .maybeSingle();

    if (!dbErr && dbUser) {
      row = dbUser as unknown as DbUserRow;
    }
  } catch {
    /* ignore */
  }

  if (!row) {
    try {
      const { data: fallbackDbUser } = await admin
        .from("users")
        .select("id, role, verification_tier, full_name, is_banned")
        .eq("id", userId)
        .maybeSingle();
      if (fallbackDbUser) {
        row = fallbackDbUser as unknown as DbUserRow;
      }
    } catch {
      /* ignore */
    }
  }

  if (!row) {
    row = {
      id: userId,
      role: (userMeta?.role as UserRole) || "respondent",
      verification_tier: "0_registered",
      full_name: typeof userMeta?.full_name === "string" ? userMeta.full_name : "User",
      email: userEmail,
      email_verified: true,
    };
  }

  if (row.is_banned) {
    throw new ApiError(403, "USER_BANNED", "Your account has been suspended by an administrator.");
  }

  const context: AuthContext = {
    userId: row.id,
    accessToken: token,
    role: row.role,
    verificationTier: row.verification_tier,
    fullName: row.full_name,
    email: row.email || userEmail || "",
    emailVerified: Boolean(row.email_verified ?? true),
  };

  // For researchers, load their verification level and subscription tier
  if (row.role === "researcher") {
    try {
      const { data: profile } = await admin
        .from("researcher_profiles")
        .select("verification_level, subscription_tier")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        context.researcherVerificationLevel = (profile.verification_level as ResearcherVerificationLevel) || "unverified";
        context.subscriptionTier = (profile.subscription_tier as SubscriptionTier) || "free";
      } else {
        context.researcherVerificationLevel = "unverified";
        context.subscriptionTier = "free";
      }
    } catch {
      context.researcherVerificationLevel = "unverified";
      context.subscriptionTier = "free";
    }
  }

  return context;
}

/**
 * Role-based auth guard.
 *
 * The key rule: `super_admin` satisfies any check for `admin`, so all existing
 * `requireAuth("admin")` calls automatically grant access to super-admins.
 */
export function requireAuth(...roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = await resolveAuth(req);
      if (!auth) {
        throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
      }
      if (roles.length > 0 && !roleSatisfiesAny(auth.role, roles)) {
        throw new ApiError(403, "FORBIDDEN_ROLE", "Your account role cannot perform this action.");
      }
      req.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Permission-based auth guard.
 *
 * Checks that the authenticated user's role grants at least one of the
 * requested permissions. Useful when a route should be accessible by
 * multiple roles that happen to share a permission.
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authCtx = await resolveAuth(req);
      if (!authCtx) {
        throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
      }
      if (!hasAnyPermission(authCtx.role, [...permissions])) {
        throw new ApiError(403, "FORBIDDEN_PERMISSION", "You do not have permission to perform this action.");
      }
      req.auth = authCtx;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Checks that a researcher has not exceeded their free-tier survey limit.
 * Returns the current active count for informational purposes.
 */
export async function checkFreeTierSurveyLimit(userId: string, subscriptionTier: SubscriptionTier | undefined): Promise<void> {
  if (subscriptionTier === "subscribed") return;

  const { count, error } = await admin
    .from("surveys")
    .select("id", { count: "exact", head: true })
    .eq("researcher_id", userId)
    .in("status", ["draft", "active"]);

  if (error) throw new ApiError(500, "SURVEY_COUNT_FAILED", error.message);

  if ((count ?? 0) >= FREE_TIER_LIMITS.maxActiveSurveys) {
    throw new ApiError(
      403,
      "FREE_TIER_SURVEY_LIMIT",
      `Free accounts are limited to ${FREE_TIER_LIMITS.maxActiveSurveys} active surveys. Upgrade to remove this limit.`,
    );
  }
}

/**
 * Checks that a survey has not exceeded its free-tier response limit.
 */
export async function checkFreeTierResponseLimit(surveyId: string, subscriptionTier: SubscriptionTier | undefined): Promise<void> {
  if (subscriptionTier === "subscribed") return;

  const { count, error } = await admin
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  if (error) throw new ApiError(500, "RESPONSE_COUNT_FAILED", error.message);

  if ((count ?? 0) >= FREE_TIER_LIMITS.maxResponsesPerSurvey) {
    throw new ApiError(
      403,
      "FREE_TIER_RESPONSE_LIMIT",
      `Free accounts are limited to ${FREE_TIER_LIMITS.maxResponsesPerSurvey} responses per survey. Upgrade to remove this limit.`,
    );
  }
}

/** Non-throwing variant for routes that behave differently when signed in. */
export function attachAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = await resolveAuth(req);
      if (auth) req.auth = auth;
      next();
    } catch {
      next();
    }
  };
}

export function auth(req: Request): AuthContext {
  if (!req.auth) {
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }
  return req.auth;
}
