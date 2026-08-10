import { Router } from "express";
import { researcherProfileSchema } from "@shared/validation/schemas.js";
import { auth, requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { admin, userClient } from "../lib/supabase.js";

export const researchersRouter = Router();

/**
 * The researcher's own profile. `rating` and `verified` are read-only here: both
 * are assigned by Ethosk from a researcher's track record, and a profile that
 * could mark itself verified would make the badge worthless to respondents.
 */
researchersRouter.get(
  "/profile",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("researcher_profiles")
      .select("user_id, bio, institution, rating, verified, verification_level, verification_status, verification_notes, dob, phone, phone_verified, institutional_email, institutional_email_verified, researcher_type, years_experience, onboarding_completed, social_links")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new ApiError(500, "PROFILE_READ_FAILED", error.message);

    res.json(
      data ?? {
        user_id: context.userId,
        bio: null,
        institution: null,
        rating: null,
        verified: false,
        verification_level: "unverified",
        verification_status: "unrequested",
        verification_notes: null,
        dob: null,
        phone: null,
        phone_verified: false,
        institutional_email: null,
        institutional_email_verified: false,
        researcher_type: null,
        years_experience: null,
        onboarding_completed: false,
        social_links: {},
      },
    );
  }),
);

researchersRouter.post(
  "/profile",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(researcherProfileSchema, req.body);

    // Upsert through the service role: the row is keyed by the authenticated
    // user's own id, and signup may have failed to create it before this build
    // added the insert policy.
    const { data, error } = await admin
      .from("researcher_profiles")
      .upsert(
        {
          user_id: context.userId,
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.institution !== undefined && { institution: input.institution }),
          ...(input.dob !== undefined && { dob: input.dob }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.institutional_email !== undefined && { institutional_email: input.institutional_email }),
          ...(input.researcher_type !== undefined && { researcher_type: input.researcher_type }),
          ...(input.years_experience !== undefined && { years_experience: input.years_experience }),
          ...(input.onboarding_completed !== undefined && { onboarding_completed: input.onboarding_completed }),
          ...(input.social_links !== undefined && { social_links: input.social_links }),
        },
        { onConflict: "user_id" },
      )
      .select("user_id, bio, institution, rating, verified, verification_level, verification_status, verification_notes, dob, phone, phone_verified, institutional_email, institutional_email_verified, researcher_type, years_experience, onboarding_completed, social_links")
      .single();

    if (error) throw new ApiError(500, "PROFILE_SAVE_FAILED", error.message);
    res.json(data);
  }),
);

researchersRouter.post(
  "/request-verification",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    
    // Ensure profile exists and bio/institution are somewhat complete
    const { data: profile } = await admin
      .from("researcher_profiles")
      .select("bio, institution, verification_status")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!profile) {
      throw new ApiError(400, "INCOMPLETE_PROFILE", "Please save your profile first.");
    }
    if (!profile.institution || profile.institution.trim().length === 0) {
      throw new ApiError(400, "INCOMPLETE_PROFILE", "An institution is required to request verification.");
    }

    if (profile.verification_status === "pending" || profile.verification_status === "approved") {
      throw new ApiError(400, "INVALID_STATE", "Verification is already requested or approved.");
    }

    const { error } = await admin
      .from("researcher_profiles")
      .update({ verification_status: "pending" })
      .eq("user_id", context.userId);

    if (error) throw new ApiError(500, "VERIFICATION_REQUEST_FAILED", error.message);
    
    res.json({ success: true, verification_status: "pending" });
  }),
);

// Mock stores for OTPs
const phoneOtpStore = new Map<string, string>();
const emailOtpStore = new Map<string, string>();

researchersRouter.post(
  "/verify-phone/request",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { phone } = req.body;
    if (!phone) throw new ApiError(400, "INVALID_INPUT", "Phone number is required");
    
    // Generate a simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    phoneOtpStore.set(context.userId, otp);
    
    // In a real app, send via SMS. For now, just return it so we can test.
    res.json({ success: true, message: "OTP sent", _dev_otp: otp });
  }),
);

researchersRouter.post(
  "/verify-phone/confirm",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { code } = req.body;
    const storedCode = phoneOtpStore.get(context.userId);
    
    if (!storedCode || storedCode !== code) {
      throw new ApiError(400, "INVALID_CODE", "Invalid or expired verification code");
    }
    
    // Mark as verified in DB
    await admin.from("researcher_profiles").update({ phone_verified: true }).eq("user_id", context.userId);
    phoneOtpStore.delete(context.userId);
    
    res.json({ success: true });
  }),
);

researchersRouter.post(
  "/verify-institutional-email/request",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { email } = req.body;
    if (!email) throw new ApiError(400, "INVALID_INPUT", "Email is required");
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    emailOtpStore.set(context.userId, otp);
    
    res.json({ success: true, message: "OTP sent to institutional email", _dev_otp: otp });
  }),
);

researchersRouter.post(
  "/verify-institutional-email/confirm",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { code } = req.body;
    const storedCode = emailOtpStore.get(context.userId);
    
    if (!storedCode || storedCode !== code) {
      throw new ApiError(400, "INVALID_CODE", "Invalid or expired verification code");
    }
    
    await admin.from("researcher_profiles").update({ institutional_email_verified: true }).eq("user_id", context.userId);
    emailOtpStore.delete(context.userId);
    
    res.json({ success: true });
  }),
);
