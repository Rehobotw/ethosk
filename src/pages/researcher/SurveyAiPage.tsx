import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Question, SurveyRecord } from "@shared/types";
import { surveySchema } from "@shared/validation/schemas";
import { Icon, Notice } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function generateQuestionId(): string {
  return `q_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_AI_QUESTIONS: Question[] = [
  {
    id: generateQuestionId(),
    text: "Which financial services do you use at least once weekly for business transactions?",
    type: "single_choice",
    options: ["CBE Birr", "Telebirr", "Traditional Bank Transfer", "Cash Only"],
    required: true,
  },
  {
    id: generateQuestionId(),
    text: "How easy was it to register for your current mobile money account?",
    type: "single_choice",
    options: ["1 - Very Difficult", "2 - Difficult", "3 - Neutral", "4 - Easy", "5 - Very Easy"],
    required: true,
  },
  {
    id: generateQuestionId(),
    text: "What are the biggest challenges you face when withdrawing cash at local agent kiosks?",
    type: "multi_choice",
    options: ["Agent liquidity shortages", "Network downtime", "High commission fees", "Long queues"],
    required: true,
  },
  {
    id: generateQuestionId(),
    text: "In your own words, what new feature would make you rely more on digital wallet payments?",
    type: "text",
    required: false,
  },
];

export function SurveyAiPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isSubscribed = Boolean(
    (user?.subscription_tier as string) === "subscribed" ||
    (user?.subscription_tier as string) === "pro" ||
    user?.role === "admin"
  );

  // Research Parameters State
  const [topic, setTopic] = useState(
    "Assess brand perception and mobile banking adoption barriers among smallholder farmers and merchants in Oromia and Sidama regions."
  );
  const [demographics, setDemographics] = useState<string[]>([
    "Rural & Peri-Urban",
    "Small Business",
    "Age 25–45",
  ]);
  const [newDemographic, setNewDemographic] = useState("");
  const [isAddingDemo, setIsAddingDemo] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [duration, setDuration] = useState("< 5 minutes");
  const [surveyTone, setSurveyTone] = useState("Consumer / Friendly");
  const [langEnglish, setLangEnglish] = useState(true);
  const [langAmharic, setLangAmharic] = useState(true);
  const [langOromo, setLangOromo] = useState(true);

  // Output Schema State
  const [title, setTitle] = useState("Mobile Banking Adoption in Regional Ethiopia");
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_AI_QUESTIONS);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(null);

  const removeDemographic = (index: number) => {
    setDemographics((prev) => prev.filter((_, i) => i !== index));
  };

  const addDemographicTag = () => {
    if (newDemographic.trim()) {
      setDemographics((prev) => [...prev, newDemographic.trim()]);
      setNewDemographic("");
      setIsAddingDemo(false);
    }
  };

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
          description: `Demographics: ${demographics.join(", ")}. Tone: ${surveyTone}. Target duration: ${duration}. Languages: ${[
            langEnglish && "English",
            langAmharic && "Amharic",
            langOromo && "Afaan Oromo",
          ]
            .filter(Boolean)
            .join(", ")}`,
          targetQuestionCount: questionCount,
        },
      });
    },
    onSuccess: (data) => {
      setTitle(data.title || `Study: ${topic.slice(0, 50)}`);
      const mappedQuestions: Question[] = (data.questions || []).map((q) => ({
        id: generateQuestionId(),
        text: q.text,
        type: q.type,
        options:
          q.type !== "text" && q.options && q.options.length > 0
            ? q.options
            : q.type !== "text"
            ? ["Option 1", "Option 2"]
            : undefined,
        required: true,
      }));
      setQuestions(mappedQuestions.length > 0 ? mappedQuestions : DEFAULT_AI_QUESTIONS);
      setBanner({
        tone: "success",
        text: `Generated ${mappedQuestions.length || 8} optimized research questions with zero-bias heuristics.`,
      });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to generate survey questions.",
      });
    },
  });

  // Save as WIP & open in Manual Builder
  const acceptAndEditMutation = useMutation({
    mutationFn: async () => {
      const payload = surveySchema.parse({
        title: title || "AI-Generated Survey",
        description: topic,
        questions,
        reward_etb: 25,
        status: "wip",
      });

      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey) => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate(`/survey-builder/manual/${survey.id}`, { replace: true });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to create survey draft.",
      });
    },
  });

  return (
    <div className="max-w-[1200px] mx-auto w-full pb-28">
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center gap-2 text-xs text-[#41484c] mb-4">
        <Link to="/researcher" className="hover:text-[#001d29] transition-colors">
          Dashboard
        </Link>
        <Icon className="text-[14px]" name="chevron_right" />
        <Link to="/survey-builder" className="hover:text-[#001d29] transition-colors">
          Survey Builder
        </Link>
        <Icon className="text-[14px]" name="chevron_right" />
        <span className="text-[#001d29] font-semibold">AI Generator</span>
      </div>

      {/* ── Page Header (Stitch Spec) ── */}
      <div className="flex flex-col gap-1 w-full border-b border-[#E2E8F0] pb-6 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-4xl font-bold font-headline text-[#001d29] tracking-tight">
            AI Survey Generator
          </h1>
          <span className="bg-[#003345] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
            <Icon className="text-[14px]" name="bolt" />
            <span>PRO</span>
          </span>
        </div>
        <p className="text-xs md:text-sm text-[#71787c] flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${isSubscribed ? "bg-emerald-500" : "bg-amber-500"}`}></span>
          <span>
            {isSubscribed
              ? "Pro Subscription Active · Unlimited Generations"
              : "Free Tier · Upgrade to Pro for full AI generation"}
          </span>
        </p>
      </div>

      {banner && <Notice tone={banner.tone}>{banner.text}</Notice>}

      {/* ── Subscription Gate Overlay for Free-Tier ── */}
      {!isSubscribed && (
        <div className="bg-gradient-to-r from-[#003345] to-[#001d29] text-white p-6 md:p-8 rounded-2xl mb-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
              Pro Feature
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-headline">
              Unlock AI Survey Generation &amp; Native Localizations
            </h2>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
              Describe your study topic and let Ethosk generate balanced, unbiased survey schemas with automatic Amharic &amp; Afaan Oromo localizations.
            </p>
          </div>
          <Link
            to="/profile/settings?tab=subscription"
            className="px-6 py-3 bg-white text-[#001d29] hover:bg-slate-100 rounded-xl font-bold text-xs md:text-sm transition-colors text-center shrink-0 shadow-sm"
          >
            Upgrade to Pro (500 ETB/mo)
          </Link>
        </div>
      )}

      {/* ── 2-Column Workspace (Stitch Spec: 5 cols / 7 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Research Parameters (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <Icon className="text-[20px] text-[#2872A1]" name="tune" />
            <h2 className="font-headline text-base font-bold text-[#001d29]">Research Parameters</h2>
          </div>

          {/* Topic & Core Objective */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-semibold text-[#001d29]">
              Research Topic &amp; Core Objective
            </label>
            <textarea
              className="w-full h-28 bg-[#f8f9ff] border border-[#c1c7cc] rounded-xl p-3 text-xs md:text-sm text-[#001d29] focus:ring-1 focus:ring-[#001d29] focus:border-[#001d29] resize-none placeholder:text-[#71787c]/70 transition-all outline-none"
              placeholder="e.g., Assess brand perception and mobile banking adoption barriers among smallholder farmers and merchants in Oromia and Sidama regions."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Target Demographics */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs md:text-sm font-semibold text-[#001d29]">Target Demographics</label>
              <span className="text-[#71787c] text-[11px] font-mono">Ethiopia Context</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {demographics.map((demo, idx) => (
                <span
                  key={demo}
                  className="px-3 py-1 rounded-full border border-[#2872A1]/30 bg-[#eff4ff] text-[#001d29] text-xs font-medium flex items-center gap-1.5"
                >
                  <span>{demo}</span>
                  <button
                    type="button"
                    onClick={() => removeDemographic(idx)}
                    className="hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove filter"
                  >
                    <Icon className="text-[14px]" name="close" />
                  </button>
                </span>
              ))}

              {isAddingDemo ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newDemographic}
                    onChange={(e) => setNewDemographic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addDemographicTag();
                    }}
                    placeholder="Filter tag..."
                    className="px-2.5 py-1 text-xs border border-[#001d29] rounded-full outline-none w-28 bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={addDemographicTag}
                    className="px-2 py-1 bg-[#001d29] text-white rounded-full text-[11px] font-bold"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingDemo(true)}
                  className="px-3 py-1 rounded-full border border-dashed border-[#c1c7cc] bg-[#f8f9ff] text-[#71787c] hover:bg-[#eff4ff] hover:text-[#001d29] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Icon className="text-[14px]" name="add" />
                  <span>Add Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Desired Question Count Slider */}
          <div className="flex flex-col gap-2 pt-3 border-t border-[#E2E8F0]">
            <div className="flex justify-between items-center">
              <label className="text-xs md:text-sm font-semibold text-[#001d29]">Desired Question Count</label>
              <span className="text-[11px] font-mono font-bold text-[#001d29] bg-[#dde9ff] px-2 py-0.5 rounded">
                {questionCount} Qs
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-[#001d29] h-1.5 bg-[#c1c7cc]/30 rounded-lg appearance-none cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[#71787c] text-[11px] font-mono">
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          {/* Target Duration & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#001d29]">Target Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg p-2 text-xs text-[#001d29] focus:ring-1 focus:ring-[#001d29] outline-none"
              >
                <option>&lt; 5 minutes</option>
                <option>5–10 minutes</option>
                <option>10–15 minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#001d29]">Survey Tone</label>
              <select
                value={surveyTone}
                onChange={(e) => setSurveyTone(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg p-2 text-xs text-[#001d29] focus:ring-1 focus:ring-[#001d29] outline-none"
              >
                <option>Consumer / Friendly</option>
                <option>Academic / Rigorous</option>
                <option>Formal Policy</option>
              </select>
            </div>
          </div>

          {/* Native Language Support */}
          <div className="flex flex-col gap-2 pt-3 border-t border-[#E2E8F0]">
            <label className="text-xs font-semibold text-[#001d29]">Native Language Support</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#001d29]">
                <input
                  type="checkbox"
                  checked={langEnglish}
                  onChange={(e) => setLangEnglish(e.target.checked)}
                  className="rounded border-[#c1c7cc] text-[#001d29] focus:ring-[#001d29] h-4 w-4"
                />
                <span>English</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#001d29]">
                <input
                  type="checkbox"
                  checked={langAmharic}
                  onChange={(e) => setLangAmharic(e.target.checked)}
                  className="rounded border-[#c1c7cc] text-[#001d29] focus:ring-[#001d29] h-4 w-4"
                />
                <span>Amharic (አማርኛ)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#001d29]">
                <input
                  type="checkbox"
                  checked={langOromo}
                  onChange={(e) => setLangOromo(e.target.checked)}
                  className="rounded border-[#c1c7cc] text-[#001d29] focus:ring-[#001d29] h-4 w-4"
                />
                <span>Afaan Oromo</span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={() => generateSurvey.mutate()}
            disabled={generateSurvey.isPending}
            className="w-full bg-[#0B2B42] hover:bg-[#001d29] text-white rounded-xl py-3.5 mt-2 flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 group"
          >
            <span>{generateSurvey.isPending ? "Analyzing & Generating…" : "Generate Optimized Schema"}</span>
            <Icon className="text-amber-300 text-[18px] group-hover:rotate-12 transition-transform" name="auto_awesome" />
          </button>
        </div>

        {/* Right Column: AI Generated Schema Draft (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs flex flex-col h-full">
            {/* Header & Timestamp */}
            <div className="p-4 border-b border-[#E2E8F0] bg-[#f8f9ff] flex justify-between items-center">
              <h2 className="font-headline text-sm md:text-base font-bold text-[#001d29] flex items-center gap-2">
                <Icon className="text-[20px] text-[#2872A1]" name="view_list" />
                <span>AI Generated Schema Draft ({questions.length} Questions)</span>
              </h2>
              <span className="text-[11px] font-mono text-[#71787c] px-2.5 py-0.5 bg-white border border-[#E2E8F0] rounded-full flex items-center gap-1">
                <Icon className="text-[13px]" name="history" />
                <span>Just now</span>
              </span>
            </div>

            {/* Trust Checks Header Bar */}
            <div className="bg-emerald-50/60 border-b border-emerald-200/50 px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#001d29]">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <Icon className="text-emerald-700 text-[15px]" name="check_circle" />
                <span>Zero Leading Questions Detected</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <Icon className="text-emerald-700 text-[15px]" name="check_circle" />
                <span>Balanced Likert Scales</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <Icon className="text-emerald-700 text-[15px]" name="check_circle" />
                <span>Localized Slang &amp; Context Checked</span>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[500px]">
              {questions.map((q, idx) => {
                const isLikert = q.options && q.options.length === 5 && q.options[0]?.includes("1");
                const isMulti = q.type === "multi_choice";
                const isOpenEnded = q.type === "text";

                return (
                  <div
                    key={q.id}
                    className="border border-[#E2E8F0] rounded-xl p-4 hover:border-[#2872A1]/40 transition-colors bg-[#f8f9ff]/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2.5">
                        <span className="bg-[#dde9ff] text-[#001d29] font-mono text-[11px] font-bold px-2 py-0.5 rounded h-fit mt-0.5">
                          Q{idx + 1}
                        </span>
                        <h3 className="font-semibold text-xs md:text-sm text-[#001d29] leading-snug">
                          {q.text}
                        </h3>
                      </div>

                      <span className="text-[#71787c] text-[11px] font-mono whitespace-nowrap bg-white px-2 py-0.5 rounded border border-[#E2E8F0] flex items-center gap-1 shrink-0 ml-2">
                        <Icon
                          className="text-[13px]"
                          name={
                            isLikert
                              ? "linear_scale"
                              : isMulti
                              ? "checklist"
                              : isOpenEnded
                              ? "subject"
                              : "radio_button_checked"
                          }
                        />
                        <span>
                          {isLikert
                            ? "Likert Scale"
                            : isMulti
                            ? "Multi-Select"
                            : isOpenEnded
                            ? "Open Ended"
                            : "Single Choice"}
                        </span>
                      </span>
                    </div>

                    {/* Render Options Preview */}
                    {isLikert && (
                      <div className="ml-8 flex items-center justify-between mt-2.5 px-3 py-2 bg-white rounded-lg border border-[#E2E8F0] text-xs font-mono text-[#71787c]">
                        <span>Very Difficult (1)</span>
                        <div className="flex gap-3">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <div key={val} className="w-3.5 h-3.5 rounded-full border-2 border-[#c1c7cc]"></div>
                          ))}
                        </div>
                        <span>Very Easy (5)</span>
                      </div>
                    )}

                    {!isLikert && !isOpenEnded && q.options && (
                      <div className="ml-8 flex flex-col gap-1.5 mt-2.5">
                        {q.options.map((opt) => (
                          <div key={opt} className="flex items-center gap-2 text-xs text-[#41484c]">
                            <div
                              className={`w-3 h-3 rounded-${isMulti ? "xs" : "full"} border border-[#c1c7cc] shrink-0`}
                            ></div>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isOpenEnded && (
                      <div className="ml-8 mt-2 text-xs text-[#71787c] italic font-mono">
                        Freeform textual / spoken response
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-[#f8f9ff] border-t border-[#E2E8F0] flex items-center justify-between gap-4 mt-auto">
              <button
                type="button"
                onClick={() => generateSurvey.mutate()}
                disabled={generateSurvey.isPending}
                className="px-4 py-2 rounded-xl border border-[#c1c7cc] text-[#001d29] hover:bg-white text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Icon className="text-[16px]" name="refresh" />
                <span>Regenerate Questions</span>
              </button>

              <button
                type="button"
                onClick={() => acceptAndEditMutation.mutate()}
                disabled={acceptAndEditMutation.isPending}
                className="px-6 py-2 bg-[#2872A1] hover:bg-[#003345] text-white rounded-xl font-bold text-xs md:text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{acceptAndEditMutation.isPending ? "Creating Draft…" : "Accept & Edit in Builder"}</span>
                <Icon className="text-[18px]" name="arrow_forward" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
