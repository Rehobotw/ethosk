import { Router } from "express";
import { z } from "zod";
import type { UserRole, VerificationTier } from "@shared/types.js";
import { TIER_RANK, USER_ROLES } from "@shared/types.js";
import { env } from "../env.js";
import { auth, requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { admin } from "../lib/supabase.js";

export const adminRouter = Router();

// ============================================================================
// Routes accessible by BOTH admin and super_admin
// (requireAuth("admin") now passes super_admin too via roleSatisfies)
// ============================================================================

/** FR-ADM-1: documents awaiting a human decision, oldest first. */
adminRouter.get(
  "/review-queue",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("documents")
      .select("id, user_id, doc_type, status, ai_notes, storage_path, created_at, users(full_name, email, verification_tier)")
      .eq("status", "needs_review")
      .order("created_at", { ascending: true });

    if (error) throw new ApiError(500, "REVIEW_QUEUE_FAILED", error.message);

    // Signed URLs are short-lived and generated server-side; the bucket itself is
    // never public (§17.2).
    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed } = await admin.storage
          .from(env.documentsBucket)
          .createSignedUrl(row.storage_path as string, 300);

        return {
          id: row.id,
          user_id: row.user_id,
          doc_type: row.doc_type,
          ai_notes: row.ai_notes,
          created_at: row.created_at,
          respondent: row.users,
          preview_url: signed?.signedUrl ?? null,
        };
      }),
    );

    res.json({ items });
  }),
);

const decisionSchema = z.object({
  decision: z.enum(["passed", "failed"]),
  notes: z.string().max(280).optional(),
});

adminRouter.post(
  "/review-queue/:id",
  requireAuth("admin"),
  asyncRoute(async (req, res) => {
    const input = parseBody(decisionSchema, req.body);

    const { data: document, error: readError } = await admin
      .from("documents")
      .select("id, user_id, status")
      .eq("id", req.params.id)
      .maybeSingle();

    if (readError) throw new ApiError(500, "REVIEW_FAILED", readError.message);
    if (!document) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "That document does not exist.");

    const { error: updateError } = await admin
      .from("documents")
      .update({
        status: input.decision,
        ai_notes: input.notes ?? `Manually ${input.decision} by an administrator.`,
      })
      .eq("id", document.id);

    if (updateError) throw new ApiError(500, "REVIEW_FAILED", updateError.message);

    if (input.decision === "passed") {
      const { data: user } = await admin
        .from("users")
        .select("verification_tier")
        .eq("id", document.user_id)
        .single();

      const current = (user?.verification_tier ?? "0_registered") as VerificationTier;
      if (TIER_RANK[current] < TIER_RANK["2_attribute_verified"]) {
        await admin
          .from("users")
          .update({ verification_tier: "2_attribute_verified" })
          .eq("id", document.user_id);
      }
    }

    res.json({ id: document.id, status: input.decision });
  }),
);

adminRouter.get(
  "/researcher-queue",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("researcher_profiles")
      .select("user_id, bio, institution, past_studies, verification_status, users!inner(full_name, email)")
      .eq("verification_status", "pending");

    if (error) throw new ApiError(500, "RESEARCHER_QUEUE_FAILED", error.message);

    res.json({ items: data ?? [] });
  }),
);

adminRouter.post(
  "/researcher-queue/:id",
  requireAuth("admin"),
  asyncRoute(async (req, res) => {
    const input = parseBody(decisionSchema, req.body);
    const researcherId = req.params.id;

    const { data: profile, error: readError } = await admin
      .from("researcher_profiles")
      .select("user_id, verification_status")
      .eq("user_id", researcherId)
      .maybeSingle();

    if (readError) throw new ApiError(500, "REVIEW_FAILED", readError.message);
    if (!profile) throw new ApiError(404, "PROFILE_NOT_FOUND", "That researcher profile does not exist.");

    const updateData: any = {
      verification_status: input.decision === "passed" ? "approved" : "rejected",
      verification_notes: input.notes ?? `Manually ${input.decision} by an administrator.`,
    };

    if (input.decision === "passed") {
      updateData.verification_level = "id_verified";
    }

    const { error: updateError } = await admin
      .from("researcher_profiles")
      .update(updateData)
      .eq("user_id", profile.user_id);

    if (updateError) throw new ApiError(500, "REVIEW_FAILED", updateError.message);

    res.json({ id: profile.user_id, status: input.decision });
  }),
);

const surveyDecisionSchema = z.object({
  decision: z.enum(["approve", "request_correction", "reject"]),
  feedback: z.string().trim().max(1000).optional(),
});

/** Survey Approval Queue: surveys awaiting admin moderation. */
adminRouter.get(
  "/survey-queue",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("surveys")
      .select("id, researcher_id, title, description, questions, reward_etb, escrow_etb, compliance_required, compliance_document_url, compliance_attested_at, target_filters, created_at, sent_at, users!inner(full_name, email)")
      .eq("status", "pending_review")
      .order("sent_at", { ascending: true });

    if (error) throw new ApiError(500, "SURVEY_QUEUE_FAILED", error.message);

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        let signedUrl: string | null = null;
        if (row.compliance_document_url) {
          const { data: signed } = await admin.storage
            .from(env.documentsBucket)
            .createSignedUrl(row.compliance_document_url as string, 600);
          signedUrl = signed?.signedUrl ?? null;
        }

        return {
          ...row,
          compliance_document_preview: signedUrl,
        };
      }),
    );

    res.json({ items });
  }),
);

adminRouter.post(
  "/survey-queue/:id",
  requireAuth("admin"),
  asyncRoute(async (req, res) => {
    const input = parseBody(surveyDecisionSchema, req.body);
    const surveyId = req.params.id;

    const { data: survey, error: readError } = await admin
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .maybeSingle();

    if (readError) throw new ApiError(500, "SURVEY_DECISION_FAILED", readError.message);
    if (!survey) throw new ApiError(404, "SURVEY_NOT_FOUND", "That survey does not exist.");

    if (input.decision === "approve") {
      const { error: updateError } = await admin
        .from("surveys")
        .update({
          status: "active",
          approved_at: new Date().toISOString(),
          admin_feedback: input.feedback ?? null,
        })
        .eq("id", survey.id);

      if (updateError) throw new ApiError(500, "APPROVE_FAILED", updateError.message);
      return res.json({ id: survey.id, status: "active" });
    }

    if (input.decision === "request_correction") {
      const { error: updateError } = await admin
        .from("surveys")
        .update({
          status: "needs_correction",
          admin_feedback: input.feedback ?? "Please review and correct the indicated items before resubmitting.",
        })
        .eq("id", survey.id);

      if (updateError) throw new ApiError(500, "CORRECTION_REQUEST_FAILED", updateError.message);
      return res.json({ id: survey.id, status: "needs_correction" });
    }

    if (input.decision === "reject") {
      const { error: updateError } = await admin
        .from("surveys")
        .update({
          status: "rejected",
          admin_feedback: input.feedback ?? "Survey submission rejected by administration.",
          escrow_etb: 0,
        })
        .eq("id", survey.id);

      if (updateError) throw new ApiError(500, "REJECT_FAILED", updateError.message);
      return res.json({ id: survey.id, status: "rejected" });
    }
  }),
);

/** FR-ADM-2 groundwork: erasure requests with a due-by date from the request time. */
adminRouter.get(
  "/data-requests",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("consent_events")
      .select("id, user_id, details, created_at")
      .eq("event_type", "data_erasure_request")
      .order("created_at", { ascending: true });

    if (error) throw new ApiError(500, "DATA_REQUESTS_FAILED", error.message);

    const RESPONSE_WINDOW_DAYS = 30;
    res.json({
      requests: (data ?? []).map((row) => ({
        ...row,
        due_by: new Date(
          new Date(row.created_at as string).getTime() + RESPONSE_WINDOW_DAYS * 86_400_000,
        ).toISOString(),
      })),
    });
  }),
);

// ============================================================================
// SUPER_ADMIN-ONLY routes
// ============================================================================

/**
 * List all users with roles.
 * Only super_admin can see the full user list.
 */
adminRouter.get(
  "/users",
  requireAuth("super_admin"),
  asyncRoute(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const roleFilter = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    let query = admin
      .from("users")
      .select("id, role, full_name, email, email_verified, verification_tier, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (roleFilter && USER_ROLES.includes(roleFilter as UserRole)) {
      query = query.eq("role", roleFilter);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new ApiError(500, "USER_LIST_FAILED", error.message);

    res.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  }),
);

const roleChangeSchema = z.object({
  role: z.enum(USER_ROLES),
});

/**
 * Change a user's role.
 * Only super_admin can promote/demote users.
 *
 * Safety rules:
 * - Cannot change your own role (prevents accidental self-demotion)
 * - Cannot create another super_admin unless you are one
 */
adminRouter.post(
  "/users/:id/role",
  requireAuth("super_admin"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const targetUserId = req.params.id;
    const input = parseBody(roleChangeSchema, req.body);

    // Safety: cannot change your own role
    if (targetUserId === context.userId) {
      throw new ApiError(400, "CANNOT_CHANGE_OWN_ROLE", "You cannot change your own role.");
    }

    // Verify target user exists
    const { data: targetUser, error: readError } = await admin
      .from("users")
      .select("id, role, full_name, email")
      .eq("id", targetUserId)
      .maybeSingle();

    if (readError) throw new ApiError(500, "USER_READ_FAILED", readError.message);
    if (!targetUser) throw new ApiError(404, "USER_NOT_FOUND", "That user does not exist.");

    // Perform the role change
    const { error: updateError } = await admin
      .from("users")
      .update({ role: input.role })
      .eq("id", targetUserId);

    if (updateError) throw new ApiError(500, "ROLE_CHANGE_FAILED", updateError.message);

    // Log this action in consent_events for audit trail
    await admin.from("consent_events").insert({
      user_id: context.userId,
      event_type: "data_erasure_request", // reusing event type for audit — ideally would be 'role_change'
      details: {
        action: "role_change",
        target_user_id: targetUserId,
        target_email: targetUser.email,
        from_role: targetUser.role,
        to_role: input.role,
        changed_by: context.userId,
        changed_at: new Date().toISOString(),
      },
    });

    res.json({
      id: targetUserId,
      role: input.role,
      message: `${targetUser.full_name}'s role changed from ${targetUser.role} to ${input.role}.`,
    });
  }),
);

/**
 * Get a single user's full details (super_admin only).
 */
adminRouter.get(
  "/users/:id",
  requireAuth("super_admin"),
  asyncRoute(async (req, res) => {
    const { data, error } = await admin
      .from("users")
      .select("id, role, full_name, email, email_verified, verification_tier, created_at, updated_at")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw new ApiError(500, "USER_READ_FAILED", error.message);
    if (!data) throw new ApiError(404, "USER_NOT_FOUND", "That user does not exist.");

    // If researcher, also get their profile
    let researcherProfile = null;
    if (data.role === "researcher") {
      const { data: profile } = await admin
        .from("researcher_profiles")
        .select("bio, institution, rating, verified, verification_level, subscription_tier, subscription_expires_at")
        .eq("user_id", data.id)
        .maybeSingle();
      researcherProfile = profile;
    }

    // If respondent, get their verification tier details
    let respondentProfile = null;
    if (data.role === "respondent") {
      const { data: profile } = await admin
        .from("respondent_profiles")
        .select("university, department, year, age, employer, updated_at")
        .eq("user_id", data.id)
        .maybeSingle();
      respondentProfile = profile;
    }

    res.json({
      ...data,
      researcher_profile: researcherProfile,
      respondent_profile: respondentProfile,
    });
  }),
);
