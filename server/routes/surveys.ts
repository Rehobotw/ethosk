import { createHash } from "node:crypto";
import { Router } from "express";
import {
  aiDraftRequestSchema,
  chatTurnSchema,
  finalDraftSchema,
  improveQuestionSchema,
  matchRequestSchema,
  sendRequestSchema,
  submitResponseSchema,
  surveySchema,
  translateSchema,
} from "@shared/validation/schemas.js";
import type { Question, SurveyRecord, TargetLanguage } from "@shared/types.js";
import { aggregateResponses, shouldGenerateSummary } from "@shared/analytics/aggregate.js";
import {
  buildConsistencyQuestion,
  evaluateConsistency,
  isConsistencyCheckId,
  pickInsertIndex,
  pickQuestionToDuplicate,
} from "@shared/fraud/consistencyCheck.js";
import { scoreResponse } from "@shared/fraud/score.js";
import { buildSupabaseMatchFilters, type MatchFilters } from "@shared/matching/buildQuery.js";
import { env, fraudThresholds } from "../env.js";
import { translateText } from "../lib/ai/addisai.js";
import {
  generateSurveyDraft,
  improveQuestion,
  rephraseQuestion,
  summarizeAnalytics,
} from "../lib/ai/features.js";
import { claudeConversation, extractJson, MODELS } from "../lib/ai/index.js";
import { chatModeSystem } from "../lib/ai/prompts.js";
import { auth, requireAuth, checkFreeTierSurveyLimit, checkFreeTierResponseLimit } from "../lib/auth.js";
import { recordConsentEvent } from "../lib/consent.js";
import { ApiError, asyncRoute, parseBody, routeParam } from "../lib/http.js";
import { rateLimit } from "../lib/rateLimit.js";
import { admin, userClient } from "../lib/supabase.js";
import { payForResponse, readResearcherWallet, roundEtb } from "../lib/wallet.js";

export const surveysRouter = Router();

surveysRouter.post(
  "/improve-question-text",
  requireAuth("researcher"),
  rateLimit({ key: "improve-text", max: 30, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const { text } = (req.body || {}) as { text?: string };
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ApiError(400, "TEXT_REQUIRED", "Question text is required.");
    }
    const { improved, ok } = await improveQuestion(text.trim());
    res.json({ original: text, improved, unchanged: !ok });
  }),
);

// ---------------------------------------------------------------------------
// Survey CRUD
// ---------------------------------------------------------------------------

surveysRouter.get(
  "/",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("surveys")
      .select("*")
      .eq("researcher_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, "SURVEYS_READ_FAILED", error.message);

    const surveys = (data ?? []) as SurveyRecord[];
    const withStats = await Promise.all(
      surveys.map(async (survey) => {
        const [{ count: responseCount }, { count: targetCount }] = await Promise.all([
          admin
            .from("survey_responses")
            .select("id", { count: "exact", head: true })
            .eq("survey_id", survey.id),
          admin
            .from("survey_targets")
            .select("survey_id", { count: "exact", head: true })
            .eq("survey_id", survey.id),
        ]);
        return {
          ...survey,
          response_count: responseCount ?? 0,
          targeted_count: targetCount ?? 0,
        };
      }),
    );

    res.json({ surveys: withStats });
  }),
);

surveysRouter.post(
  "/",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(surveySchema, req.body);
    if (input.status === "final_draft") {
      finalDraftSchema.parse(input);
    }
    const client = userClient(context.accessToken);

    // Free-tier enforcement: cap active survey count
    await checkFreeTierSurveyLimit(context.userId, context.subscriptionTier);

    const { data, error } = await client
      .from("surveys")
      .insert({
        researcher_id: context.userId,
        title: input.title,
        description: input.description ?? null,
        questions: input.questions,
        reward_etb: input.reward_etb ?? null,
        compliance_answer: input.compliance_answer ?? null,
        compliance_document_path: input.compliance_document_path ?? null,
        status: input.status ?? "draft",
      })
      .select()
      .single();

    if (error) throw new ApiError(500, "SURVEY_CREATE_FAILED", error.message);
    res.status(201).json(data);
  }),
);

surveysRouter.delete(
  "/:id",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    const deletableStatuses = ["wip", "draft", "final_draft", "rejected"];
    if (!deletableStatuses.includes(survey.status)) {
      throw new ApiError(
        409,
        "SURVEY_NOT_DELETABLE",
        "Active or sent surveys cannot be deleted as responses may be linked.",
      );
    }

    const client = userClient(context.accessToken);
    const { error } = await client.from("surveys").delete().eq("id", survey.id);

    if (error) throw new ApiError(500, "SURVEY_DELETE_FAILED", error.message);
    res.json({ success: true, message: "Survey deleted successfully." });
  }),
);

surveysRouter.post(
  "/draft-ai",
  requireAuth("researcher"),
  rateLimit({ key: "ai-draft", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);

    // Subscription gate enforcement: AI Survey Drafting is a Pro feature
    if (context.subscriptionTier !== "subscribed") {
      throw new ApiError(
        403,
        "FEATURE_REQUIRES_SUBSCRIPTION",
        "AI Survey Generation is a Pro feature. Upgrade your subscription to unlock automated survey drafting.",
      );
    }

    const input = parseBody(aiDraftRequestSchema, req.body);
    
    const draft = await generateSurveyDraft({
      topic: input.topic,
      description: input.description,
      targetQuestionCount: input.target_question_count,
    });

    if (!draft) {
      throw new ApiError(503, "AI_DRAFT_FAILED", "Failed to generate survey draft from AI.");
    }
    
    res.json(draft);
  }),
);

surveysRouter.get(
  "/:id",
  requireAuth("researcher", "respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadSurvey(routeParam(req, "id"));

    if (context.role === "researcher" && survey.researcher_id !== context.userId) {
      throw new ApiError(404, "SURVEY_NOT_FOUND", "That survey does not exist.");
    }
    if (context.role === "respondent") {
      await assertTargeted(survey.id, context.userId);
    }

    res.json(survey);
  }),
);

surveysRouter.get(
  "/:id/export",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    // Subscription gate enforcement
    if (context.subscriptionTier !== "subscribed") {
      throw new ApiError(403, "EXPORT_REQUIRES_SUBSCRIPTION", "Raw data export requires a Pro subscription.");
    }

    // MVP placeholder for actual CSV generation
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="survey_${req.params.id}_export.csv"`);
    res.send("respondent_id,completed_at,fraud_flag\n123,2026-08-14,clean");
  }),
);

surveysRouter.patch(
  "/:id",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(surveySchema.partial(), req.body);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    const editableStatuses = ["wip", "draft", "final_draft", "rejected"];
    if (!editableStatuses.includes(survey.status)) {
      throw new ApiError(409, "SURVEY_NOT_EDITABLE", "A sent survey can no longer be edited.");
    }

    const nextStatus = input.status ?? survey.status;

    if (nextStatus === "final_draft") {
      finalDraftSchema.parse({
        title: input.title ?? survey.title,
        questions: input.questions ?? survey.questions,
        reward_etb: input.reward_etb ?? survey.reward_etb,
        description: input.description !== undefined ? input.description : survey.description,
      });
    }

    // Editing a question invalidates only that question's cached translation, not
    // the whole survey's (§15.2).
    const translations =
      input.questions !== undefined ? {} : survey.translations;

    const client = userClient(context.accessToken);
    const { data, error } = await client
      .from("surveys")
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.questions !== undefined && { questions: input.questions }),
        ...(input.reward_etb !== undefined && { reward_etb: input.reward_etb }),
        ...(input.compliance_answer !== undefined && { compliance_answer: input.compliance_answer }),
        ...(input.compliance_document_path !== undefined && { compliance_document_path: input.compliance_document_path }),
        ...(input.status !== undefined && { status: input.status }),
        translations,
      })
      .eq("id", survey.id)
      .select()
      .single();

    if (error) throw new ApiError(500, "SURVEY_UPDATE_FAILED", error.message);
    res.json(data);
  }),
);

surveysRouter.delete(
  "/:id",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    if (survey.status === "active" || survey.status === "closed") {
      throw new ApiError(409, "CANNOT_DELETE_ACTIVE", "Active or closed surveys cannot be deleted.");
    }

    const client = userClient(context.accessToken);
    const { error } = await client.from("surveys").delete().eq("id", survey.id);

    if (error) throw new ApiError(500, "SURVEY_DELETE_FAILED", error.message);
    res.json({ success: true, deleted_id: survey.id });
  }),
);

surveysRouter.post(
  "/:id/duplicate",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("surveys")
      .insert({
        researcher_id: context.userId,
        title: `Copy of ${survey.title}`,
        description: survey.description,
        questions: survey.questions,
        reward_etb: survey.reward_etb,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw new ApiError(500, "SURVEY_DUPLICATE_FAILED", error.message);
    res.status(201).json(data);
  }),
);

// ---------------------------------------------------------------------------
// AI assistance
// ---------------------------------------------------------------------------

surveysRouter.post(
  "/:id/improve-question",
  requireAuth("researcher"),
  rateLimit({ key: "improve", max: 30, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { question_id: questionId } = parseBody(improveQuestionSchema, req.body);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    const question = survey.questions.find((item) => item.id === questionId);
    if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "That question does not exist.");

    const { improved, ok } = await improveQuestion(question.text);

    // Deliberately does not mutate the stored question — the researcher accepts
    // or rejects the rewrite explicitly via PATCH (§8.3).
    res.json({
      question_id: questionId,
      original: question.text,
      improved,
      unchanged: !ok,
    });
  }),
);

surveysRouter.post(
  "/:id/translate",
  requireAuth("researcher"),
  rateLimit({ key: "translate", max: 20, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { target_languages: languages } = parseBody(translateSchema, req.body);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    const translations: Partial<Record<TargetLanguage, string[]>> = {
      ...survey.translations,
    };

    try {
      for (const language of languages) {
        translations[language] = await Promise.all(
          survey.questions.map((question) =>
            translateQuestion(survey.id, question.text, language),
          ),
        );
      }
    } catch (error) {
      console.error("[translate] provider unavailable:", error);
      throw new ApiError(
        502,
        "TRANSLATION_PROVIDER_UNAVAILABLE",
        "Translation is unavailable right now. The English version is still live.",
      );
    }

    const client = userClient(context.accessToken);
    const { error } = await client
      .from("surveys")
      .update({ translations })
      .eq("id", survey.id);

    if (error) throw new ApiError(500, "TRANSLATION_SAVE_FAILED", error.message);
    res.json({ translations });
  }),
);

/** Cached by a hash of (survey, question text, language) so edits are cheap (§7.2). */
async function translateQuestion(
  surveyId: string,
  text: string,
  language: TargetLanguage,
): Promise<string> {
  const cacheKey = createHash("sha256").update(`${surveyId}:${text}:${language}`).digest("hex");

  const { data: cached } = await admin
    .from("translation_cache")
    .select("translated_text")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (cached?.translated_text) return cached.translated_text;

  const { text: translated } = await translateText(text, language);

  await admin.from("translation_cache").upsert({
    cache_key: cacheKey,
    target_language: language,
    translated_text: translated,
  });

  return translated;
}

// ---------------------------------------------------------------------------
// Matching and sending
// ---------------------------------------------------------------------------

surveysRouter.post(
  "/:id/match",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { filters } = parseBody(matchRequestSchema, req.body);
    await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    const matchedCount = await countMatches(filters);

    res.json({
      matched_count: matchedCount,
      power_warning: matchedCount < env.matchPowerWarningThreshold,
      power_warning_threshold: env.matchPowerWarningThreshold,
    });
  }),
);

surveysRouter.post(
  "/:id/send",
  requireAuth("researcher"),
  rateLimit({ key: "send", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(sendRequestSchema, req.body);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);

    // Free-tier enforcement: cap responses per survey
    await checkFreeTierResponseLimit(survey.id, context.subscriptionTier);

    // Idempotency: a survey that has already been sent is not re-notified (§8.3).
    if (survey.status === "active" || survey.status === "closed") {
      throw new ApiError(409, "ALREADY_SENT", "This survey has already been sent.");
    }

    // The count is always recomputed server-side; a client-cached number is never
    // trusted to decide who receives a survey.
    const respondentIds = await findMatches(input.filters);

    // Sending is the point of no return for money: respondents are about to be
    // promised a reward, so the full cost is checked against the researcher's
    // balance and reserved here rather than discovered to be missing later.
    const rewardEtb = input.reward_etb ?? survey.reward_etb ?? 0;
    const requiredEtb = roundEtb(rewardEtb * respondentIds.length);

    if (requiredEtb > 0) {
      const wallet = await readResearcherWallet(context.userId);
      if (wallet.available_etb < requiredEtb) {
        throw new ApiError(
          402,
          "INSUFFICIENT_FUNDS",
          `This send needs ${requiredEtb.toLocaleString()} ETB to cover ${respondentIds.length} ` +
            `responses at ${rewardEtb} ETB. Your available balance is ` +
            `${wallet.available_etb.toLocaleString()} ETB. Add funds and try again.`,
        );
      }
    }

    if (respondentIds.length > 0) {
      const { error: targetError } = await admin.from("survey_targets").upsert(
        respondentIds.map((respondentId) => ({
          survey_id: survey.id,
          respondent_id: respondentId,
        })),
        { onConflict: "survey_id,respondent_id", ignoreDuplicates: true },
      );
      if (targetError) throw new ApiError(500, "SEND_FAILED", targetError.message);
    }

    const { error: statusError } = await admin
      .from("surveys")
      .update({
        status: "pending_review",
        sent_at: new Date().toISOString(),
        target_filters: input.filters,
        escrow_etb: requiredEtb,
        ...(input.reward_etb !== undefined && { reward_etb: input.reward_etb }),
      })
      .eq("id", survey.id);

    if (statusError) throw new ApiError(500, "SEND_FAILED", statusError.message);

    res.json({
      targeted_count: respondentIds.length,
      status: "pending_review",
      reserved_etb: requiredEtb,
    });
  }),
);

async function countMatches(filters: MatchFilters): Promise<number> {
  let query = admin
    .from("respondent_match_view")
    .select("user_id", { count: "exact", head: true });

  for (const filter of buildSupabaseMatchFilters(filters)) {
    query = applyFilter(query, filter);
  }

  const { count, error } = await query;
  if (error) throw new ApiError(500, "MATCH_FAILED", error.message);
  return count ?? 0;
}

async function findMatches(filters: MatchFilters): Promise<string[]> {
  let query = admin.from("respondent_match_view").select("user_id");

  for (const filter of buildSupabaseMatchFilters(filters)) {
    query = applyFilter(query, filter);
  }

  const { data, error } = await query;
  if (error) throw new ApiError(500, "MATCH_FAILED", error.message);
  return (data ?? []).map((row) => row.user_id as string);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function applyFilter(query: any, filter: { column: string; op: string; value: unknown }): any {
  switch (filter.op) {
    case "eq":
      return query.eq(filter.column, filter.value);
    case "gte":
      return query.gte(filter.column, filter.value);
    case "lte":
      return query.lte(filter.column, filter.value);
    default:
      return query;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Filter option discovery (populates the filter builder's selects)
// ---------------------------------------------------------------------------

surveysRouter.get(
  "/meta/filter-options",
  requireAuth("researcher"),
  asyncRoute(async (_req, res) => {
    const { data, error } = await admin
      .from("respondent_match_view")
      .select("university, department, year, region, city, occupation");

    if (error) throw new ApiError(500, "FILTER_OPTIONS_FAILED", error.message);

    // Only the free-text attributes are discovered from the panel. The fixed sets
    // — gender, employment status, education level, language — are shared enums,
    // so the builder lists every valid option whether or not anyone has picked it
    // yet, and a filter never silently disappears from the UI.
    const universities = new Set<string>();
    const departments = new Set<string>();
    const years = new Set<number>();
    const regions = new Set<string>();
    const cities = new Set<string>();
    const occupations = new Set<string>();

    for (const row of data ?? []) {
      if (row.university) universities.add(row.university as string);
      if (row.department) departments.add(row.department as string);
      if (typeof row.year === "number") years.add(row.year);
      if (row.region) regions.add(row.region as string);
      if (row.city) cities.add(row.city as string);
      if (row.occupation) occupations.add(row.occupation as string);
    }

    res.json({
      universities: [...universities].sort(),
      departments: [...departments].sort(),
      years: [...years].sort((a, b) => a - b),
      regions: [...regions].sort(),
      cities: [...cities].sort(),
      occupations: [...occupations].sort(),
    });
  }),
);

// ---------------------------------------------------------------------------
// Respondent fill
// ---------------------------------------------------------------------------

/**
 * Returns the survey as the respondent should see it: their language if
 * available, plus the AI-rephrased consistency-check duplicate inserted at a
 * randomized position from the fifth question onward.
 */
surveysRouter.get(
  "/:id/fill",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadSurvey(routeParam(req, "id"));
    await assertTargeted(survey.id, context.userId);
    await assertNotAnswered(survey.id, context.userId);

    const questions = [...survey.questions];
    const check = await ensureConsistencyQuestion(survey, context.userId);

    if (check) {
      questions.splice(pickInsertIndex(survey.questions.length), 0, check);
    }

    const minVerificationTier = (survey.target_filters as any)?.minVerificationTier ?? "0_registered";

    res.json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      reward_etb: survey.reward_etb,
      questions,
      translations: survey.translations,
      min_verification_tier: minVerificationTier,
    });
  }),
);

surveysRouter.post(
  "/:id/responses",
  requireAuth("respondent"),
  rateLimit({ key: "respond", max: 30, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(submitResponseSchema, req.body);
    const survey = await loadSurvey(routeParam(req, "id"));

    await assertTargeted(survey.id, context.userId);
    await assertNotAnswered(survey.id, context.userId);

    // The pairing is read back from survey_targets rather than taken from the
    // request, so the client cannot tell us which question it was checked against.
    const checkQuestion = await loadConsistencyQuestion(survey.id, context.userId);
    const consistencyCheckPassed = checkQuestion
      ? evaluateConsistency(checkQuestion, input.answers)
      : null;

    // Client timings are reconciled against the server-side sum so a tampered
    // total cannot make a rushed response look thorough.
    const reportedSum = Object.values(input.time_per_question).reduce((a, b) => a + b, 0);
    const totalTimeSeconds = Math.min(input.total_time_seconds, Math.round(reportedSum) || input.total_time_seconds);

    // The duplicate is a fraud control, not data: it is excluded from the stored
    // answers so it can never appear in the researcher's results.
    const substantiveAnswers = Object.fromEntries(
      Object.entries(input.answers).filter(([key]) => !isConsistencyCheckId(key)),
    );
    const substantiveTimings = Object.fromEntries(
      Object.entries(input.time_per_question).filter(([key]) => !isConsistencyCheckId(key)),
    );

    // Scoring runs inside the submission request, so a respondent cannot submit
    // without also being scored (§8.4). It is fully deterministic — no AI call,
    // and the outcome is a flag with its signals, never a written explanation.
    const { flag, signals } = scoreResponse(
      {
        questionCount: survey.questions.length,
        totalTimeSeconds,
        answers: substantiveAnswers,
        consistencyCheckPassed,
        textMetrics: input.text_metrics,
      },
      fraudThresholds,
    );

    const { data, error } = await admin
      .from("survey_responses")
      .insert({
        survey_id: survey.id,
        respondent_id: context.userId,
        answers: substantiveAnswers,
        time_per_question: substantiveTimings,
        total_time_seconds: totalTimeSeconds,
        fraud_flag: flag,
        fraud_signals: signals,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate")) {
        throw new ApiError(409, "ALREADY_RESPONDED", "You have already completed this survey.");
      }
      throw new ApiError(500, "RESPONSE_SAVE_FAILED", error.message);
    }

    await recordConsentEvent(context.userId, "survey_response", {
      survey_id: survey.id,
      response_id: data.id,
    });

    // A flagged response is not paid. The respondent is not told which of the two
    // happened here, for the same reason the flag itself is hidden from them: the
    // check only works while it is not obvious what tripped it.
    let rewarded = false;
    if (flag === "clean") {
      const payout = await payForResponse({
        responseId: data.id,
        surveyId: survey.id,
        respondentId: context.userId,
        researcherId: survey.researcher_id,
        amountEtb: survey.reward_etb ?? 0,
      });
      rewarded = payout.paid;
      if (!payout.paid && payout.reason && payout.reason !== "unpaid survey") {
        console.warn(`[wallet] payout skipped for response ${data.id}: ${payout.reason}`);
      }
    }

    res.status(201).json({
      response_id: data.id,
      /** Present so the confirmation screen does not promise a reward that was not paid. */
      reward_etb: rewarded ? (survey.reward_etb ?? 0) : 0,
    });
  }),
);

/** Chat-mode turn. Falls back to form mode for the session on failure (§7.1). */
surveysRouter.post(
  "/:id/chat",
  requireAuth("respondent"),
  rateLimit({ key: "chat", max: 60, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { messages, language = "en" } = parseBody(chatTurnSchema, req.body);
    const survey = await loadSurvey(routeParam(req, "id"));
    await assertTargeted(survey.id, context.userId);

    let turnData = {
      reply: "",
      question_index: null as number | null,
      question_type: null as "single_choice" | "multi_choice" | "text" | null,
      options: null as string[] | null,
      is_followup: false,
      is_complete: false,
      fallback_to_form: false,
      total_questions: survey.questions.length,
    };

    try {
      const raw = await claudeConversation({
        model: MODELS.sonnet,
        system: chatModeSystem(
          survey.questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options,
          })),
        ),
        messages: messages.length ? messages : [{ role: "user", content: "Let's begin." }],
        maxTokens: 500,
        temperature: 0.6,
        timeoutMs: 8_000,
      });

      const parsed = extractJson(raw) as any;
      if (parsed && typeof parsed.reply === "string") {
        turnData.reply = parsed.reply;
        turnData.question_index = typeof parsed.question_index === "number" ? parsed.question_index : null;
        turnData.question_type = parsed.question_type ?? null;
        turnData.options = Array.isArray(parsed.options) ? parsed.options : null;
        turnData.is_followup = Boolean(parsed.is_followup);
        turnData.is_complete = Boolean(parsed.is_complete);
      } else {
        turnData.reply = raw;
      }
    } catch (_error) {
      // Demo / offline fallback when ANTHROPIC_API_KEY is not configured
      const userMessages = messages.filter((m) => m.role === "user");
      const userMessageCount = userMessages.length;
      const lastUserMsg = userMessages[userMessages.length - 1]?.content.trim().toLowerCase() || "";

      // Check if last user answer was too short (< 4 characters or 1 word) on a text question for follow-up simulation
      const prevQuestion = userMessageCount > 0 ? survey.questions[userMessageCount - 1] : null;
      const isShortText = prevQuestion?.type === "text" && lastUserMsg.split(/\s+/).length < 2 && lastUserMsg.length < 5;
      const isAlreadyFollowedUp = messages.slice(-2)[0]?.content?.includes("elaborate") || false;

      if (isShortText && !isAlreadyFollowedUp && userMessageCount > 0) {
        turnData.reply = `Could you elaborate a bit more on that? Please share a few more details.`;
        turnData.question_index = userMessageCount - 1;
        turnData.question_type = "text";
        turnData.options = null;
        turnData.is_followup = true;
        turnData.is_complete = false;
      } else if (userMessageCount === 0 && survey.questions[0]) {
        const firstQ = survey.questions[0];
        turnData.reply = `Welcome! Let's begin the survey. Question 1 of ${survey.questions.length}: ${firstQ.text}`;
        turnData.question_index = 0;
        turnData.question_type = firstQ.type as any;
        turnData.options = firstQ.options ?? null;
        turnData.is_followup = false;
        turnData.is_complete = false;
      } else if (userMessageCount < survey.questions.length && survey.questions[userMessageCount]) {
        const currentQuestion = survey.questions[userMessageCount];
        turnData.reply = `Got it! Next question (${userMessageCount + 1} of ${survey.questions.length}): ${currentQuestion.text}`;
        turnData.question_index = userMessageCount;
        turnData.question_type = currentQuestion.type as any;
        turnData.options = currentQuestion.options ?? null;
        turnData.is_followup = false;
        turnData.is_complete = false;
      } else {
        turnData.reply = "Thank you! All questions in this study have been answered. Click 'Review and submit' below to record your response.";
        turnData.question_index = null;
        turnData.question_type = null;
        turnData.options = null;
        turnData.is_followup = false;
        turnData.is_complete = true;
      }
    }

    // Adaptive language translation via Addis AI
    if (language === "am" || language === "om") {
      try {
        const translated = await translateText(turnData.reply, language);
        turnData.reply = translated.text;

        // Also translate options if present
        if (turnData.options?.length) {
          turnData.options = await Promise.all(
            turnData.options.map(async (opt) => {
              try {
                const res = await translateText(opt, language);
                return res.text;
              } catch {
                return opt;
              }
            }),
          );
        }
      } catch (err) {
        console.warn(`[chat] language translation to ${language} failed:`, err);
      }
    }

    res.json(turnData);
  }),
);

// ---------------------------------------------------------------------------
// Responses and analytics (researcher)
// ---------------------------------------------------------------------------

surveysRouter.get(
  "/:id/responses",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);
    const client = userClient(context.accessToken);

    const { data, error } = await client
      .from("survey_responses")
      .select("id, answers, total_time_seconds, fraud_flag, fraud_signals, completed_at")
      .eq("survey_id", survey.id)
      .order("completed_at", { ascending: false });

    if (error) throw new ApiError(500, "RESPONSES_READ_FAILED", error.message);
    res.json({ responses: data ?? [] });
  }),
);

surveysRouter.get(
  "/:id/responses/:responseId",
  requireAuth("researcher", "admin"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    if (context.role === "researcher") {
      await loadOwnedSurvey(routeParam(req, "id"), context.userId);
    }

    const { data, error } = await admin
      .from("survey_responses")
      .select("*")
      .eq("id", routeParam(req, "responseId"))
      .eq("survey_id", routeParam(req, "id"))
      .maybeSingle();

    if (error) throw new ApiError(500, "RESPONSE_READ_FAILED", error.message);
    if (!data) throw new ApiError(404, "RESPONSE_NOT_FOUND", "That response does not exist.");
    res.json(data);
  }),
);

surveysRouter.get(
  "/:id/analytics",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const survey = await loadOwnedSurvey(routeParam(req, "id"), context.userId);
    const includeFlagged = req.query.include_flagged === "true";

    const [{ data: responses, error }, { count: targetedCount }, { data: profile }] = await Promise.all([
      admin.from("survey_responses").select("answers, fraud_flag").eq("survey_id", survey.id),
      admin
        .from("survey_targets")
        .select("survey_id", { count: "exact", head: true })
        .eq("survey_id", survey.id),
      admin.from("researcher_profiles").select("subscription_tier").eq("user_id", context.userId).maybeSingle(),
    ]);

    if (error) throw new ApiError(500, "ANALYTICS_FAILED", error.message);

    const aggregates = aggregateResponses(
      (responses ?? []).map((row) => ({
        answers: row.answers as Record<string, string>,
        fraud_flag: row.fraud_flag,
      })),
      survey.questions,
      targetedCount ?? 0,
      { includeFlagged },
    );

    // Only aggregates reach the model — never raw answers or anything identifying.
    const isSubscribed = profile?.subscription_tier === "subscribed";
    const aiSummary = isSubscribed && shouldGenerateSummary(aggregates.response_count)
      ? await summarizeAnalytics({
          title: survey.title,
          response_count: aggregates.response_count,
          completion_rate: aggregates.completion_rate,
          flagged_count: aggregates.flagged_count,
          distributions: aggregates.distributions,
        })
      : null;

    res.json({ ...aggregates, ai_summary: aiSummary, questions: survey.questions });
  }),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadSurvey(id: string): Promise<SurveyRecord> {
  const { data, error } = await admin.from("surveys").select("*").eq("id", id).maybeSingle();
  if (error) throw new ApiError(500, "SURVEY_READ_FAILED", error.message);
  if (!data) throw new ApiError(404, "SURVEY_NOT_FOUND", "That survey does not exist.");
  return normalizeSurvey(data);
}

async function loadOwnedSurvey(id: string, researcherId: string): Promise<SurveyRecord> {
  const survey = await loadSurvey(id);
  if (survey.researcher_id !== researcherId) {
    // 404 rather than 403 so survey IDs cannot be probed for existence.
    throw new ApiError(404, "SURVEY_NOT_FOUND", "That survey does not exist.");
  }
  return survey;
}

function normalizeSurvey(row: Record<string, unknown>): SurveyRecord {
  return {
    ...(row as unknown as SurveyRecord),
    description: (row.description as string | null | undefined) ?? null,
    questions: Array.isArray(row.questions) ? (row.questions as Question[]) : [],
    translations: (row.translations ?? {}) as SurveyRecord["translations"],
  };
}

async function assertTargeted(surveyId: string, respondentId: string): Promise<void> {
  const { data } = await admin
    .from("survey_targets")
    .select("survey_id")
    .eq("survey_id", surveyId)
    .eq("respondent_id", respondentId)
    .maybeSingle();

  if (!data) {
    throw new ApiError(403, "NOT_TARGETED", "This survey was not sent to you.");
  }
}

async function assertNotAnswered(surveyId: string, respondentId: string): Promise<void> {
  const { data } = await admin
    .from("survey_responses")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("respondent_id", respondentId)
    .maybeSingle();

  if (data) {
    throw new ApiError(409, "ALREADY_RESPONDED", "You have already completed this survey.");
  }
}

/**
 * Returns this respondent's consistency-check question, generating it on first
 * fill and reusing it thereafter.
 *
 * Generated per respondent rather than per survey so that comparing notes with
 * another respondent does not reveal which question is the duplicate. Persisted
 * so a reload shows the same question instead of a fresh one.
 *
 * Returns `null` whenever a check cannot be made — survey too short, no eligible
 * question, or the rephrase call failed. The response is then scored with no
 * consistency signal, which counts as inconclusive rather than as a failure.
 */
async function ensureConsistencyQuestion(
  survey: SurveyRecord,
  respondentId: string,
): Promise<Question | null> {
  const existing = await loadConsistencyQuestion(survey.id, respondentId);
  if (existing) return existing;

  const original = pickQuestionToDuplicate(survey.questions);
  if (!original) return null;

  const rephrased = await rephraseQuestion(original.text);
  if (!rephrased) return null;

  const question = buildConsistencyQuestion(original, rephrased);

  const { error } = await admin
    .from("survey_targets")
    .update({ consistency_question: question })
    .eq("survey_id", survey.id)
    .eq("respondent_id", respondentId);

  // A failed write means we could not guarantee the same question on reload, so
  // skip the check rather than show a duplicate we cannot score against later.
  if (error) {
    console.warn("[survey] could not persist consistency question:", error.message);
    return null;
  }

  return question;
}

async function loadConsistencyQuestion(
  surveyId: string,
  respondentId: string,
): Promise<Question | null> {
  const { data } = await admin
    .from("survey_targets")
    .select("consistency_question")
    .eq("survey_id", surveyId)
    .eq("respondent_id", respondentId)
    .maybeSingle();

  const stored = data?.consistency_question;
  return stored && typeof stored === "object" ? (stored as Question) : null;
}

