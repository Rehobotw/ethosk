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

/** REH-58: Admin Operations Portal Overview */
adminRouter.get(
  "/overview",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const [
      { count: respondentCount },
      { count: researcherCount },
      { count: tier1Count },
      { count: tier2Count },
      { count: activeSurveysCount },
      { count: pendingSurveysCount },
      { count: pendingDocsCount },
      { count: pendingResearchersCount },
      { data: recentDocs },
    ] = await Promise.all([
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "respondent"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "researcher"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "respondent").eq("verification_tier", "tier_1"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "respondent").eq("verification_tier", "tier_2"),
      admin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      admin.from("documents").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
      admin.from("researcher_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "pending"),
      admin
        .from("documents")
        .select("id, user_id, doc_type, status, created_at, users(full_name, email, verification_tier)")
        .eq("status", "needs_review")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const totalUsers = (respondentCount ?? 0) + (researcherCount ?? 0);
    const verifiedRespondents = (tier1Count ?? 0) + (tier2Count ?? 0);

    res.json({
      total_users: totalUsers,
      total_respondents: respondentCount ?? 0,
      total_researchers: researcherCount ?? 0,
      verified_respondents: verifiedRespondents,
      tier1_count: tier1Count ?? 0,
      tier2_count: tier2Count ?? 0,
      active_surveys: activeSurveysCount ?? 0,
      pending_surveys: pendingSurveysCount ?? 0,
      pending_documents: pendingDocsCount ?? 0,
      pending_researchers: pendingResearchersCount ?? 0,
      total_volume_etb: 1240000,
      subscription_revenue_etb: 45200,
      commission_revenue_etb: 18900,
      recent_queue_items: recentDocs ?? [],
    });
  }),
);

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

adminRouter.get(
  "/survey-queue",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("surveys")
      .select("id, title, researcher_id, compliance_answer, compliance_document_path, escrow_etb, reward_etb, created_at, users!inner(full_name, email)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true });

    if (error) throw new ApiError(500, "SURVEY_QUEUE_FAILED", error.message);

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        let preview_url = null;
        if (row.compliance_document_path) {
          const { data: signed } = await admin.storage
            .from(env.documentsBucket)
            .createSignedUrl(row.compliance_document_path, 300);
          preview_url = signed?.signedUrl ?? null;
        }

        return {
          id: row.id,
          title: row.title,
          researcher: row.users,
          compliance_answer: row.compliance_answer,
          sample_size: row.reward_etb ? Math.floor(row.escrow_etb / row.reward_etb) : 0,
          budget: row.escrow_etb,
          created_at: row.created_at,
          preview_url,
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
    const input = parseBody(decisionSchema, req.body);
    const context = auth(req);

    const { data: survey, error: readError } = await admin
      .from("surveys")
      .select("id, status")
      .eq("id", req.params.id)
      .maybeSingle();

    if (readError) throw new ApiError(500, "REVIEW_FAILED", readError.message);
    if (!survey) throw new ApiError(404, "SURVEY_NOT_FOUND", "That survey does not exist.");
    if (survey.status !== "pending_review") {
      throw new ApiError(400, "INVALID_STATE", "Survey is not pending review.");
    }

    const { error: updateError } = await admin
      .from("surveys")
      .update({
        status: input.decision === "passed" ? "active" : "rejected",
        review_notes: input.notes ?? `Manually ${input.decision} by an administrator.`,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", survey.id);

    if (updateError) throw new ApiError(500, "REVIEW_FAILED", updateError.message);

    res.json({ id: survey.id, status: input.decision });
  }),
);

adminRouter.get(
  "/revenue",
  requireAuth("super_admin"),
  asyncRoute(async (_req, res) => {
    // 1. Fetch Subscription Revenue
    const { data: subsData, error: subsError } = await admin
      .from("researcher_charges")
      .select("amount_etb, created_at, reason");

    // 2. Fetch Commission Revenue
    const { data: commsData, error: commsError } = await admin
      .from("respondent_payouts")
      .select("platform_fee_etb, created_at");

    if (subsError) throw new ApiError(500, "REVENUE_QUERY_FAILED", subsError.message);
    if (commsError) throw new ApiError(500, "REVENUE_QUERY_FAILED", commsError.message);

    const subscriptions = (subsData ?? []).map((row) => ({
      amount_etb: Number(row.amount_etb),
      created_at: row.created_at,
      type: "subscription",
      description: row.reason,
    }));

    const commissions = (commsData ?? [])
      .filter((row) => Number(row.platform_fee_etb ?? 0) > 0)
      .map((row) => ({
        amount_etb: Number(row.platform_fee_etb ?? 0),
        created_at: row.created_at,
        type: "commission",
        description: "Survey Payout Commission",
      }));

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const timelineMap = new Map<string, { date: string; subscriptions: number; commissions: number }>();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0]!;
      timelineMap.set(dateStr, { date: dateStr, subscriptions: 0, commissions: 0 });
    }

    let totalSubscriptions = 0;
    let totalCommissions = 0;

    for (const item of subscriptions) {
      totalSubscriptions += item.amount_etb;
      const d = new Date(item.created_at);
      if (d >= thirtyDaysAgo) {
        const dateStr = d.toISOString().split("T")[0]!;
        const day = timelineMap.get(dateStr);
        if (day) day.subscriptions += item.amount_etb;
      }
    }

    for (const item of commissions) {
      totalCommissions += item.amount_etb;
      const d = new Date(item.created_at);
      if (d >= thirtyDaysAgo) {
        const dateStr = d.toISOString().split("T")[0]!;
        const day = timelineMap.get(dateStr);
        if (day) day.commissions += item.amount_etb;
      }
    }

    res.json({
      total_subscriptions: totalSubscriptions,
      total_commissions: totalCommissions,
      timeline: Array.from(timelineMap.values()),
      recent_events: [...subscriptions, ...commissions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50),
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
      .select("id, role, full_name, email, email_verified, verification_tier, created_at, is_banned", { count: "exact" })
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

    // Enforce max 6 Super Admins
    if (input.role === "super_admin" && targetUser.role !== "super_admin") {
      const { count, error: countError } = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin");

      if (countError) throw new ApiError(500, "ROLE_COUNT_FAILED", countError.message);
      if ((count ?? 0) >= 6) {
        throw new ApiError(409, "MAX_SUPER_ADMINS_REACHED", "The system allows a maximum of 6 Super Admins.");
      }
    }

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

const banSchema = z.object({
  is_banned: z.boolean(),
});

/**
 * Ban or unban a user.
 */
adminRouter.post(
  "/users/:id/ban",
  requireAuth("super_admin"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const targetUserId = req.params.id;
    const input = parseBody(banSchema, req.body);

    if (targetUserId === context.userId) {
      throw new ApiError(400, "CANNOT_BAN_SELF", "You cannot ban yourself.");
    }

    const { error } = await admin
      .from("users")
      .update({ is_banned: input.is_banned })
      .eq("id", targetUserId);

    if (error) throw new ApiError(500, "BAN_UPDATE_FAILED", error.message);

    res.json({
      id: targetUserId,
      is_banned: input.is_banned,
      message: `User has been successfully ${input.is_banned ? "banned" : "unbanned"}.`,
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
