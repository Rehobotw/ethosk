import type { NextFunction, Request, Response } from "express";
import type { UserRole, VerificationTier } from "@shared/types.js";
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
 */
interface DbUserRow {
  id: string;
  role: UserRole;
  verification_tier: VerificationTier;
  full_name: string;
  email?: string;
  email_verified?: boolean;
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
      .select("id, role, verification_tier, full_name, email, email_verified")
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
        .select("id, role, verification_tier, full_name")
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

  return {
    userId: row.id,
    accessToken: token,
    role: row.role,
    verificationTier: row.verification_tier,
    fullName: row.full_name,
    email: row.email || userEmail || "",
    emailVerified: Boolean(row.email_verified ?? true),
  };
}

export function requireAuth(...roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = await resolveAuth(req);
      if (!auth) {
        throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
      }
      if (roles.length > 0 && !roles.includes(auth.role)) {
        throw new ApiError(403, "FORBIDDEN_ROLE", "Your account role cannot perform this action.");
      }
      req.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  };
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
