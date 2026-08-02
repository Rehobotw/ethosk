import { Router } from "express";
import { z } from "zod";
import type { VerificationTier } from "@shared/types.js";
import { TIER_RANK } from "@shared/types.js";
import { env } from "../env.js";
import { requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { admin } from "../lib/supabase.js";

export const adminRouter = Router();

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
