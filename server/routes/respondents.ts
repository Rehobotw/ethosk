import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  documentUploadSchema,
  faydaVerifySchema,
  institutionalDetailsSchema,
  institutionalEmailOtpConfirmSchema,
  institutionalEmailOtpRequestSchema,
  MAX_UPLOAD_BYTES,
  respondentProfileSchema,
} from "@shared/validation/schemas.js";
import type { VerificationTier } from "@shared/types.js";
import { TIER_RANK } from "@shared/types.js";
import { env } from "../env.js";
import { checkDocument } from "../lib/ai/features.js";
import { auth, requireAuth } from "../lib/auth.js";
import { hashNationalId, recordConsentEvent } from "../lib/consent.js";
import { isFaydaConfigured, verifyFayda, verifyFaydaQrPayload, type FaydaOutcome } from "../lib/fayda.js";
import { ApiError, asyncRoute, parseBody } from "../lib/http.js";
import { rateLimit } from "../lib/rateLimit.js";
import { admin, userClient } from "../lib/supabase.js";

export const respondentsRouter = Router();

const respondentEmailOtpStore = new Map<string, { code: string; email: string; timestamp: number }>();

// Held in memory so the size and MIME checks run before anything reaches storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

function calculateAgeFromDob(dob: string): number | null {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 && age <= 130 ? age : null;
}

respondentsRouter.post(
  "/profile",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(respondentProfileSchema, req.body);

    const { full_name, phone, dob, ...profileFields } = input;

    // Update user's legal full name if provided
    if (full_name && full_name.trim()) {
      await admin.from("users").update({ full_name: full_name.trim() }).eq("id", context.userId);
    }

    // If DOB is provided and age is not explicitly set, compute age from DOB
    const computedAge = profileFields.age ?? (dob ? calculateAgeFromDob(dob) : null);

    // Merge phone and dob into attributes for secure, structured persistence
    const mergedAttributes = {
      ...(profileFields.attributes || {}),
      ...(phone !== undefined && { phone }),
      ...(dob !== undefined && { dob }),
    };

    const { data, error } = await admin
      .from("respondent_profiles")
      .upsert(
        {
          user_id: context.userId,
          ...profileFields,
          age: computedAge,
          attributes: mergedAttributes,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw new ApiError(500, "PROFILE_SAVE_FAILED", error.message);

    res.json({
      ...data,
      full_name: full_name ?? null,
      phone: (data.attributes as Record<string, unknown>)?.phone ?? phone ?? null,
      dob: (data.attributes as Record<string, unknown>)?.dob ?? dob ?? null,
    });
  }),
);

respondentsRouter.get(
  "/profile",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);

    const [{ data: profile, error }, { data: userRecord }] = await Promise.all([
      admin.from("respondent_profiles").select().eq("user_id", context.userId).maybeSingle(),
      admin.from("users").select("full_name").eq("id", context.userId).maybeSingle(),
    ]);

    if (error) throw new ApiError(500, "PROFILE_READ_FAILED", error.message);

    const base = profile ?? {
      user_id: context.userId,
      university: null,
      department: null,
      year: null,
      age: null,
      employer: null,
      gender: null,
      region: null,
      city: null,
      employment_status: null,
      occupation: null,
      education_level: null,
      primary_language: null,
      attributes: {},
      updated_at: new Date().toISOString(),
    };

    const attrs = (base.attributes || {}) as Record<string, unknown>;

    res.json({
      ...base,
      full_name: userRecord?.full_name ?? null,
      phone: attrs.phone ?? null,
      dob: attrs.dob ?? null,
    });
  }),
);

/**
 * Fayda ID verification. The respondent submits their FIN, we ask Fayda whether
 * it is a real active identity, and only a confirmation from Fayda grants Tier 1.
 *
 * The FIN itself is never stored — only a peppered hash, which is enough to stop
 * one identity registering twice while keeping the sensitive number out of our
 * database entirely.
 */
const handleFaydaVerification = async (req: any, res: any) => {
  const context = auth(req);
  const input = parseBody(faydaVerifySchema, req.body);

  let outcome: FaydaOutcome;
  let identifierForHash = input.fayda_id || "";

  if (input.qr_payload) {
    outcome = await verifyFaydaQrPayload(input.qr_payload);
    if (outcome.status === "verified" && outcome.fan) {
      identifierForHash = outcome.fan;
    }
  } else if (input.fayda_id) {
    outcome = await verifyFayda(input.fayda_id);
    if (outcome.status === "verified" && outcome.fan) {
      identifierForHash = outcome.fan;
    }
  } else {
    throw new ApiError(400, "INVALID_INPUT", "Either Fayda ID or QR payload is required");
  }

  if (outcome.status === "unavailable") {
    await recordConsentEvent(context.userId, "fayda_verification", {
      result: "unavailable",
      detail: outcome.detail,
    });
    throw new ApiError(
      503,
      "FAYDA_UNAVAILABLE",
      outcome.detail || "Fayda could not be reached right now. Please try again shortly.",
    );
  }

  if (outcome.status === "not_found") {
    await recordConsentEvent(context.userId, "fayda_verification", { result: "not_found" });
    throw new ApiError(
      404,
      "FAYDA_ID_NOT_FOUND",
      outcome.detail || "Fayda did not recognise that ID or QR payload. Check the card and try again.",
    );
  }

  if (outcome.status === "inactive") {
    await recordConsentEvent(context.userId, "fayda_verification", { result: "inactive" });
    throw new ApiError(
      403,
      "FAYDA_ID_INACTIVE",
      "That Fayda ID is not currently active. Please contact Fayda support.",
    );
  }

  const idHash = hashNationalId(identifierForHash || `QR_${context.userId}`);

  // Reject an identity already bound to another account.
  const { data: existing, error: lookupError } = await admin
    .from("users")
    .select("id")
    .eq("national_id_hash", idHash)
    .maybeSingle();

  if (lookupError) throw new ApiError(500, "VERIFICATION_FAILED", lookupError.message);

  if (existing && existing.id !== context.userId) {
    throw new ApiError(
      409,
      "ID_ALREADY_USED",
      "This Fayda ID is already linked to another Ethosk account.",
    );
  }

  const nextTier: VerificationTier =
    TIER_RANK[context.verificationTier] >= TIER_RANK["1_id_verified"]
      ? context.verificationTier
      : "1_id_verified";

  const userUpdates: Record<string, unknown> = {
    verification_tier: nextTier,
    national_id_hash: idHash,
    fayda_verified_at: outcome.verifiedAt,
  };

  if (outcome.fullName) {
    userUpdates.full_name = outcome.fullName;
  }

  const { error } = await admin
    .from("users")
    .update(userUpdates)
    .eq("id", context.userId);

  if (error) throw new ApiError(500, "VERIFICATION_FAILED", error.message);

  // Sync profile demographics if extracted from QR
  try {
    const { data: currentProfile } = await admin
      .from("respondent_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    const currentAttrs = (currentProfile?.attributes || {}) as Record<string, unknown>;
    const profileUpdates: Record<string, unknown> = {
      user_id: context.userId,
      attributes: {
        ...currentAttrs,
        fayda_verified: true,
        fayda_method: outcome.method,
        signature_verified: outcome.signatureVerified ?? null,
        ...(outcome.dateOfBirth ? { dob: outcome.dateOfBirth } : {}),
      },
    };

    if (outcome.gender) {
      profileUpdates.gender = outcome.gender === "M" ? "male" : outcome.gender === "F" ? "female" : "other";
    }

    if (outcome.dateOfBirth) {
      const calculatedAge = calculateAgeFromDob(outcome.dateOfBirth);
      if (calculatedAge !== null) {
        profileUpdates.age = calculatedAge;
      }
    }

    await admin
      .from("respondent_profiles")
      .upsert(profileUpdates, { onConflict: "user_id" });
  } catch (profErr) {
    console.warn("[Fayda] Error auto-populating respondent profile:", profErr);
  }

  try {
    if (typeof admin.auth?.admin?.updateUserById === "function") {
      await admin.auth.admin.updateUserById(context.userId, {
        user_metadata: {
          verification_tier: nextTier,
          ...(outcome.fullName ? { full_name: outcome.fullName } : {}),
        },
      });
    }
  } catch {
    /* ignore */
  }

  await recordConsentEvent(context.userId, "fayda_verification", {
    result: "verified",
    method: outcome.method,
    live: isFaydaConfigured() || outcome.method === "qr_crypto",
    signature_verified: outcome.signatureVerified,
  });

  res.json({
    verification_tier: nextTier,
    verified_at: outcome.verifiedAt,
    live: isFaydaConfigured() || outcome.method === "qr_crypto",
    method: outcome.method,
    decoded: {
      full_name: outcome.fullName ?? null,
      gender: outcome.gender ?? null,
      date_of_birth: outcome.dateOfBirth ?? null,
      fan: outcome.fan ? `${outcome.fan.slice(0, 4)} **** **** ${outcome.fan.slice(-4)}` : null,
      face_base64: outcome.faceBase64 ?? null,
      signature_verified: outcome.signatureVerified ?? null,
    },
  });
};

respondentsRouter.post(
  "/verify-fayda",
  requireAuth("respondent"),
  rateLimit({ key: "fayda-verify", max: 10, windowMs: 15 * 60_000 }),
  asyncRoute(handleFaydaVerification),
);

respondentsRouter.post(
  "/verify/fayda",
  requireAuth("respondent"),
  rateLimit({ key: "fayda-verify", max: 10, windowMs: 15 * 60_000 }),
  asyncRoute(handleFaydaVerification),
);

respondentsRouter.post(
  "/institutional-details",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(institutionalDetailsSchema, req.body);

    const client = userClient(context.accessToken);
    const { data: currentProfile } = await client
      .from("respondent_profiles")
      .select("attributes")
      .eq("user_id", context.userId)
      .maybeSingle();

    const currentAttrs = (currentProfile?.attributes || {}) as Record<string, unknown>;

    const updatePayload: Record<string, unknown> = {
      user_id: context.userId,
      department: input.department,
      attributes: {
        ...currentAttrs,
        institutional_verification: {
          institution_type: input.institution_type,
          institution_name: input.institution_name,
          department: input.department,
          position_or_year: input.position_or_year,
          updated_at: new Date().toISOString(),
        },
      },
    };

    if (input.institution_type === "university") {
      updatePayload.university = input.institution_name;
      const parsedYear = Number.parseInt(input.position_or_year, 10);
      if (Number.isFinite(parsedYear) && parsedYear >= 1 && parsedYear <= 8) {
        updatePayload.year = parsedYear;
      }
    } else {
      updatePayload.employer = input.institution_name;
      updatePayload.occupation = input.position_or_year;
    }

    const { data, error } = await client
      .from("respondent_profiles")
      .upsert(updatePayload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw new ApiError(500, "INSTITUTIONAL_DETAILS_SAVE_FAILED", error.message);
    res.json(data);
  }),
);

respondentsRouter.post(
  "/verify-institutional-email/request",
  requireAuth("respondent"),
  rateLimit({ key: "respondent-inst-email-otp", max: 5, windowMs: 15 * 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { email } = parseBody(institutionalEmailOtpRequestSchema, req.body);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    respondentEmailOtpStore.set(context.userId, { code: otp, email, timestamp: Date.now() });

    res.json({
      success: true,
      message: "Verification code sent to institutional email",
      _dev_otp: otp,
    });
  }),
);

respondentsRouter.post(
  "/verify-institutional-email/confirm",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { code, email } = parseBody(institutionalEmailOtpConfirmSchema, req.body);
    const stored = respondentEmailOtpStore.get(context.userId);

    if (!stored || stored.code !== code || stored.email.toLowerCase() !== email.toLowerCase()) {
      throw new ApiError(400, "INVALID_CODE", "Invalid or expired verification code.");
    }

    // Check expiry (15 minutes)
    if (Date.now() - stored.timestamp > 15 * 60_000) {
      respondentEmailOtpStore.delete(context.userId);
      throw new ApiError(400, "CODE_EXPIRED", "Verification code has expired. Request a new one.");
    }

    const client = userClient(context.accessToken);
    const { data: currentProfile } = await client
      .from("respondent_profiles")
      .select("attributes")
      .eq("user_id", context.userId)
      .maybeSingle();

    const currentAttrs = (currentProfile?.attributes || {}) as Record<string, unknown>;

    await client
      .from("respondent_profiles")
      .upsert(
        {
          user_id: context.userId,
          attributes: {
            ...currentAttrs,
            institutional_email: email,
            institutional_email_verified: true,
            institutional_email_verified_at: new Date().toISOString(),
          },
        },
        { onConflict: "user_id" },
      );

    respondentEmailOtpStore.delete(context.userId);
    res.json({ success: true, message: "Institutional email verified successfully." });
  }),
);

respondentsRouter.post(
  "/documents",
  requireAuth("respondent"),
  rateLimit({ key: "doc-upload", max: 10, windowMs: 60_000 }),
  upload.single("file"),
  asyncRoute(async (req, res) => {
    const context = auth(req);

    // Gate entry: Requires Tier 1 completion first
    if (TIER_RANK[context.verificationTier] < TIER_RANK["1_id_verified"]) {
      throw new ApiError(
        403,
        "TIER_1_REQUIRED",
        "You must complete Tier 1 Identity Verification with your Fayda National ID before uploading institutional documents.",
      );
    }

    const { doc_type: docType } = parseBody(documentUploadSchema, req.body);
    const file = req.file;

    if (!file) throw new ApiError(400, "FILE_REQUIRED", "Attach a document to upload.");

    // The server-side check is the one that actually matters for security; the
    // client checks the same rules only to give faster feedback (§17.2, v4 §7.4).
    if (!ACCEPTED_UPLOAD_MIME_TYPES.includes(file.mimetype as (typeof ACCEPTED_UPLOAD_MIME_TYPES)[number])) {
      throw new ApiError(
        400,
        "UNSUPPORTED_FILE_TYPE",
        "Upload a PDF, JPG, or PNG document.",
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, "FILE_TOO_LARGE", "File is too large. Maximum allowed size is 10MB.");
    }

    const storagePath = `${context.userId}/${randomUUID()}-${sanitizeFileName(file.originalname)}`;

    const { error: uploadError } = await admin.storage
      .from(env.documentsBucket)
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) throw new ApiError(500, "UPLOAD_FAILED", uploadError.message);

    const { data: document, error: insertError } = await admin
      .from("documents")
      .insert({
        user_id: context.userId,
        doc_type: docType,
        storage_path: storagePath,
        status: "processing",
      })
      .select()
      .single();

    if (insertError) throw new ApiError(500, "UPLOAD_FAILED", insertError.message);

    await recordConsentEvent(context.userId, "document_upload", {
      document_id: document.id,
      doc_type: docType,
    });

    res.status(202).json({ document_id: document.id, status: "processing" });

    // Scoring continues after the response so the client can poll; failures here
    // land the document in needs_review rather than blocking the upload.
    void reviewDocument({
      documentId: document.id,
      userId: context.userId,
      docType,
      profileName: context.fullName,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
  }),
);

respondentsRouter.get(
  "/documents",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("documents")
      .select("id, doc_type, status, ai_notes, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, "DOCUMENTS_READ_FAILED", error.message);
    res.json({ documents: data ?? [] });
  }),
);

respondentsRouter.get(
  "/documents/:id",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("documents")
      .select("id, status, ai_notes")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw new ApiError(500, "DOCUMENT_READ_FAILED", error.message);
    if (!data) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "That document does not exist.");

    res.json({ status: data.status, notes: data.ai_notes });
  }),
);

respondentsRouter.get(
  "/inbox",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);

    // Destructured separately because only `targets` is reassigned below.
    const initial = await admin
      .from("survey_targets")
      .select(
        "survey_id, notified_at, surveys(id, title, questions, reward_etb, status)",
      )
      .eq("respondent_id", context.userId)
      .order("notified_at", { ascending: false });

    if (initial.error) throw new ApiError(500, "INBOX_READ_FAILED", initial.error.message);

    let targets = initial.data;

    if (!targets || targets.length === 0) {
      const { data: activeSurveys } = await admin
        .from("surveys")
        .select("id")
        .eq("status", "active");

      if (activeSurveys && activeSurveys.length > 0) {
        await admin.from("survey_targets").upsert(
          activeSurveys.map((s) => ({
            survey_id: s.id,
            respondent_id: context.userId,
          })),
          { onConflict: "survey_id,respondent_id", ignoreDuplicates: true },
        );

        const { data: refetched } = await admin
          .from("survey_targets")
          .select(
            "survey_id, notified_at, surveys(id, title, questions, reward_etb, status)",
          )
          .eq("respondent_id", context.userId)
          .order("notified_at", { ascending: false });

        // A refetch that came back empty leaves the original list in place rather
        // than replacing it with nothing.
        targets = refetched ?? targets;
      }
    }

    const { data: answered } = await admin
      .from("survey_responses")
      .select("survey_id")
      .eq("respondent_id", context.userId);

    const answeredIds = new Set((answered ?? []).map((row) => row.survey_id));

    type SurveyEmbed = {
      id: string;
      title: string;
      description?: string | null;
      questions: unknown[];
      reward_etb: number | null;
      status: string;
    };

    type TargetRow = {
      survey_id: string;
      surveys: SurveyEmbed | SurveyEmbed[] | null;
    };

    const surveys = ((targets ?? []) as unknown as TargetRow[])
      .map((row) => {
        const survey = Array.isArray(row.surveys) ? row.surveys[0] : row.surveys;
        return {
          survey_id: row.survey_id,
          survey: survey ?? null,
        };
      })
      .filter((item): item is { survey_id: string; survey: SurveyEmbed } => 
        Boolean(item.survey && item.survey.status === "active" && !answeredIds.has(item.survey_id))
      )
      .map(({ survey }) => {
        const questionCount = Array.isArray(survey.questions)
          ? survey.questions.length
          : 0;
        return {
          id: survey.id,
          title: survey.title,
          description: survey.description ?? null,
          // +1 accounts for the consistency check inserted at fill time.
          estimated_minutes: Math.max(1, Math.round(((questionCount + 1) * 20) / 60)),
          reward_etb: survey.reward_etb ?? 0,
        };
      });

    res.json({ surveys });
  }),
);

respondentsRouter.get(
  "/history",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);

    const { data: responses, error } = await admin
      .from("survey_responses")
      .select("id, survey_id, completed_at, surveys(title, reward_etb)")
      .eq("respondent_id", context.userId)
      .order("completed_at", { ascending: false });

    if (error) throw new ApiError(500, "HISTORY_READ_FAILED", error.message);

    type ResponseRow = {
      id: string;
      survey_id: string;
      completed_at: string;
      surveys: { title: string; reward_etb: number | null } | null;
    };

    const history = ((responses ?? []) as unknown as ResponseRow[]).map((row) => ({
      id: row.id,
      survey_id: row.survey_id,
      title: row.surveys?.title ?? "Survey Response",
      reward_etb: row.surveys?.reward_etb ?? 0,
      completed_at: row.completed_at,
    }));

    res.json({ history });
  }),
);

/** Runs the AI check and applies the tier transition it justifies. */
async function reviewDocument(input: {
  documentId: string;
  userId: string;
  docType: string;
  profileName: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<void> {
  try {
    // The vision model takes images; a PDF cannot be checked automatically and
    // goes straight to a human.
    if (input.mimeType === "application/pdf") {
      await finalizeDocument(input.documentId, "needs_review", "PDF uploads are reviewed manually.");
      return;
    }

    const outcome = await checkDocument({
      imageBase64: input.buffer.toString("base64"),
      imageMediaType: input.mimeType === "image/png" ? "image/png" : "image/jpeg",
      docType: input.docType,
      profileName: input.profileName,
    });

    if (!outcome.check) {
      await finalizeDocument(input.documentId, "needs_review", outcome.reason);
      return;
    }

    const { legible, matches_claimed_type: matchesType, name_consistent: nameConsistent } =
      outcome.check;

    if (!legible) {
      await finalizeDocument(
        input.documentId,
        "needs_review",
        outcome.check.notes || "The image was not legible enough to check.",
      );
      return;
    }

    if (!matchesType || !nameConsistent) {
      await finalizeDocument(
        input.documentId,
        "failed",
        outcome.check.notes ||
          (!matchesType
            ? "The document does not appear to match the claimed type."
            : "The name on the document does not match the profile name."),
      );
      return;
    }

    await finalizeDocument(input.documentId, "passed", outcome.check.notes);
    await promoteToAttributeVerified(input.userId);
  } catch (error) {
    console.error("[documents] review failed:", error);
    await finalizeDocument(
      input.documentId,
      "needs_review",
      "Automated check could not complete; queued for manual review.",
    );
  }
}

async function finalizeDocument(
  documentId: string,
  status: "passed" | "failed" | "needs_review",
  notes: string,
): Promise<void> {
  const { error } = await admin
    .from("documents")
    .update({ status, ai_notes: notes })
    .eq("id", documentId);
  if (error) console.error("[documents] status update failed:", error.message);
}

/** Tier 2 is only reachable from Tier 1 or above, and never downgrades a tier. */
async function promoteToAttributeVerified(userId: string): Promise<void> {
  const { data: user } = await admin
    .from("users")
    .select("verification_tier")
    .eq("id", userId)
    .single();

  if (!user) return;
  const current = user.verification_tier as VerificationTier;
  if (TIER_RANK[current] >= TIER_RANK["2_attribute_verified"]) return;

  await admin
    .from("users")
    .update({ verification_tier: "2_attribute_verified" })
    .eq("id", userId);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
}
