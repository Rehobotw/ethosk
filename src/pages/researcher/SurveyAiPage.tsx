import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Question, SurveyRecord } from "@shared/types";
import { surveySchema } from "@shared/validation/schemas";
import {
  Button,
  Card,
  Icon,
  Notice,
  SectionHeading,
} from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function generateQuestionId(): string {
  return `q_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SurveyAiPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isSubscribed = Boolean(
    (user?.subscription_tier as string) === "subscribed" ||
    (user?.subscription_tier as string) === "pro" ||
    user?.role === "admin"
  );

  // Form input state
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Generated survey state
  const [title, setTitle] = useState("AI-Generated Survey");
  const [description, setDescription] = useState("");
  const [rewardEtb, setRewardEtb] = useState<number>(25);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(null);

  // AI Generation Mutation
  const generateSurvey = useMutation({
    mutationFn: async () => {
      setBanner(null);
      return api<{
        title: string;
        description: string;
        questions: {
          text: string;
          type: "single_choice" | "multi_choice" | "text";
          options?: string[];
        }[];
      }>("/surveys/ai-generate", {
        body: {
          topic: topic.trim(),
          description: additionalContext.trim() || undefined,
          targetQuestionCount: questionCount,
        },
      });
    },
    onSuccess: (data) => {
      setTitle(data.title || `Study: ${topic.slice(0, 50)}`);
      setDescription(data.description || additionalContext);
      const mappedQuestions: Question[] = (data.questions || []).map((q) => ({
        id: generateQuestionId(),
        text: q.text,
        type: q.type,
        options: q.type !== "text" && q.options && q.options.length > 0 ? q.options : (q.type !== "text" ? ["Option 1", "Option 2"] : undefined),
        required: true,
      }));
      setQuestions(mappedQuestions);
      setIsGenerated(true);
      setBanner({
        tone: "success",
        text: `Generated ${mappedQuestions.length} draft questions based on your research objective. You can review, refine, or add more questions below.`,
      });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to generate survey questions.",
      });
    },
  });

  // Question Management Actions
  const updateQuestionText = (index: number, newText: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = { ...target, text: newText };
      return next;
    });
  };

  const updateQuestionType = (index: number, newType: Question["type"]) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[index];
      if (!q) return prev;
      let options = q.options;
      if (newType === "text") {
        options = undefined;
      } else if (!options || options.length === 0) {
        options = ["Option 1", "Option 2"];
      }
      next[index] = { ...q, type: newType, options };
      return next;
    });
  };

  const updateOptionText = (qIndex: number, optIndex: number, newText: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q || !q.options) return prev;
      const nextOpts = [...q.options];
      nextOpts[optIndex] = newText;
      next[qIndex] = { ...q, options: nextOpts };
      return next;
    });
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q) return prev;
      const nextOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
      next[qIndex] = { ...q, options: nextOpts };
      return next;
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q || !q.options || q.options.length <= 1) return prev;
      const nextOpts = q.options.filter((_, i) => i !== optIndex);
      next[qIndex] = { ...q, options: nextOpts };
      return next;
    });
  };

  const toggleRequired = (index: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = { ...target, required: !target.required };
      return next;
    });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const current = next[index];
      const target = next[targetIdx];
      if (!current || !target) return prev;
      next[index] = target;
      next[targetIdx] = current;
      return next;
    });
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const addBlankQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateQuestionId(),
        text: "",
        type: "single_choice",
        options: ["Option 1", "Option 2"],
        required: true,
      },
    ]);
  };

  // Save Mutations
  const saveSurvey = useMutation({
    mutationFn: async (targetStatus: "wip" | "final_draft") => {
      const payload = surveySchema.parse({
        title: title.trim() ? title : "AI-Generated Survey",
        description: description.trim() ? description : null,
        questions,
        reward_etb: rewardEtb,
        status: targetStatus,
      });

      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey, targetStatus) => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      if (targetStatus === "final_draft") {
        navigate("/researcher/surveys", { replace: true });
      } else {
        navigate(`/survey-builder/manual/${survey.id}`, { replace: true });
      }
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to save survey.",
      });
    },
  });

  // ── Subscription Gate Screen for Free Tier (§4.3.4) ──
  if (!isSubscribed) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6 text-center font-body-md">
        <Link
          to="/survey-builder"
          className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline mb-2"
        >
          <Icon className="text-[18px]" name="arrow_back" />
          Back to Survey Creation
        </Link>

        <Card className="p-8 space-y-5 border border-primary/20 shadow-md bg-gradient-to-b from-[#f3e5f5]/30 to-white">
          <div className="w-16 h-16 rounded-2xl bg-[#6a1b9a]/10 text-[#6a1b9a] flex items-center justify-center mx-auto">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#6a1b9a]/10 text-[#6a1b9a] text-xs font-bold uppercase tracking-wider">
              Pro Feature
            </span>
            <h2 className="text-2xl font-bold text-[#0D253A] mt-3 mb-2 font-headline-lg">
              Upgrade to Access AI Survey Generator
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
              AI survey drafting and real-time question optimization are exclusive to Subscribed researcher tiers.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/researcher/subscription" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto font-bold" icon="lock_open">
                Upgrade to Pro
              </Button>
            </Link>
            <Link to="/survey-builder" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to Creation Hub
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg max-w-4xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        to="/survey-builder"
        className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
      >
        <Icon className="text-[18px]" name="arrow_back" />
        Back to Survey Creation
      </Link>

      <SectionHeading
        subtitle="Describe your research topic and goal, and our AI will draft structured survey questions for you."
        title="AI Survey Generator"
      />

      {banner && <Notice tone={banner.tone}>{banner.text}</Notice>}

      {/* ── Prompt & Configuration Card ── */}
      <Card className="p-6 md:p-8 space-y-5 border border-outline-variant/40 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Research Objective or Topic <span className="text-error">*</span>
          </label>
          <textarea
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Assessing consumer adoption and satisfaction with Telebirr digital payment services in urban Addis Ababa among retail merchants."
            className="w-full p-3.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Additional Context or Constraints (Optional)
            </label>
            <input
              type="text"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. Target age 18-35, focusing on transaction fees and reliability"
              className="w-full p-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Target Question Count
            </label>
            <div className="flex items-center gap-2">
              {[3, 5, 8, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    questionCount === count
                      ? "bg-[#6a1b9a] border-[#6a1b9a] text-white"
                      : "bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={generateSurvey.isPending || !topic.trim()}
            onClick={() => generateSurvey.mutate()}
            className="px-6 py-3 bg-[#6a1b9a] hover:bg-[#4a148c] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span>{generateSurvey.isPending ? "Generating Draft…" : "Generate Survey Draft"}</span>
          </button>
        </div>
      </Card>

      {/* ── Generated Questions List & Editor ── */}
      {isGenerated && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#0D253A]">
                Review &amp; Refine Questions ({questions.length})
              </h2>
              <p className="text-xs text-on-surface-variant">
                You can edit question wording, change formats, reorder, or add questions before saving.
              </p>
            </div>
          </div>

          {/* Survey Metadata Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Survey Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm font-semibold text-on-surface outline-none"
                placeholder="Survey Title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface outline-none"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Reward per Response (ETB)
                </label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={rewardEtb}
                  onChange={(e) => setRewardEtb(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Questions Cards */}
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <Card key={q.id || qIndex} className="p-5 space-y-4 border border-outline-variant/40 shadow-xs">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#6a1b9a]/15 text-[#6a1b9a] font-bold text-xs flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestionType(qIndex, e.target.value as Question["type"])}
                      className="px-2.5 py-1 rounded-md border border-outline-variant/40 bg-surface-container-low text-xs font-semibold text-on-surface outline-none"
                    >
                      <option value="single_choice">Single Choice (Radio)</option>
                      <option value="multi_choice">Multiple Choice (Checkbox)</option>
                      <option value="text">Open-Ended (Text)</option>
                    </select>
                  </div>

                  {/* Move Up/Down, Required, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={qIndex === 0}
                      onClick={() => moveQuestion(qIndex, "up")}
                      className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <Icon className="text-[18px]" name="arrow_upward" />
                    </button>
                    <button
                      type="button"
                      disabled={qIndex === questions.length - 1}
                      onClick={() => moveQuestion(qIndex, "down")}
                      className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <Icon className="text-[18px]" name="arrow_downward" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRequired(qIndex)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        q.required ? "bg-amber-100 text-amber-900" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {q.required ? "Required" : "Optional"}
                    </button>
                    <button
                      type="button"
                      disabled={questions.length <= 1}
                      onClick={() => deleteQuestion(qIndex)}
                      className="p-1 rounded text-error hover:bg-error/10 disabled:opacity-30 cursor-pointer"
                      title="Delete Question"
                    >
                      <Icon className="text-[18px]" name="delete" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  placeholder="Enter question text…"
                  className="w-full p-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface font-medium outline-none"
                />

                {/* Options List */}
                {q.type !== "text" && (
                  <div className="space-y-2 pl-4 border-l-2 border-[#6a1b9a]/20">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Answer Options
                    </p>
                    {(q.options || []).map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant w-4 text-right">
                          {String.fromCharCode(65 + optIndex)})
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1 p-2 rounded-md border border-outline-variant/30 text-xs bg-white text-on-surface outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          disabled={(q.options?.length || 0) <= 1}
                          onClick={() => removeOption(qIndex, optIndex)}
                          className="p-1 text-on-surface-variant hover:text-error cursor-pointer disabled:opacity-30"
                          title="Remove option"
                        >
                          <Icon className="text-[16px]" name="close" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-xs text-[#6a1b9a] font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Icon className="text-[14px]" name="add" />
                      Add Option
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Add Blank Question Button */}
          <button
            type="button"
            onClick={addBlankQuestion}
            className="w-full py-3 border-2 border-dashed border-outline-variant/60 rounded-xl text-xs font-bold text-[#6a1b9a] hover:bg-[#6a1b9a]/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Icon className="text-[18px]" name="add_circle" />
            Add Another Question
          </button>

          {/* ── Save Actions Bar ── */}
          <div className="p-4 bg-white rounded-xl border border-outline-variant/30 shadow-md flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="text-xs text-on-surface-variant">
              <span>{questions.length} questions drafted by AI</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={saveSurvey.isPending || questions.length === 0}
                onClick={() => saveSurvey.mutate("wip")}
                type="button"
                icon="save"
              >
                {saveSurvey.isPending ? "Saving…" : "Save Draft (WIP)"}
              </Button>
              <Button
                disabled={saveSurvey.isPending || questions.length === 0}
                onClick={() => saveSurvey.mutate("final_draft")}
                type="button"
                icon="check_circle"
              >
                {saveSurvey.isPending ? "Saving…" : "Save as Final Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
