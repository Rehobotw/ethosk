import { Router } from "express";
import { loginSchema, signupSchema } from "@shared/validation/schemas.js";
import { auth, requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { rateLimit } from "../lib/rateLimit.js";
import { admin, signInWithPassword } from "../lib/supabase.js";

import { recordConsentEvent } from "../lib/consent.js";

export const authRouter = Router();

/**
 * Supabase Auth is email-based, so an Ethiopian mobile number is mapped to a
 * deterministic internal address. The phone number remains the user-facing
 * identifier and the unique key on our own `users` table.
 */
function phoneToEmail(phone: string): string {
  const normalized = phone.startsWith("+251") ? `0${phone.slice(4)}` : phone;
  return `${normalized}@phone.ethosk.local`;
}

authRouter.post(
  "/signup",
  rateLimit({ key: "signup", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(signupSchema, req.body);

    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("phone", input.phone)
      .maybeSingle();

    if (existing) {
      throw new ApiError(409, "PHONE_ALREADY_REGISTERED", "That phone number is already registered.");
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: phoneToEmail(input.phone),
      password: input.password,
      email_confirm: true,
      user_metadata: { role: input.role, full_name: input.full_name, phone: input.phone },
    });

    if (createError || !created.user) {
      if (createError?.message.toLowerCase().includes("already")) {
        throw new ApiError(409, "PHONE_ALREADY_REGISTERED", "That phone number is already registered.");
      }
      throw new ApiError(500, "SIGNUP_FAILED", createError?.message ?? "Could not create the account.");
    }

    const { error: rowError } = await admin.from("users").insert({
      id: created.user.id,
      role: input.role,
      full_name: input.full_name,
      phone: input.phone,
      verification_tier: "0_registered",
    });

    if (rowError) {
      // Do not leave an auth user without its application row.
      await admin.auth.admin.deleteUser(created.user.id);
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
        .insert({ user_id: created.user.id });

      if (profileError) {
        // The rest of the app assumes a profile row exists for these roles, so a
        // half-created account is worse than no account.
        await admin.from("users").delete().eq("id", created.user.id);
        await admin.auth.admin.deleteUser(created.user.id);
        throw new ApiError(500, "SIGNUP_FAILED", profileError.message);
      }
    }

    const session = await signInWithPassword(phoneToEmail(input.phone), input.password);

    const accessToken = session.data.session?.access_token ?? null;

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: created.user.id,
        email: phoneToEmail(input.phone),
        role: input.role,
        verification_tier: "0_registered",
        access_token: accessToken,
      },
      user_id: created.user.id,
      role: input.role,
      verification_tier: "0_registered",
      access_token: accessToken,
    });
  }),
);

authRouter.post(
  "/login",
  rateLimit({ key: "login", max: 15, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const input = parseBody(loginSchema, req.body);

    const { data, error } = await signInWithPassword(phoneToEmail(input.phone), input.password);

    if (error || !data.session || !data.user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "That phone number and password do not match.");
    }

    const { data: row } = await admin
      .from("users")
      .select("id, role, verification_tier, full_name, phone")
      .eq("id", data.user.id)
      .single();

    if (!row) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "That phone number and password do not match.");
    }

    // The login screen asks which portal the user wants; refuse a mismatch
    // rather than silently signing them into the other role's experience.
    if (input.role && input.role !== row.role) {
      throw new ApiError(
        403,
        "ROLE_MISMATCH",
        `This account is registered as a ${row.role}. Switch tabs to sign in.`,
      );
    }

    res.json({
      user_id: row.id,
      role: row.role,
      verification_tier: row.verification_tier,
      full_name: row.full_name,
      phone: row.phone,
      access_token: data.session.access_token,
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
      phone: context.phone,
    });
  }),
);

authRouter.delete(
  "/account",
  requireAuth(),
  rateLimit({ key: "account-deletion", max: 3, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const userId = context.userId;

    // Log the data erasure request consent event (Proclamation 1321/2024 compliance)
    await recordConsentEvent(userId, "data_erasure_request", {
      requested_at: new Date().toISOString(),
      role: context.role,
    });

    // Delete user profile rows and database record (cascades to profiles and docs)
    const { error: dbError } = await admin.from("users").delete().eq("id", userId);
    if (dbError) {
      throw new ApiError(500, "ACCOUNT_DELETION_FAILED", dbError.message);
    }

    // Delete user from Supabase Auth admin API
    await admin.auth.admin.deleteUser(userId);

    res.json({
      success: true,
      message: "Your account and personal data have been permanently deleted.",
    });
  }),
);
