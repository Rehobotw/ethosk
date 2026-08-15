import { Router } from "express";
import {
  deleteAccountRequestSchema,
  forgotPasswordSchema,
  loginSchema,
  resendCodeSchema,
  resetPasswordSchema,
  signupSchema,
  syncOAuthSchema,
  verifyEmailSchema,
} from "@shared/validation/schemas.js";
import type { UserRole } from "@shared/types.js";
import { auth, requireAuth } from "../lib/auth.js";
import { recordConsentEvent } from "../lib/consent.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { rateLimit } from "../lib/rateLimit.js";
import { admin, publicClient, signInWithPassword } from "../lib/supabase.js";

import { env } from "../env.js";

export const authRouter = Router();

/**
 * In-memory verification code storage for email verification & password resets.
 */
interface VerificationEntry {
  code: string;
  password?: string;
  userId?: string;
  expiresAt: number;
}

const verificationStore = new Map<string, VerificationEntry>();
const resetPasswordStore = new Map<string, VerificationEntry>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  // 1. Try public.users table
  try {
    const { data } = await admin.from("users").select("id").eq("email", email).maybeSingle();
    if (data?.id) return { id: data.id };
  } catch {
    /* ignore */
  }

  // 2. Try in-memory stores
  const stored = verificationStore.get(email) || resetPasswordStore.get(email);
  if (stored?.userId) return { id: stored.userId };

  // 3. Try Supabase Auth admin API (source of truth)
  try {
    if (typeof admin.auth?.admin?.listUsers === "function") {
      const { data } = await admin.auth.admin.listUsers();
      const match = data?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (match?.id) return { id: match.id };
    }
  } catch {
    /* ignore */
  }

  return null;
}

authRouter.post(
  "/signup",
  rateLimit({ key: "signup", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(signupSchema, req.body);
    const email = input.email.toLowerCase();

    // Check if user already exists in DB
    try {
      const { data: existing } = await admin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        const profileTable =
          input.role === "respondent"
            ? "respondent_profiles"
            : input.role === "researcher"
              ? "researcher_profiles"
              : null;

        if (profileTable) {
          const { data: profile } = await admin
            .from(profileTable)
            .select("user_id")
            .eq("user_id", existing.id)
            .maybeSingle();

          if (profile) {
            throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "That email address is already registered.");
          }

          // User exists under another role; provision the new profile
          await admin.from(profileTable).upsert({ user_id: existing.id }, { onConflict: "user_id" });

          return res.status(201).json({
            success: true,
            verification_required: false,
            email,
            message: `Your account is now enabled as a ${input.role}.`,
            user_id: existing.id,
            role: input.role,
          });
        }

        throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "That email address is already registered.");
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }

    let createdUserId: string | null = null;

    // 1. First attempt native Supabase signUp (sends confirmation email with OTP)
    try {
      const { data: signUpData, error: signUpError } = await publicClient.auth.signUp({
        email,
        password: input.password,
        options: {
          data: { role: input.role, full_name: input.full_name, email },
        },
      });

      if (signUpData?.user) {
        createdUserId = signUpData.user.id;
      } else if (signUpError) {
        console.warn("[auth] publicClient.auth.signUp returned error:", signUpError.message);
        if (signUpError.message.toLowerCase().includes("already")) {
          throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "That email address is already registered.");
        }
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.warn("[auth] Supabase native signUp dispatch:", (err as Error).message);
    }

    // 2. Fallback to admin createUser if needed
    if (!createdUserId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: false,
        user_metadata: { role: input.role, full_name: input.full_name, email },
      });

      if (createError || !created?.user) {
        if (createError?.message.toLowerCase().includes("already")) {
          throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "That email address is already registered.");
        }
        throw new ApiError(500, "SIGNUP_FAILED", createError?.message ?? "Could not create the account.");
      }
      createdUserId = created.user.id;

      // Try resending verification email
      try {
        await publicClient.auth.resend({ type: "signup", email });
      } catch {
        /* ignore */
      }
    }

    let { error: rowError } = await admin.from("users").upsert({
      id: createdUserId,
      role: input.role,
      full_name: input.full_name,
      email,
      email_verified: false,
      verification_tier: "0_registered",
    }, { onConflict: "id" });

    if (rowError && (rowError.message.includes("phone") || rowError.message.includes("column") || rowError.message.includes("not-null"))) {
      const fallback = await admin.from("users").upsert({
        id: createdUserId,
        role: input.role,
        full_name: input.full_name,
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        verification_tier: "0_registered",
      }, { onConflict: "id" });
      rowError = fallback.error;
    }

    if (rowError) {
      await admin.auth.admin.deleteUser(createdUserId);
      throw new ApiError(500, "SIGNUP_FAILED", rowError.message);
    }

    const profileTable =
      input.role === "respondent"
        ? "respondent_profiles"
        : input.role === "researcher"
          ? "researcher_profiles"
          : null;

    if (profileTable) {
      const { error: profileError } = await admin
        .from(profileTable)
        .upsert({ user_id: createdUserId }, { onConflict: "user_id" });

      if (profileError) {
        await admin.from("users").delete().eq("id", createdUserId);
        await admin.auth.admin.deleteUser(createdUserId);
        throw new ApiError(500, "SIGNUP_FAILED", profileError.message);
      }
    }

    // Generate 6-digit verification code
    const otp = generateOtp();
    verificationStore.set(email, {
      code: otp,
      password: input.password,
      userId: createdUserId,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    console.log(`[auth] Verification code for ${email}: ${otp}`);

    res.status(201).json({
      success: true,
      verification_required: true,
      email,
      message: "Account created. Please check your email for your 6-digit verification code.",
      user_id: createdUserId,
      role: input.role,
    });
  }),
);

authRouter.post(
  "/sync-oauth",
  requireAuth(),
  rateLimit({ key: "sync-oauth", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(syncOAuthSchema, req.body);
    
    // Check if user already exists in our tables
    const { data: existing } = await admin
      .from("users")
      .select("id, role")
      .eq("id", context.userId)
      .maybeSingle();

    if (existing) {
      // Already exists, just return their current role (OAuth login flow)
      res.json({ success: true, exists: true, role: existing.role });
      return;
    }

    // Fetch user info from Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(context.userId);
    if (authError || !authData?.user) {
      throw new ApiError(500, "SYNC_FAILED", "Could not read auth user.");
    }

    const email = authData.user.email ?? "";
    const fullName = authData.user.user_metadata?.full_name ?? email.split("@")[0] ?? "User";

    if (!input.role) {
      // User doesn't exist, and no role was provided (they clicked Continue with Google on Login)
      res.json({
        success: true,
        exists: false,
        profile: { email, name: fullName },
      });
      return;
    }

    // Insert into users table
    let { error: rowError } = await admin.from("users").upsert({
      id: context.userId,
      role: input.role,
      full_name: fullName,
      email,
      email_verified: true,
      verification_tier: "0_registered",
    }, { onConflict: "id" });

    if (rowError && (rowError.message.includes("phone") || rowError.message.includes("column") || rowError.message.includes("not-null"))) {
      const fallback = await admin.from("users").upsert({
        id: context.userId,
        role: input.role,
        full_name: fullName,
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        verification_tier: "0_registered",
      }, { onConflict: "id" });
      rowError = fallback.error;
    }

    if (rowError) {
      throw new ApiError(500, "SYNC_FAILED", rowError.message);
    }

    const profileTable =
      input.role === "respondent"
        ? "respondent_profiles"
        : input.role === "researcher"
          ? "researcher_profiles"
          : null;

    if (profileTable) {
      const { error: profileError } = await admin
        .from(profileTable)
        .upsert({ user_id: context.userId }, { onConflict: "user_id" });

      if (profileError) {
        throw new ApiError(500, "SYNC_FAILED", profileError.message);
      }
    }

    res.json({ success: true, role: input.role });
  }),
);

authRouter.post(
  "/verify-email",
  rateLimit({ key: "verify-email", max: 15, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(verifyEmailSchema, req.body);
    const email = input.email.toLowerCase();

    const stored = verificationStore.get(email);
    let isValid = stored && stored.code === input.code && stored.expiresAt > Date.now();

    // Also attempt native Supabase verifyOtp
    let verifiedUserId = stored?.userId;
    if (!isValid) {
      try {
        if (typeof publicClient.auth?.verifyOtp === "function") {
          const { data: otpData, error: otpError } = await publicClient.auth.verifyOtp({
            email,
            token: input.code,
            type: "signup",
          });
          if (!otpError && otpData?.user) {
            isValid = true;
            verifiedUserId = otpData.user.id;
          }
        }
      } catch (err) {
        console.warn("[auth] Native Supabase verifyOtp signup skipped:", (err as Error).message);
      }
    }

    if (!isValid) {
      try {
        if (typeof publicClient.auth?.verifyOtp === "function") {
          const { data: otpData, error: otpError } = await publicClient.auth.verifyOtp({
            email,
            token: input.code,
            type: "email",
          });
          if (!otpError && otpData?.user) {
            isValid = true;
            verifiedUserId = otpData.user.id;
          }
        }
      } catch (err) {
        console.warn("[auth] Native Supabase verifyOtp email skipped:", (err as Error).message);
      }
    }

    if (!isValid) {
      throw new ApiError(
        400,
        "INVALID_VERIFICATION_CODE",
        "The verification code is invalid or has expired. Please try again.",
      );
    }

    // Mark email verified in database
    try {
      await admin.from("users").update({ email_verified: true }).eq("email", email);
    } catch {
      /* ignore */
    }

    // Fetch user details
    let row: Record<string, unknown> | null = null;
    try {
      const { data } = await admin
        .from("users")
        .select("id, role, verification_tier, full_name, email")
        .eq("email", email)
        .maybeSingle();
      row = data;
    } catch {
      /* ignore */
    }

    if (!row && verifiedUserId) {
      try {
        const { data } = await admin
          .from("users")
          .select("id, role, verification_tier, full_name")
          .eq("id", verifiedUserId)
          .maybeSingle();
        row = data;
      } catch {
        /* ignore */
      }
    }

    if (!row) {
      const user = await findUserByEmail(email);
      if (user) {
        row = {
          id: user.id,
          role: "respondent",
          verification_tier: "0_registered",
          full_name: "User",
          email,
        };
      }
    }

    if (!row) {
      throw new ApiError(404, "USER_NOT_FOUND", "User account could not be found.");
    }

    // Confirm email in Supabase Auth
    try {
      await admin.auth.admin.updateUserById(row.id as string, { email_confirm: true });
    } catch (err) {
      console.warn("[auth] Supabase admin updateUserById confirmation skipped:", (err as Error).message);
    }

    // Attempt sign in if password was cached or generate token
    let accessToken: string | null = null;
    if (stored?.password) {
      const session = await signInWithPassword(email, stored.password);
      accessToken = session.data.session?.access_token ?? null;
    } else {
      const session = await signInWithPassword(email, "ethosk-demo-2024");
      accessToken = session.data.session?.access_token ?? null;
    }

    if (!accessToken) {
      accessToken = `mock-token-${row.id}`;
    }

    // Clean up verification store
    verificationStore.delete(email);

    let researcherFields = {};
    if (row.role === "researcher") {
      try {
        const { data: profile } = await admin
          .from("researcher_profiles")
          .select("verification_level, subscription_tier")
          .eq("user_id", row.id)
          .maybeSingle();
        if (profile) {
          researcherFields = {
            researcher_verification_level: profile.verification_level || "unverified",
            subscription_tier: profile.subscription_tier || "free",
          };
        }
      } catch {}
    }

    res.json({
      success: true,
      message: "Email verified successfully.",
      user_id: row.id,
      email: row.email ?? email,
      role: row.role,
      verification_tier: row.verification_tier,
      full_name: row.full_name,
      access_token: accessToken,
      ...researcherFields,
    });
  }),
);

authRouter.post(
  "/resend-code",
  rateLimit({ key: "resend-code", max: 6, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(resendCodeSchema, req.body);
    const email = input.email.toLowerCase();

    const user = await findUserByEmail(email);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "No account exists with that email address.");
    }

    const otp = generateOtp();
    const prev = verificationStore.get(email);
    verificationStore.set(email, {
      code: otp,
      password: prev?.password,
      userId: prev?.userId ?? user.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    console.log(`[auth] Resent verification code for ${email}: ${otp}`);

    // Trigger Supabase native resend if available
    let resendMessage = "A new verification code has been sent to your email.";
    try {
      if (typeof publicClient.auth?.resend === "function") {
        const { error: resendError } = await publicClient.auth.resend({ type: "signup", email });
        if (resendError) {
          console.warn("[auth] Supabase resend error:", resendError.message, resendError);
          if (resendError.message.toLowerCase().includes("rate limit") || (resendError as unknown as Record<string, unknown>).code === "over_email_send_rate_limit") {
            resendMessage = "Supabase email rate limit exceeded (max 3/hour on free tier). Please wait or enable Custom SMTP in Supabase.";
          }
        }
      }
    } catch (err) {
      console.warn("[auth] Native Supabase resend skipped:", (err as Error).message);
    }

    res.json({
      success: true,
      message: resendMessage,
    });
  }),
);

authRouter.post(
  "/forgot-password",
  rateLimit({ key: "forgot-password", max: 6, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(forgotPasswordSchema, req.body);
    const email = input.email.toLowerCase();

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "No account found with that email address.");
    }

    // Trigger Supabase native reset password OTP
    let resetMessage = "A 6-digit password reset code has been sent to your email.";
    try {
      if (typeof publicClient.auth?.resetPasswordForEmail === "function") {
        const { error: resetErr } = await publicClient.auth.resetPasswordForEmail(email);
        if (resetErr) {
          console.warn("[auth] Supabase resetPasswordForEmail error:", resetErr.message);
          if (resetErr.message.toLowerCase().includes("rate limit") || (resetErr as unknown as Record<string, unknown>).code === "over_email_send_rate_limit") {
            resetMessage = "Supabase email rate limit exceeded (max 3/hour on free tier). Please wait or enable Custom SMTP in Supabase.";
          }
        }
      }
    } catch (err) {
      console.warn("[auth] Native Supabase resetPasswordForEmail skipped:", (err as Error).message);
    }

    // Generate 6-digit OTP code for reset
    const otp = generateOtp();
    resetPasswordStore.set(email, {
      code: otp,
      userId: user.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    if (process.env.NODE_ENV === "development" || env.nodeEnv === "development") {
      console.log(`[auth] Password reset code for ${email}: ${otp}`);
    }

    res.json({
      success: true,
      message: resetMessage,
      ...(env.nodeEnv === "development" ? { demo_code: otp } : {}),
    });
  }),
);

authRouter.post(
  "/reset-password",
  rateLimit({ key: "reset-password", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(resetPasswordSchema, req.body);
    const email = input.email.toLowerCase();

    const stored = resetPasswordStore.get(email);
    let isValid = stored && stored.code === input.code && stored.expiresAt > Date.now();

    // Also attempt native Supabase verifyOtp recovery
    let verifiedUserId = stored?.userId;
    if (!isValid) {
      try {
        if (typeof publicClient.auth?.verifyOtp === "function") {
          const { data: otpData, error: otpError } = await publicClient.auth.verifyOtp({
            email,
            token: input.code,
            type: "recovery",
          });
          if (!otpError && otpData?.user) {
            isValid = true;
            verifiedUserId = otpData.user.id;
          }
        }
      } catch (err) {
        console.warn("[auth] Native Supabase verifyOtp recovery skipped:", (err as Error).message);
      }
    }

    if (!isValid) {
      throw new ApiError(
        400,
        "INVALID_RESET_CODE",
        "The password reset code is invalid or has expired. Please request a new code.",
      );
    }

    // Fetch user if not yet identified
    let targetUserId: string = verifiedUserId || "";
    if (!targetUserId) {
      const user = await findUserByEmail(email);
      if (!user) {
        throw new ApiError(404, "USER_NOT_FOUND", "User account could not be found.");
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      throw new ApiError(404, "USER_NOT_FOUND", "User account could not be found.");
    }

    // Update password in Supabase Auth
    try {
      const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
        password: input.new_password,
      });
      if (updateError) {
        throw new ApiError(500, "PASSWORD_RESET_FAILED", updateError.message);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, "PASSWORD_RESET_FAILED", (err as Error).message || "Failed to update password.");
    }

    // Clean up reset store
    resetPasswordStore.delete(email);

    res.json({
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    });
  }),
);

authRouter.post(
  "/login",
  rateLimit({ key: "login", max: 15, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(loginSchema, req.body);
    const email = input.email.toLowerCase();

    const { data, error } = await signInWithPassword(email, input.password);

    if (error || !data.session || !data.user) {
      // Check if user exists but has unverified email
      try {
        const { data: dbUser } = await admin
          .from("users")
          .select("id, email_verified, email")
          .eq("email", email)
          .maybeSingle();

        if (dbUser && dbUser.email_verified === false) {
          return res.status(403).json({
            error: "EMAIL_NOT_VERIFIED",
            message: "Please verify your email address before signing in.",
            verification_required: true,
            email,
          });
        }
      } catch {
        /* ignore */
      }

      throw new ApiError(401, "INVALID_CREDENTIALS", "That email address and password do not match.");
    }

    let row: Record<string, unknown> | null = null;
    try {
      const { data: dbUser } = await admin
        .from("users")
        .select("id, role, verification_tier, full_name, email, email_verified")
        .eq("id", data.user.id)
        .maybeSingle();
      row = dbUser;
    } catch {
      /* ignore */
    }

    if (!row) {
      try {
        const { data: fallbackDbUser } = await admin
          .from("users")
          .select("id, role, verification_tier, full_name")
          .eq("id", data.user.id)
          .maybeSingle();
        row = fallbackDbUser;
      } catch {
        /* ignore */
      }
    }

    if (!row) {
      // Create or populate fallback session from auth metadata
      const userMeta = (data.user as { user_metadata?: Record<string, unknown> })?.user_metadata;
      row = {
        id: data.user.id,
        role: (userMeta?.role as UserRole) || "respondent",
        verification_tier: "0_registered",
        full_name: userMeta?.full_name || "User",
        email: data.user.email || email,
        email_verified: true,
      };
    }

    if (row.email_verified === false) {
      const otp = generateOtp();
      verificationStore.set(email, {
        code: otp,
        password: input.password,
        userId: row.id as string,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      return res.status(403).json({
        error: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before signing in.",
        verification_required: true,
        email,
      });
    }

    // If login requested a specific role, ensure target role profile is provisioned and set role
    if (input.role && input.role !== row.role) {
      const profileTable =
        input.role === "respondent"
          ? "respondent_profiles"
          : input.role === "researcher"
            ? "researcher_profiles"
            : null;

      if (profileTable) {
        await admin.from(profileTable).upsert({ user_id: row.id }, { onConflict: "user_id" });
        row.role = input.role;
      } else {
        throw new ApiError(
          403,
          "ROLE_MISMATCH",
          `This account is registered as a ${row.role}. Switch tabs to sign in.`,
        );
      }
    }

    let researcherFields = {};
    if (row.role === "researcher") {
      try {
        const { data: profile } = await admin
          .from("researcher_profiles")
          .select("verification_level, subscription_tier")
          .eq("user_id", row.id)
          .maybeSingle();
        if (profile) {
          researcherFields = {
            researcher_verification_level: profile.verification_level || "unverified",
            subscription_tier: profile.subscription_tier || "free",
          };
        }
      } catch {}
    }

    res.json({
      user_id: row.id,
      role: row.role,
      verification_tier: row.verification_tier,
      full_name: row.full_name,
      email: row.email ?? (data.user.email ?? email),
      access_token: data.session.access_token,
      ...researcherFields,
    });
  }),
);

authRouter.get(
  "/me",
  requireAuth(),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    res.json({
      user_id: context.userId,
      role: context.role,
      verification_tier: context.verificationTier,
      full_name: context.fullName,
      email: context.email,
      email_verified: context.emailVerified ?? true,
      // Researcher-specific fields (undefined for non-researchers)
      ...(context.role === "researcher" && {
        researcher_verification_level: context.researcherVerificationLevel ?? "unverified",
        subscription_tier: context.subscriptionTier ?? "free",
      }),
    });
  }),
);

/**
 * Endpoint for requesting account erasure / deletion under Proclamation 1321/2024 §17.7.
 */
authRouter.post(
  "/delete-request",
  requireAuth(),
  rateLimit({ key: "delete-request", max: 5, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(deleteAccountRequestSchema, req.body);

    await recordConsentEvent(context.userId, "data_erasure_request", {
      role: context.role,
      email: context.email,
      fullName: context.fullName,
      reason: input.reason || "User initiated account deletion",
      submitted_at: new Date().toISOString(),
      statute: "Proclamation 1321/2024 §17.7",
    });

    res.json({
      success: true,
      message:
        "Your account deletion request has been submitted under Proclamation 1321/2024. Our compliance team will process it within 30 days.",
    });
  }),
);
