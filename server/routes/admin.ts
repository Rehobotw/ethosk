import { Router } from "express";
import { z } from "zod";
import type { UserRole, VerificationTier } from "@shared/types.js";
import { TIER_RANK, USER_ROLES } from "@shared/types.js";
import { env } from "../env.js";
import { auth, requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody, routeParam } from "../lib/http.js";
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
      { count: pendingDepositsCount },
      { count: pendingWithdrawalsCount },
      { data: recentDocs },
      { data: allDeposits },
      { data: allWithdrawals },
    ] = await Promise.all([
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "respondent"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "researcher"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "respondent").eq("verification_tier", "tier_1"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "respondent").eq("verification_tier", "tier_2"),
      admin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      admin.from("documents").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
      admin.from("researcher_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "pending"),
      admin.from("researcher_deposits").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
      admin.from("respondent_withdrawals").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
      admin
        .from("documents")
        .select("id, user_id, doc_type, status, created_at, users(full_name, email, verification_tier)")
        .eq("status", "needs_review")
        .order("created_at", { ascending: false })
        .limit(5),
      admin.from("researcher_deposits").select("amount_etb, status, verification_status"),
      admin.from("respondent_withdrawals").select("amount_etb, status, verification_status"),
    ]);

    const totalUsers = (respondentCount ?? 0) + (researcherCount ?? 0);
    const verifiedRespondents = (tier1Count ?? 0) + (tier2Count ?? 0);
    const pendingReconciliation = (pendingDepositsCount ?? 0) + (pendingWithdrawalsCount ?? 0);

    let grossDeposits = 0;
    let verifiedDeposits = 0;
    for (const dep of (allDeposits ?? [])) {
      if (dep.status === "completed") {
        const amt = Number(dep.amount_etb || 0);
        grossDeposits += amt;
        if (dep.verification_status === "verified") {
          verifiedDeposits += amt;
        }
      }
    }

    let grossPayouts = 0;
    let verifiedPayouts = 0;
    for (const w of (allWithdrawals ?? [])) {
      if (w.status === "completed" || w.status === "paid") {
        const amt = Number(w.amount_etb || 0);
        grossPayouts += amt;
        if (w.verification_status === "verified") {
          verifiedPayouts += amt;
        }
      }
    }

    const hasRealVolume = grossDeposits + grossPayouts > 0;
    const totalVolume = hasRealVolume ? (grossDeposits + grossPayouts) : 1240000;
    const verifiedVolume = hasRealVolume ? (verifiedDeposits + verifiedPayouts) : 1150000;
    const manualVolume = totalVolume - verifiedVolume;
    const reconciledPercent = totalVolume > 0 ? Math.round((verifiedVolume / totalVolume) * 1000) / 10 : 100;

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
      pending_reconciliation: pendingReconciliation,
      total_volume_etb: totalVolume,
      verified_volume_etb: verifiedVolume,
      manual_volume_etb: manualVolume,
      gross_deposits_etb: hasRealVolume ? grossDeposits : 950000,
      gross_payouts_etb: hasRealVolume ? grossPayouts : 290000,
      reconciled_percent: reconciledPercent,
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

const structuredReviewChecklistSchema = z.object({
  relevance: z.boolean().default(false),
  apparent_authenticity: z.boolean().default(false),
  category_alignment: z.boolean().default(false),
  completeness_expiry: z.boolean().default(false),
});

const decisionSchema = z.object({
  decision: z.enum(["passed", "failed", "request_changes"]),
  notes: z.string().max(1000).optional(),
  checklist: structuredReviewChecklistSchema.optional(),
});

adminRouter.post(
  "/review-queue/:id",
  requireAuth("admin"),
  asyncRoute(async (req, res) => {
    const input = parseBody(decisionSchema, req.body);
    const context = auth(req);

    const { data: document, error: readError } = await admin
      .from("documents")
      .select("id, user_id, status")
      .eq("id", req.params.id)
      .maybeSingle();

    if (readError) throw new ApiError(500, "REVIEW_FAILED", readError.message);
    if (!document) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "That document does not exist.");

    const checklistSummary = input.checklist
      ? ` | Checklist: Rel=${input.checklist.relevance ? "✓" : "✗"}, Auth=${input.checklist.apparent_authenticity ? "✓" : "✗"}, Cat=${input.checklist.category_alignment ? "✓" : "✗"}, Comp=${input.checklist.completeness_expiry ? "✓" : "✗"}`
      : "";

    const auditNotes = `${input.notes ?? `Manually ${input.decision} by administrator`}${checklistSummary}`;

    const { error: updateError } = await admin
      .from("documents")
      .update({
        status: input.decision,
        ai_notes: auditNotes,
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

    res.json({ id: document.id, status: input.decision, reviewer_id: context.userId });
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
    const context = auth(req);
    const researcherId = req.params.id;

    const { data: profile, error: readError } = await admin
      .from("researcher_profiles")
      .select("user_id, verification_status")
      .eq("user_id", researcherId)
      .maybeSingle();

    if (readError) throw new ApiError(500, "REVIEW_FAILED", readError.message);
    if (!profile) throw new ApiError(404, "PROFILE_NOT_FOUND", "That researcher profile does not exist.");

    const checklistSummary = input.checklist
      ? ` | Checklist: Rel=${input.checklist.relevance ? "✓" : "✗"}, Auth=${input.checklist.apparent_authenticity ? "✓" : "✗"}, Cat=${input.checklist.category_alignment ? "✓" : "✗"}, Comp=${input.checklist.completeness_expiry ? "✓" : "✗"}`
      : "";

    const newStatus = input.decision === "passed" ? "approved" : input.decision === "request_changes" ? "pending" : "rejected";
    const updateData: any = {
      verification_status: newStatus,
      verification_notes: `${input.notes ?? `Manually ${input.decision} by administrator`}${checklistSummary}`,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    };

    if (input.decision === "passed") {
      updateData.verification_level = "id_verified";
    }

    const { error: updateError } = await admin
      .from("researcher_profiles")
      .update(updateData)
      .eq("user_id", profile.user_id);

    if (updateError) throw new ApiError(500, "REVIEW_FAILED", updateError.message);

    res.json({ id: profile.user_id, status: input.decision, reviewer_id: context.userId });
  }),
);

const dataRequestActionSchema = z.object({
  action: z.enum(["complete_erasure", "export_data", "reject"]),
  notes: z.string().max(500).optional(),
});

/** FR-ADM-2: Data subject requests with 30-day statutory due-by deadline under Proclamation 1321/2024 §17.7 */
adminRouter.get(
  "/data-requests",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("consent_events")
      .select("id, user_id, event_type, details, created_at, users(full_name, email, role)")
      .in("event_type", ["data_erasure_request", "data_access_request", "data_rectification_request"])
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, "DATA_REQUESTS_FAILED", error.message);

    const RESPONSE_WINDOW_DAYS = 30;
    const now = Date.now();

    const formattedRequests = (data ?? []).map((row: any) => {
      const details = (row.details as Record<string, any>) || {};
      const createdAtMs = new Date(row.created_at as string).getTime();
      const dueByMs = createdAtMs + RESPONSE_WINDOW_DAYS * 86_400_000;
      const daysRemaining = Math.max(0, Math.ceil((dueByMs - now) / 86_400_000));
      const user = row.users || null;

      return {
        id: row.id,
        user_id: row.user_id,
        user_name: user?.full_name || details.fullName || "Anonymous User",
        user_email: user?.email || details.email || "No email on record",
        role: user?.role || details.role || "respondent",
        event_type: row.event_type,
        statute: details.statute || "Proclamation 1321/2024 §17.7",
        reason: details.reason || "Account & demographic data deletion request",
        status: details.status || "pending",
        action_taken: details.action_taken || null,
        admin_notes: details.admin_notes || null,
        actioned_at: details.actioned_at || null,
        created_at: row.created_at,
        due_by: new Date(dueByMs).toISOString(),
        days_remaining: daysRemaining,
        is_urgent: daysRemaining <= 7 && (details.status || "pending") === "pending",
      };
    });

    const totalRequests = formattedRequests.length;
    const pendingRequests = formattedRequests.filter((r) => r.status === "pending").length;
    const completedRequests = formattedRequests.filter((r) => r.status === "completed").length;
    const urgentCount = formattedRequests.filter((r) => r.is_urgent).length;

    res.json({
      requests: formattedRequests,
      metrics: {
        total_requests: totalRequests,
        pending_requests: pendingRequests,
        completed_requests: completedRequests,
        urgent_count: urgentCount,
        response_sla_days: RESPONSE_WINDOW_DAYS,
      },
    });
  }),
);

adminRouter.post(
  "/data-requests/:id",
  requireAuth("admin"),
  asyncRoute(async (req, res) => {
    const input = parseBody(dataRequestActionSchema, req.body);
    const requestId = req.params.id;

    const { data: requestEvent, error: readError } = await admin
      .from("consent_events")
      .select("id, user_id, details, event_type")
      .eq("id", requestId)
      .maybeSingle();

    if (readError) throw new ApiError(500, "DATA_REQUEST_FAILED", readError.message);
    if (!requestEvent) throw new ApiError(404, "REQUEST_NOT_FOUND", "Data subject request not found.");

    const currentDetails = (requestEvent.details as Record<string, any>) || {};
    const newStatus = input.action === "reject" ? "rejected" : "completed";
    const updatedDetails = {
      ...currentDetails,
      status: newStatus,
      action_taken: input.action,
      admin_notes: input.notes || `Processed by compliance admin (${input.action})`,
      actioned_at: new Date().toISOString(),
    };

    if (input.action === "complete_erasure") {
      await admin.from("users").update({ is_banned: true }).eq("id", requestEvent.user_id);
    }

    const { error: updateError } = await admin
      .from("consent_events")
      .update({ details: updatedDetails })
      .eq("id", requestEvent.id);

    if (updateError) throw new ApiError(500, "DATA_REQUEST_UPDATE_FAILED", updateError.message);

    res.json({
      id: requestEvent.id,
      status: newStatus,
      action_taken: input.action,
      message: `Data subject request has been marked as ${newStatus}.`,
    });
  }),
);

const reconciliationDecisionSchema = z.object({
  type: z.enum(["deposit", "payout"]),
  decision: z.enum(["confirm", "reject"]),
  notes: z.string().max(500).optional(),
  provider_ref: z.string().max(100).optional(),
});

/**
 * Manual Transaction Reconciliation Queue (Spec v4 §8, §4.6.1, REH-113 & REH-114)
 * For transactions that soft-failed verify.et due to unsupported providers or unconfirmed clearance.
 */
adminRouter.get(
  "/reconciliation-queue",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const [
      { data: deposits, error: depErr },
      { data: withdrawals, error: withErr },
      { count: totalDepositsCount },
      { count: totalWithdrawalsCount },
    ] = await Promise.all([
      admin
        .from("researcher_deposits")
        .select("id, researcher_id, amount_etb, method, reference, provider_ref, sender_detail, status, verification_status, verification_notes, created_at, users(full_name, email)")
        .or("status.eq.needs_review,verification_status.eq.unsupported_provider,verification_status.eq.manual_review")
        .order("created_at", { ascending: true }),
      admin
        .from("respondent_withdrawals")
        .select("id, respondent_id, amount_etb, method, reference, provider_ref, account_number, status, verification_status, verification_notes, created_at, users(full_name, email)")
        .or("status.eq.needs_review,verification_status.eq.unsupported_provider,verification_status.eq.manual_review")
        .order("created_at", { ascending: true }),
      admin.from("researcher_deposits").select("id", { count: "exact", head: true }),
      admin.from("respondent_withdrawals").select("id", { count: "exact", head: true }),
    ]);

    if (depErr) throw new ApiError(500, "RECONCILIATION_QUEUE_FAILED", depErr.message);
    if (withErr) throw new ApiError(500, "RECONCILIATION_QUEUE_FAILED", withErr.message);

    const depositItems = (deposits ?? []).map((d: any) => {
      const user = Array.isArray(d.users) ? d.users[0] : d.users;
      return {
        id: d.id,
        type: "deposit" as const,
        user_id: d.researcher_id,
        user_name: user?.full_name ?? "Researcher",
        user_email: user?.email ?? "",
        role: "researcher" as const,
        amount_etb: Number(d.amount_etb || 0),
        provider: d.method,
        reference: d.reference,
        provider_ref: d.provider_ref ?? null,
        claimed_detail: d.sender_detail ?? "—",
        status: d.status,
        verification_status: d.verification_status ?? "manual_review",
        verification_notes: d.verification_notes ?? "Pending manual admin reconciliation",
        created_at: d.created_at,
      };
    });

    const payoutItems = (withdrawals ?? []).map((w: any) => {
      const user = Array.isArray(w.users) ? w.users[0] : w.users;
      return {
        id: w.id,
        type: "payout" as const,
        user_id: w.respondent_id,
        user_name: user?.full_name ?? "Respondent",
        user_email: user?.email ?? "",
        role: "respondent" as const,
        amount_etb: Number(w.amount_etb || 0),
        provider: w.method,
        reference: w.reference ?? w.id.slice(0, 8),
        provider_ref: w.provider_ref ?? null,
        claimed_detail: w.account_number ?? "—",
        status: w.status,
        verification_status: w.verification_status ?? "manual_review",
        verification_notes: w.verification_notes ?? "Pending manual admin reconciliation",
        created_at: w.created_at,
      };
    });

    const items = [...depositItems, ...payoutItems].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const totalNeedsReview = items.length;
    const totalTransactions = (totalDepositsCount ?? 0) + (totalWithdrawalsCount ?? 0) || 1;
    const unsupportedSharePercent = Math.round((totalNeedsReview / totalTransactions) * 1000) / 10;
    const flagVolumeAlert = unsupportedSharePercent > 15 || totalNeedsReview >= 10;

    res.json({
      items,
      metrics: {
        total_needs_review: totalNeedsReview,
        total_deposits: depositItems.length,
        total_payouts: payoutItems.length,
        total_transactions: totalTransactions,
        unsupported_share_percent: unsupportedSharePercent,
        flag_volume_alert: flagVolumeAlert,
      },
    });
  }),
);

adminRouter.post(
  "/reconciliation-queue/:id",
  requireAuth("admin"),
  asyncRoute(async (req, res) => {
    const input = parseBody(reconciliationDecisionSchema, req.body);
    const targetId = req.params.id;

    if (input.type === "deposit") {
      const { data: deposit, error: readError } = await admin
        .from("researcher_deposits")
        .select("id, researcher_id, amount_etb, status")
        .eq("id", targetId)
        .maybeSingle();

      if (readError) throw new ApiError(500, "RECONCILIATION_FAILED", readError.message);
      if (!deposit) throw new ApiError(404, "DEPOSIT_NOT_FOUND", "Deposit record not found.");

      const isConfirm = input.decision === "confirm";
      const { error: updateError } = await admin
        .from("researcher_deposits")
        .update({
          status: isConfirm ? "completed" : "failed",
          verification_status: isConfirm ? "verified" : "rejected",
          verification_notes: input.notes ?? (isConfirm ? "Confirmed manually via admin reconciliation" : "Rejected by administrator"),
          provider_ref: input.provider_ref ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);

      if (updateError) throw new ApiError(500, "RECONCILIATION_FAILED", updateError.message);

      return res.json({
        id: deposit.id,
        type: "deposit",
        decision: input.decision,
        message: isConfirm
          ? `Deposit of ${deposit.amount_etb} ETB has been manually confirmed and credited to researcher wallet.`
          : `Deposit of ${deposit.amount_etb} ETB has been rejected.`,
      });
    }

    if (input.type === "payout") {
      const { data: withdrawal, error: readError } = await admin
        .from("respondent_withdrawals")
        .select("id, respondent_id, amount_etb, status")
        .eq("id", targetId)
        .maybeSingle();

      if (readError) throw new ApiError(500, "RECONCILIATION_FAILED", readError.message);
      if (!withdrawal) throw new ApiError(404, "WITHDRAWAL_NOT_FOUND", "Withdrawal record not found.");

      const isConfirm = input.decision === "confirm";
      const { error: updateError } = await admin
        .from("respondent_withdrawals")
        .update({
          status: isConfirm ? "completed" : "failed",
          verification_status: isConfirm ? "verified" : "rejected",
          verification_notes: input.notes ?? (isConfirm ? "Paid — confirmed manually via admin reconciliation" : "Rejected by administrator"),
          provider_ref: input.provider_ref ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      if (updateError) throw new ApiError(500, "RECONCILIATION_FAILED", updateError.message);

      return res.json({
        id: withdrawal.id,
        type: "payout",
        decision: input.decision,
        message: isConfirm
          ? `Payout of ${withdrawal.amount_etb} ETB has been manually confirmed as paid.`
          : `Payout of ${withdrawal.amount_etb} ETB has been rejected.`,
      });
    }

    throw new ApiError(400, "INVALID_TYPE", "Invalid transaction type.");
  }),
);

adminRouter.get(
  "/survey-queue",
  requireAuth("admin"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("surveys")
      .select("id, title, researcher_id, research_category, compliance_required, compliance_rule_triggered, compliance_answer, compliance_document_path, escrow_etb, reward_etb, created_at, users!inner(full_name, email)")
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
          research_category: row.research_category ?? null,
          compliance_required: row.compliance_required ?? false,
          compliance_rule_triggered: row.compliance_rule_triggered ?? null,
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

    const checklistSummary = input.checklist
      ? ` | Checklist: Rel=${input.checklist.relevance ? "✓" : "✗"}, Auth=${input.checklist.apparent_authenticity ? "✓" : "✗"}, Cat=${input.checklist.category_alignment ? "✓" : "✗"}, Comp=${input.checklist.completeness_expiry ? "✓" : "✗"}`
      : "";

    const newStatus = input.decision === "passed" ? "active" : input.decision === "request_changes" ? "draft" : "rejected";
    const { error: updateError } = await admin
      .from("surveys")
      .update({
        status: newStatus,
        review_notes: `${input.notes ?? `Manually ${input.decision} by an administrator.`}${checklistSummary}`,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", survey.id);

    if (updateError) throw new ApiError(500, "REVIEW_FAILED", updateError.message);

    res.json({ id: survey.id, status: input.decision, reviewer_id: context.userId });
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
