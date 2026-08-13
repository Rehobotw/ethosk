import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Question, SurveyRecord, TargetLanguage } from "@shared/types";
import { finalDraftSchema, surveySchema, type MatchFiltersInput } from "@shared/validation/schemas";
import { AudiencePanel } from "@/components/filter-builder/AudiencePanel";
import { ComplianceSection } from "@/components/survey-builder/ComplianceSection";
import {
  QuestionEditor,
  type ImproveResult,
} from "@/components/survey-builder/QuestionEditor";
import {
  Button,
  Field,
  Icon,
  Input,
  LoadingBlock,
  Notice,
  SectionHeading,
  Textarea,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { describeFormError } from "@/lib/forms";

const MAX_QUESTIONS = 30;

const DEFAULT_FILTERS: MatchFiltersInput = { minVerificationTier: "2_attribute_verified" };

function blankQuestion(): Question {
  return {
    id: `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    text: "",
    type: "single_choice",
    options: ["", ""],
    required: true,
  };
}

export function SurveyBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [surveyId, setSurveyId] = useState<string | null>(id ?? null);
  const [aiTopic, setAiTopic] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardEtb, setRewardEtb] = useState<number | null>(15);
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [translations, setTranslations] = useState<
    Partial<Record<TargetLanguage, string[]>>
  >({});
  const [filters, setFilters] = useState<MatchFiltersInput>(DEFAULT_FILTERS);
  const [complianceRequired, setComplianceRequired] = useState<boolean | null>(null);
  const [complianceDocumentUrl, setComplianceDocumentUrl] = useState<string | null>(null);
  const [complianceAttestedAt, setComplianceAttestedAt] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(
    null,
  );

  const { data: existing, isLoading } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => api<SurveyRecord>(`/surveys/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!existing) return;
    setSurveyId(existing.id);
    setTitle(existing.title);
    setDescription(existing.description ?? "");
    setRewardEtb(existing.reward_etb);
    setQuestions(existing.questions.length ? existing.questions : [blankQuestion()]);
    setTranslations(existing.translations ?? {});
    setComplianceRequired(existing.compliance_required ?? null);
    setComplianceDocumentUrl(existing.compliance_document_url ?? null);
    setComplianceAttestedAt(existing.compliance_attested_at ?? null);
  }, [existing]);

  const isPendingReview = existing?.status === "pending_review";
  const isNeedsCorrection = existing?.status === "needs_correction";
  const isRejected = existing?.status === "rejected";
  const isSent = existing?.status === "active" || existing?.status === "closed";
  const isLocked = isPendingReview || isSent;

  const saveDraft = useMutation({
    mutationFn: async () => {
      const payload = surveySchema.parse({
        title,
        // A blank box means no description, not an empty one.
        description: description.trim() ? description : null,
        questions,
        reward_etb: rewardEtb,
        status: "draft",
        compliance_required: complianceRequired,
        compliance_document_url: complianceDocumentUrl,
        compliance_attested_at: complianceAttestedAt,
      });
      if (surveyId) {
        return api<SurveyRecord>(`/surveys/${surveyId}`, { method: "PATCH", body: payload });
      }
      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey) => {
      setSurveyId(survey.id);
      // Editing questions clears cached translations server-side; mirror that here.
      setTranslations(survey.translations ?? {});
      setBanner({ tone: "success", text: "Work-in-progress draft saved." });
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      if (!id) navigate(`/researcher/surveys/${survey.id}/edit`, { replace: true });
    },
    onError: (error) => setBanner({ tone: "error", text: describeError(error) }),
  });

  const saveFinalDraft = useMutation({
    mutationFn: async () => {
      const payload = finalDraftSchema.parse({
        title,
        description: description.trim() ? description : null,
        questions,
        reward_etb: rewardEtb,
        status: "final_draft",
        compliance_required: complianceRequired,
        compliance_document_url: complianceDocumentUrl,
        compliance_attested_at: complianceAttestedAt,
      });
      if (surveyId) {
        return api<SurveyRecord>(`/surveys/${surveyId}`, { method: "PATCH", body: payload });
      }
      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey) => {
      setSurveyId(survey.id);
      setTranslations(survey.translations ?? {});
      setBanner({
        tone: "success",
        text: "Final draft validated and saved. Ready to submit for review and audience allocation!",
      });
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      if (!id) navigate(`/researcher/surveys/${survey.id}/edit`, { replace: true });
    },
    onError: (error) => setBanner({ tone: "error", text: describeError(error) }),
  });

  const translate = useMutation({
    mutationFn: () =>
      api<{ translations: Partial<Record<TargetLanguage, string[]>> }>(
        `/surveys/${surveyId}/translate`,
        { body: { target_languages: ["am", "om"] } },
      ),
    onSuccess: (result) => {
      setTranslations(result.translations);
      setBanner({ tone: "success", text: "Translated into Amharic and Afan Oromo." });
    },
    onError: (error) =>
      setBanner({
        tone: "warning",
        text:
          error instanceof ApiRequestError && error.code === "TRANSLATION_PROVIDER_UNAVAILABLE"
            ? "Translation is unavailable right now. The English version is still live and you can still send."
            : describeError(error),
      }),
  });

  const send = useMutation({
    mutationFn: () =>
      api<{ targeted_count: number; status: string }>(`/surveys/${surveyId}/send`, {
        body: { filters, reward_etb: rewardEtb ?? undefined },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      setBanner({
        tone: "success",
        text: "Survey submitted to Admin Approval Queue. It will be activated once reviewed.",
      });
      navigate(`/researcher`);
    },
    onError: (error) => setBanner({ tone: "error", text: describeError(error) }),
  });

  const draftAi = useMutation({
    mutationFn: () =>
      api<{ title: string; description: string; questions: Question[] }>("/surveys/draft-ai", {
        method: "POST",
        body: { topic: aiTopic.trim() },
      }),
    onSuccess: (result) => {
      setTitle(result.title);
      setDescription(result.description);
      // Give the generated questions unique IDs before saving
      setQuestions(
        result.questions.map((q) => ({
          ...q,
          id: `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          required: true,
        }))
      );
      setAiTopic("");
      setBanner({ tone: "success", text: "AI drafted your survey. Review and save when ready." });
    },
    onError: (error) => setBanner({ tone: "error", text: describeError(error) }),
  });

  // The rewrite runs against the stored question, so there has to be a stored
  // survey to run it against.
  const improveDisabledReason = surveyId ? undefined : "Save the draft to enable AI rewrites.";

  const improveQuestion = async (questionId: string): Promise<ImproveResult> => {
    if (!surveyId) throw new Error(improveDisabledReason);
    return api<ImproveResult>(`/surveys/${surveyId}/improve-question`, {
      body: { question_id: questionId },
    });
  };

  const questionTranslations = useMemo(
    () =>
      questions.map((_, index) => ({
        am: translations.am?.[index],
        om: translations.om?.[index],
      })),
    [questions, translations],
  );

  if (id && isLoading) return <LoadingBlock label="Loading the survey…" />;

  const updateQuestion = (index: number, next: Question) => {
    setQuestions((current) => current.map((item, i) => (i === index ? next : item)));
    // A question edit invalidates its translation; drop the cached set so the
    // researcher is not shown a translation of superseded text.
    if (translations.am || translations.om) setTranslations({});
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setQuestions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (moved) next.splice(target, 0, moved);
      return next;
    });
  };

  return (
    <div>
      <SectionHeading
        actions={
          <>
            <Button
              icon="save"
              disabled={isLocked}
              loading={saveDraft.isPending}
              onClick={() => saveDraft.mutate()}
              variant="outline"
            >
              Save WIP Draft
            </Button>
            <Button
              icon="task_alt"
              disabled={isLocked}
              loading={saveFinalDraft.isPending}
              onClick={() => saveFinalDraft.mutate()}
              variant="secondary"
            >
              Save as Final Draft
            </Button>
            <Button
              icon="translate"
              disabled={!surveyId || isLocked}
              loading={translate.isPending}
              onClick={() => translate.mutate()}
              variant="outline"
            >
              Localize (AM/OR)
            </Button>
            <Button
              disabled={!surveyId || isLocked}
              icon="send"
              loading={send.isPending}
              onClick={() => send.mutate()}
            >
              {isNeedsCorrection ? "Resubmit for Review" : "Submit for Review"}
            </Button>
          </>
        }
        subtitle="Design rigorous research instruments with ethical AI assistance."
        title="Survey Builder"
      />

      {banner ? (
        <div className="mb-stack-md">
          <Notice onDismiss={() => setBanner(null)} tone={banner.tone}>
            {banner.text}
          </Notice>
        </div>
      ) : null}

      {isPendingReview ? (
        <div className="mb-stack-md">
          <Notice tone="info" title="Under Admin Review">
            This survey has been submitted to the Ethosk Review Queue. It is currently locked and will be activated upon admin approval.
          </Notice>
        </div>
      ) : isNeedsCorrection ? (
        <div className="mb-stack-md">
          <Notice tone="warning" title="Action Required — Admin Requested Revisions">
            {existing?.admin_feedback || "The administration requested revisions to this survey. Update the details and resubmit for review."}
          </Notice>
        </div>
      ) : isRejected ? (
        <div className="mb-stack-md">
          <Notice tone="error" title="Submission Rejected">
            {existing?.admin_feedback || "This survey was not approved by administration. Associated escrow funds have been released."}
          </Notice>
        </div>
      ) : isSent ? (
        <div className="mb-stack-md">
          <Notice tone="info" title="This survey is live / completed">
            A sent survey is locked so respondents cannot be shown questions that changed underneath
            them. View its results on the dashboard.
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-stack-md">
          
          {/* AI Drafter (Only show if new blank survey) */}
          {!surveyId && !isLocked && questions.length === 1 && !questions[0]?.text && !title && (
            <div className="rounded-xl border border-primary/20 bg-primary-container/20 p-stack-md">
              <h2 className="flex items-center gap-2 font-title-sm text-title-sm text-primary-fixed mb-2">
                <Icon filled name="auto_awesome" /> AI Survey Drafter
              </h2>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Have a topic but need help designing the survey? Describe your research goal below, and Ethosk AI will draft a title, description, and a set of rigorous questions for you.
              </p>
              <div className="flex gap-2">
                <Input
                  className="flex-1 bg-surface-container-lowest"
                  placeholder="e.g., Digital banking adoption in rural areas"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  disabled={draftAi.isPending}
                />
                <Button 
                  loading={draftAi.isPending} 
                  disabled={!aiTopic.trim() || aiTopic.length < 5} 
                  onClick={() => draftAi.mutate()}
                >
                  Generate Draft
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
            <Field label="Survey title">
              <Input
                disabled={isSent}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Learning Approaches at Hawassa University"
                value={title}
              />
            </Field>

            <div className="mt-stack-md">
              <Field label="Supported Response Formats">
                <div className="grid gap-stack-sm sm:grid-cols-3">
                  <div className="rounded-xl border-2 border-primary bg-surface-container-lowest p-stack-sm shadow-sm">
                    <div className="flex items-center gap-base font-title-sm text-body-md font-semibold text-on-surface">
                      <Icon className="text-primary" name="description" /> Traditional Form
                    </div>
                    <p className="mt-stack-xs font-body-sm text-[11px] text-on-surface-variant">
                      Standard structured web questions.
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-sm">
                    <div className="flex items-center gap-base font-title-sm text-body-md font-semibold text-on-surface">
                      <Icon className="text-secondary" name="forum" /> Conversational Chat
                    </div>
                    <p className="mt-stack-xs font-body-sm text-[11px] text-on-surface-variant">
                      Interactive AI chat turn-taking.
                    </p>
                  </div>
                  <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-stack-sm opacity-60">
                    <div className="flex items-center justify-between font-title-sm text-body-md font-semibold text-on-surface-variant">
                      <div className="flex items-center gap-base">
                        <Icon name="mic" /> Voice Response
                      </div>
                      <span className="rounded bg-surface-variant px-1.5 py-0.5 font-status-badge text-[10px] uppercase font-bold text-on-surface-variant">
                        Coming Soon
                      </span>
                    </div>
                    <p className="mt-stack-xs font-body-sm text-[11px] text-on-surface-variant">
                      Audio IVR & speech-to-text response format.
                    </p>
                  </div>
                </div>
              </Field>
            </div>

            <div className="mt-stack-md">
              <Field
                hint={`Shown to respondents under the title, before they start. ${description.length}/2000`}
                label="Description (optional)"
              >
                <Textarea
                  disabled={isSent}
                  maxLength={2000}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What the study is about, who it is for, and what taking part involves. A respondent who understands the purpose gives more considered answers."
                  rows={5}
                  value={description}
                />
              </Field>
            </div>

            <div className="mt-stack-md max-w-[200px]">
              <Field label="Reward per response (ETB)">
                <Input
                  disabled={isSent}
                  min={0}
                  onChange={(event) =>
                    setRewardEtb(event.target.value === "" ? null : Number(event.target.value))
                  }
                  type="number"
                  value={rewardEtb ?? ""}
                />
              </Field>
            </div>
          </div>

          {/* Step 3: Research Legal & Ethical Compliance (REH-69) */}
          <ComplianceSection
            complianceAttestedAt={complianceAttestedAt}
            complianceDocumentUrl={complianceDocumentUrl}
            complianceRequired={complianceRequired}
            disabled={isSent}
            onChange={({ complianceRequired, complianceDocumentUrl, complianceAttestedAt }) => {
              setComplianceRequired(complianceRequired);
              setComplianceDocumentUrl(complianceDocumentUrl);
              setComplianceAttestedAt(complianceAttestedAt);
            }}
          />

          <div className="space-y-stack-md">
            {questions.map((question, index) => (
              <QuestionEditor
                canRemove={questions.length > 1 && !isSent}
                improveDisabledReason={improveDisabledReason}
                index={index}
                key={question.id}
                onChange={(next) => updateQuestion(index, next)}
                onImprove={improveQuestion}
                onMove={(direction) => moveQuestion(index, direction)}
                onRemove={() =>
                  setQuestions((current) => current.filter((_, i) => i !== index))
                }
                question={question}
                translations={questionTranslations[index]}
              />
            ))}
          </div>

          {!isSent ? (
            <>
              <button
                className="group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant py-stack-lg text-on-surface-variant transition-all hover:border-primary hover:text-primary disabled:opacity-50"
                disabled={questions.length >= MAX_QUESTIONS}
                onClick={() => setQuestions((current) => [...current, blankQuestion()])}
                type="button"
              >
                <Icon
                  className="text-3xl transition-transform group-hover:scale-110"
                  name="add_circle"
                />
                <span className="mt-stack-sm font-title-sm text-body-md">Add New Question</span>
              </button>

              <p className="text-center font-body-sm text-[12px] text-on-surface-variant">
                {questions.length} of {MAX_QUESTIONS} questions. A consistency-check question is added
                automatically for each respondent.
              </p>
            </>
          ) : null}
        </div>

        <div>
          <AudiencePanel
            disabled={isSent}
            filters={filters}
            onChange={setFilters}
            rewardEtb={rewardEtb}
            surveyId={surveyId}
          />
        </div>
      </div>
    </div>
  );
}

function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  return describeFormError(error);
}
