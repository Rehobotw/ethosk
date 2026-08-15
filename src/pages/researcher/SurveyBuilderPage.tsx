import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Question, SurveyRecord, RespondentWallet } from "@shared/types";
import { surveySchema } from "@shared/validation/schemas";
import {
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";

function blankQuestion(type: Question["type"] = "single_choice"): Question {
  return {
    id: `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    text: "",
    type,
    options: type === "text" ? undefined : ["", ""],
    required: true,
  };
}

export function SurveyBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [surveyId, setSurveyId] = useState<string | null>(id ?? null);
  const [title, setTitle] = useState("Customer Perception Study 2026");
  const [description, setDescription] = useState("");
  const [rewardEtb, setRewardEtb] = useState<number>(25);
  const [targetSampleSize, setTargetSampleSize] = useState<number>(100);
  const [activeStep, setActiveStep] = useState<"builder" | "wizard_filters" | "wizard_budget" | "submitted">("builder");

  // Filter state
  const [minAge, setMinAge] = useState<string>("18");
  const [maxAge, setMaxAge] = useState<string>("45");
  const [gender, setGender] = useState<string>("any");
  const [educationLevel, setEducationLevel] = useState<string>("all");
  const [profession, setProfession] = useState<string>("any");
  const [incomeRange, setIncomeRange] = useState<string>("any");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Addis Ababa", "Oromia"]);
  const [complianceDocName, setComplianceDocName] = useState<string | null>("ethiopia_irb_approval_2026.pdf");

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      text: "How would you rate your overall satisfaction with digital banking services in Ethiopia over the past 12 months?",
      type: "single_choice",
      options: [
        "Extremely Satisfied",
        "Somewhat Satisfied",
        "Neutral",
        "Somewhat Dissatisfied",
      ],
      required: true,
    },
    {
      id: "q2",
      text: "What specific features of mobile money do you find most valuable for your daily transactions?",
      type: "text",
      required: false,
    },
  ]);
  const [activeQuestionId, setActiveQuestionId] = useState<string>("q1");
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => api<SurveyRecord>(`/surveys/${id}`),
    enabled: Boolean(id),
  });

  const { data: researcherWallet } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: RespondentWallet }>("/wallet/respondent").catch(() => null),
  });

  const availableBalance = researcherWallet?.wallet?.available_etb ?? 5000;
  const totalEscrowRequired = useMemo(() => targetSampleSize * rewardEtb, [targetSampleSize, rewardEtb]);
  const hasEnoughFunds = availableBalance >= totalEscrowRequired;

  useEffect(() => {
    if (!existing) return;
    setSurveyId(existing.id);
    setTitle(existing.title);
    setDescription(existing.description ?? "");
    if (existing.reward_etb) setRewardEtb(existing.reward_etb);
    if (existing.questions && existing.questions.length > 0) {
      setQuestions(existing.questions);
      if (existing.questions[0]) {
        setActiveQuestionId(existing.questions[0].id);
      }
    }
  }, [existing]);

  const saveSurvey = useMutation({
    mutationFn: async (targetStatus: "wip" | "final_draft" = "wip") => {
      const payload = surveySchema.parse({
        title: title.trim() ? title : "Untitled Survey",
        description: description.trim() ? description : null,
        questions,
        reward_etb: rewardEtb,
        status: targetStatus,
      });
      if (surveyId) {
        return api<SurveyRecord>(`/surveys/${surveyId}`, { method: "PATCH", body: payload });
      }
      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey, targetStatus) => {
      setSurveyId(survey.id);
      const msg =
        targetStatus === "final_draft"
          ? "Saved as Final Draft. Ready for sending."
          : "Work-in-progress draft saved.";
      setBanner({ tone: "success", text: msg });
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      if (!id) navigate(`/researcher/surveys/${survey.id}/edit`, { replace: true });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to save survey",
      });
    },
  });

  // Step 6 Mandatory Admin Review Gate Mutation
  const submitToAdminReview = useMutation({
    mutationFn: async () => {
      let activeSurveyId = surveyId;
      if (!activeSurveyId) {
        const saved = await saveSurvey.mutateAsync("final_draft");
        activeSurveyId = saved.id;
      }
      return api<{ targeted_count: number; status: string; reserved_etb: number }>(
        `/surveys/${activeSurveyId}/send`,
        {
          body: {
            reward_etb: rewardEtb,
            filters: {
              regions: selectedRegions,
              genders: gender !== "any" ? [gender] : undefined,
              education_levels: educationLevel !== "all" ? [educationLevel] : undefined,
            },
          },
        },
      );
    },
    onSuccess: async () => {
      setActiveStep("submitted");
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Submission failed",
      });
    },
  });

  const addQuestion = (type: Question["type"] = "single_choice") => {
    const q = blankQuestion(type);
    setQuestions((prev) => [...prev, q]);
    setActiveQuestionId(q.id);
  };

  const updateQuestion = (id: string, partial: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...partial } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const duplicateQuestion = (id: string) => {
    const orig = questions.find((q) => q.id === id);
    if (!orig) return;
    const copy: Question = {
      ...orig,
      id: `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      text: `${orig.text} (Copy)`,
    };
    setQuestions((prev) => [...prev, copy]);
    setActiveQuestionId(copy.id);
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] }
          : q
      )
    );
  };

  const updateOption = (questionId: string, optIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || !q.options) return q;
        const nextOpts = [...q.options];
        nextOpts[optIndex] = text;
        return { ...q, options: nextOpts };
      })
    );
  };

  const removeOption = (questionId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || !q.options || q.options.length <= 2) return q;
        return { ...q, options: q.options.filter((_, idx) => idx !== optIndex) };
      })
    );
  };

  const toggleRegion = (reg: string) => {
    setSelectedRegions((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  if (isLoading) return <LoadingBlock label="Loading survey builder workspace…" />;

  // ══════════════════════════════════════════════════════════════════════
  // STEP 6: SUBMITTED CONFIRMATION SCREEN (REH-70 Mandatory Admin Gate)
  // ══════════════════════════════════════════════════════════════════════
  if (activeStep === "submitted") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center font-['Inter',sans-serif]">
        <div className="w-16 h-16 rounded-full bg-[#cbe2fe]/40 text-[#00456d] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="material-symbols-outlined text-3xl">hourglass_top</span>
        </div>

        <h1 className="font-['Newsreader',serif] text-3xl font-bold text-[#181c1e] mb-3">
          Survey Submitted for Admin Review
        </h1>

        <p className="text-[#41474f] text-base mb-8 leading-relaxed">
          Your survey budget of <strong className="text-[#181c1e] font-bold">{totalEscrowRequired.toLocaleString()} ETB</strong> has been reserved in escrow.
          Pursuant to national research guidelines, our compliance team is verifying your ethical clearance document and survey questions.
        </p>

        <div className="bg-white rounded-xl border border-[#c1c7d0] p-6 text-left mb-8 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-[#c1c7d0]/30 pb-3">
            <span className="text-[#41474f]">Survey Title</span>
            <span className="font-semibold text-[#181c1e]">{title}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-[#c1c7d0]/30 pb-3">
            <span className="text-[#41474f]">Compliance Review SLA</span>
            <span className="font-semibold text-[#00456d]">24 – 48 Hours</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-[#c1c7d0]/30 pb-3">
            <span className="text-[#41474f]">Target Sample Size</span>
            <span className="font-semibold text-[#181c1e]">{targetSampleSize} Verified Respondents</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#41474f]">Current Status</span>
            <span className="inline-flex items-center gap-1 bg-[#F59E0B]/15 text-[#b06000] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">pending</span>
              Pending Review
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="px-6 py-3 rounded-lg font-semibold text-sm bg-[#1d5d8a] text-white hover:bg-[#00456d] transition-colors shadow-xs cursor-pointer"
            onClick={() => navigate("/researcher/surveys")}
            type="button"
          >
            Go to My Surveys
          </button>
          <button
            className="px-6 py-3 rounded-lg font-semibold text-sm bg-white border border-[#c1c7d0] text-[#41474f] hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => navigate("/researcher")}
            type="button"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // POSTING WIZARD (Steps 3 & 4: Configure Filters & Sample Budget)
  // ══════════════════════════════════════════════════════════════════════
  if (activeStep === "wizard_filters" || activeStep === "wizard_budget") {
    return (
      <div className="max-w-[1280px] mx-auto p-4 md:p-8 font-['Inter',sans-serif] text-[#181c1e]">
        {/* Title & Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Newsreader',serif] text-3xl font-bold text-[#181c1e] mb-1">
              {activeStep === "wizard_filters" ? "Configure Filters & Approval" : "Sample Size & Budget"}
            </h1>
            <p className="text-sm text-[#41474f]">
              {activeStep === "wizard_filters"
                ? "Define your target demographic and attach research clearance documents."
                : "Calculate respondent rewards and reserve survey escrow."}
            </p>
          </div>
          <button
            className="text-xs font-semibold text-[#41474f] hover:text-[#181c1e] px-3 py-1.5 rounded-lg border border-[#c1c7d0] bg-white cursor-pointer"
            onClick={() => setActiveStep("builder")}
            type="button"
          >
            ← Back to Question Builder
          </button>
        </div>

        {/* 5-Step Stepper Header (Stitch Screen af2c29775e6a4c6a998a11c30d40b079) */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FA] px-2 cursor-pointer" onClick={() => setActiveStep("builder")}>
              <div className="w-8 h-8 rounded-full bg-[#1d5d8a] text-white flex items-center justify-center font-bold text-xs">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-[11px] text-[#41474f] font-medium hidden sm:block">1. Questions</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FA] px-2">
              <div className="w-8 h-8 rounded-full bg-[#1d5d8a] text-white flex items-center justify-center font-bold text-xs">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="text-[11px] text-[#41474f] font-medium hidden sm:block">2. Format</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FA] px-2 cursor-pointer" onClick={() => setActiveStep("wizard_filters")}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                activeStep === "wizard_filters"
                  ? "bg-[#1d5d8a] text-white ring-4 ring-[#1d5d8a]/20"
                  : "bg-[#1d5d8a] text-white"
              }`}>
                3
              </div>
              <span className={`text-[11px] font-bold hidden sm:block ${activeStep === "wizard_filters" ? "text-[#1d5d8a]" : "text-[#41474f]"}`}>
                3. Filters &amp; IRB
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FA] px-2 cursor-pointer" onClick={() => setActiveStep("wizard_budget")}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                activeStep === "wizard_budget"
                  ? "bg-[#1d5d8a] text-white ring-4 ring-[#1d5d8a]/20"
                  : "bg-white border border-[#c1c7d0] text-[#41474f]"
              }`}>
                4
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${activeStep === "wizard_budget" ? "text-[#1d5d8a] font-bold" : "text-[#41474f]"}`}>
                4. Sample &amp; Budget
              </span>
            </div>

            {/* Step 5 / 6 */}
            <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FA] px-2">
              <div className="w-8 h-8 rounded-full bg-white border border-[#c1c7d0] text-[#41474f] flex items-center justify-center font-bold text-xs">
                5
              </div>
              <span className="text-[11px] text-[#41474f] font-medium hidden sm:block">5. Admin Review</span>
            </div>
          </div>
        </div>

        {/* Wizard Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {activeStep === "wizard_filters" ? (
              <>
                {/* Section 1: Ethical Approval / IRB Document */}
                <section className="bg-white rounded-xl border border-[#c1c7d0] p-6 shadow-xs">
                  <h2 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e] mb-4 pb-2 border-b border-[#c1c7d0]/30">
                    Research Approval Document
                  </h2>

                  {complianceDocName ? (
                    <div className="flex items-center justify-between p-4 bg-[#f8f9ff] rounded-lg border border-[#c1c7d0]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#cbe2fe]/40 text-[#00456d] rounded-md">
                          <span className="material-symbols-outlined">attach_file</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#181c1e]">{complianceDocName}</p>
                          <span className="text-xs text-[#41474f]">2.4 MB · Ready for review</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#cbe2fe]/40 text-[#00456d]">
                          Pending Admin Review
                        </span>
                        <button
                          className="text-error p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          onClick={() => setComplianceDocName(null)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-[#c1c7d0] rounded-lg p-6 text-center hover:border-[#1d5d8a] transition-colors cursor-pointer"
                      onClick={() => setComplianceDocName("institutional_irb_clearance.pdf")}
                    >
                      <span className="material-symbols-outlined text-3xl text-[#41474f] mb-2">upload_file</span>
                      <p className="text-sm font-semibold text-[#181c1e]">Click to upload ethical clearance or IRB certificate</p>
                      <p className="text-xs text-[#41474f] mt-1">PDF, DOCX up to 10MB.</p>
                    </div>
                  )}
                </section>

                {/* Section 2: Demographic Filters */}
                <section className="bg-white rounded-xl border border-[#c1c7d0] p-6 shadow-xs space-y-5">
                  <h2 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e] mb-4 pb-2 border-b border-[#c1c7d0]/30">
                    Target Audience Filters
                  </h2>

                  {/* Age Range */}
                  <div>
                    <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                      Age Range
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        className="w-24 border border-[#c1c7d0] rounded-md px-3 py-2 text-sm focus:border-[#1d5d8a] outline-none"
                        onChange={(e) => setMinAge(e.target.value)}
                        placeholder="Min"
                        type="number"
                        value={minAge}
                      />
                      <span className="text-[#41474f]">—</span>
                      <input
                        className="w-24 border border-[#c1c7d0] rounded-md px-3 py-2 text-sm focus:border-[#1d5d8a] outline-none"
                        onChange={(e) => setMaxAge(e.target.value)}
                        placeholder="Max"
                        type="number"
                        value={maxAge}
                      />
                    </div>
                  </div>

                  {/* Gender & Education */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                        Gender
                      </label>
                      <select
                        className="w-full border border-[#c1c7d0] rounded-md px-3 py-2 text-sm focus:border-[#1d5d8a] outline-none bg-white"
                        onChange={(e) => setGender(e.target.value)}
                        value={gender}
                      >
                        <option value="any">Any Gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                        Education Level
                      </label>
                      <select
                        className="w-full border border-[#c1c7d0] rounded-md px-3 py-2 text-sm focus:border-[#1d5d8a] outline-none bg-white"
                        onChange={(e) => setEducationLevel(e.target.value)}
                        value={educationLevel}
                      >
                        <option value="all">All Education Levels</option>
                        <option value="high_school">High School</option>
                        <option value="bachelor">Bachelor's Degree</option>
                        <option value="master">Master's Degree or Higher</option>
                      </select>
                    </div>
                  </div>

                  {/* Region Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                      Target Regions (Ethiopia)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Addis Ababa", "Oromia", "Amhara", "Sidama", "Tigray", "Dire Dawa", "Hawassa"].map((reg) => {
                        const selected = selectedRegions.includes(reg);
                        return (
                          <button
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                              selected
                                ? "bg-[#1d5d8a]/10 border border-[#1d5d8a] text-[#1d5d8a]"
                                : "bg-slate-100 border border-[#c1c7d0] text-[#41474f] hover:bg-slate-200"
                            }`}
                            key={reg}
                            onClick={() => toggleRegion(reg)}
                            type="button"
                          >
                            <span>{reg}</span>
                            <span className="material-symbols-outlined text-[14px] ml-1">
                              {selected ? "close" : "add"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Profession & Income */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                        Profession / Industry
                      </label>
                      <select
                        className="w-full border border-[#c1c7d0] rounded-md px-3 py-2 text-sm focus:border-[#1d5d8a] outline-none bg-white"
                        onChange={(e) => setProfession(e.target.value)}
                        value={profession}
                      >
                        <option value="any">Any Profession</option>
                        <option value="technology">Technology &amp; Telecom</option>
                        <option value="finance">Finance &amp; Banking</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education &amp; Academic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                        Monthly Income (ETB)
                      </label>
                      <select
                        className="w-full border border-[#c1c7d0] rounded-md px-3 py-2 text-sm focus:border-[#1d5d8a] outline-none bg-white"
                        onChange={(e) => setIncomeRange(e.target.value)}
                        value={incomeRange}
                      >
                        <option value="any">Any Income</option>
                        <option value="0_5000">0 – 5,000 ETB</option>
                        <option value="5001_15000">5,001 – 15,000 ETB</option>
                        <option value="15001_30000">15,001 – 30,000 ETB</option>
                        <option value="30000_plus">30,000+ ETB</option>
                      </select>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              /* Step 4: Sample & Budget */
              <section className="bg-white rounded-xl border border-[#c1c7d0] p-6 shadow-xs space-y-6">
                <h2 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e] mb-4 pb-2 border-b border-[#c1c7d0]/30">
                  Sample Size &amp; Escrow Calculation
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                      Target Sample Size (Responses)
                    </label>
                    <input
                      className="w-full border border-[#c1c7d0] rounded-md px-4 py-2.5 text-base font-bold text-[#181c1e] focus:border-[#1d5d8a] outline-none"
                      min={10}
                      onChange={(e) => setTargetSampleSize(Math.max(1, parseInt(e.target.value) || 0))}
                      type="number"
                      value={targetSampleSize}
                    />
                    <span className="text-[11px] text-[#41474f] mt-1 block">
                      Recommended: 100 – 500 for high confidence intervals.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#41474f] uppercase tracking-wider mb-2">
                      Reward per Response (ETB)
                    </label>
                    <input
                      className="w-full border border-[#c1c7d0] rounded-md px-4 py-2.5 text-base font-bold text-[#181c1e] focus:border-[#1d5d8a] outline-none"
                      min={5}
                      onChange={(e) => setRewardEtb(Math.max(5, parseInt(e.target.value) || 0))}
                      type="number"
                      value={rewardEtb}
                    />
                    <span className="text-[11px] text-[#41474f] mt-1 block">
                      Standard incentive in Addis Ababa: 15 – 35 ETB.
                    </span>
                  </div>
                </div>

                {/* Escrow Breakdown Box */}
                <div className="bg-[#f8f9ff] rounded-xl border border-[#c1c7d0] p-5 space-y-3">
                  <h3 className="text-xs font-bold text-[#41474f] uppercase tracking-wider">
                    Escrow Budget Summary
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#41474f]">Subtotal ({targetSampleSize} × {rewardEtb} ETB)</span>
                    <span className="font-bold text-[#181c1e]">{totalEscrowRequired.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#41474f]">Platform Verification Fee</span>
                    <span className="font-bold text-green-700">0.00 ETB (Included)</span>
                  </div>
                  <div className="border-t border-[#c1c7d0]/40 pt-3 flex justify-between items-center">
                    <span className="font-bold text-[#181c1e]">Total Escrow Reserved</span>
                    <span className="font-['Newsreader',serif] text-2xl font-bold text-[#1d5d8a]">
                      {totalEscrowRequired.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {!hasEnoughFunds && (
                  <Notice tone="error">
                    Your available wallet balance ({availableBalance.toLocaleString()} ETB) is less than the required escrow ({totalEscrowRequired.toLocaleString()} ETB). Please top up via Telebirr in your Wallet.
                  </Notice>
                )}
              </section>
            )}
          </div>

          {/* Sticky Summary Side Column (Exact Stitch Component) */}
          <div className="lg:col-span-4 sticky top-6 space-y-6">
            <div className="bg-white rounded-xl border border-[#c1c7d0] p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-bold text-[#41474f] uppercase tracking-wider mb-1">
                  Estimated Reach
                </h3>
                <div className="font-['Newsreader',serif] text-4xl font-bold text-[#00456d] mb-1">
                  185
                </div>
                <p className="text-xs text-[#41474f]">
                  Tier 1 &amp; Tier 2 respondents match your demographic criteria.
                </p>
              </div>

              {/* Admin Gate Notice */}
              <div className="bg-[#f8f9ff] rounded-lg p-4 border border-[#c1c7d0]/60 flex gap-3">
                <span className="material-symbols-outlined text-[#00456d] shrink-0 text-xl">verified_user</span>
                <div className="text-xs text-[#41474f] leading-relaxed">
                  <strong className="block text-[#181c1e] font-semibold mb-1">
                    Step 6: Mandatory Admin Review Gate
                  </strong>
                  Submitting will deduct escrow and place the survey in the Administrator Review Queue (24-48 hr SLA) before activation.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {activeStep === "wizard_filters" ? (
                  <button
                    className="w-full py-3 px-4 bg-[#1d5d8a] text-white rounded-lg font-bold text-sm hover:bg-[#00456d] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    onClick={() => setActiveStep("wizard_budget")}
                    type="button"
                  >
                    <span>Next: Set Sample &amp; Budget</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    className="w-full py-3 px-4 bg-[#1d5d8a] text-white rounded-lg font-bold text-sm hover:bg-[#00456d] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitToAdminReview.isPending || !hasEnoughFunds}
                    onClick={() => submitToAdminReview.mutate()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>
                      {submitToAdminReview.isPending ? "Submitting..." : "Submit to Admin Review Queue"}
                    </span>
                  </button>
                )}

                <button
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#41474f] hover:text-[#181c1e] rounded-lg border border-[#c1c7d0] hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => saveSurvey.mutate("wip")}
                  type="button"
                >
                  Save Draft &amp; Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // DEFAULT: QUESTION BUILDER WORKSPACE (Stitch Screen ce402508206046399e6c6f58c4cdcf6b)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full font-body-md text-on-surface bg-[#F4F7FA] overflow-hidden font-['Inter',sans-serif]">
      {/* ── Sub-Header Toolbar ── */}
      <div className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            to="/researcher/surveys"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <input
            className="font-['Newsreader',serif] text-2xl font-bold text-[#00456d] tracking-tight bg-transparent border-none focus:ring-1 focus:ring-primary/20 hover:bg-slate-100/60 rounded px-2 py-1 transition-colors cursor-text w-[360px] md:w-[480px] outline-none"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey Title"
            type="text"
            value={title}
          />
          <span className="px-2.5 py-0.5 rounded-full bg-[#cbe2fe]/40 text-[#00456d] text-[10px] font-bold uppercase tracking-wider shrink-0">
            Draft
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-[#41474f] hover:bg-slate-200 transition-colors cursor-pointer"
            disabled={saveSurvey.isPending}
            onClick={() => saveSurvey.mutate("wip")}
            type="button"
          >
            Save Draft
          </button>
          <button
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1d5d8a] text-white hover:bg-[#00456d] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            onClick={() => setActiveStep("wizard_filters")}
            type="button"
          >
            <span>Configure &amp; Launch Wizard</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {banner ? (
        <div className="px-6 py-2">
          <Notice tone={banner.tone}>{banner.text}</Notice>
        </div>
      ) : null}

      {/* ── 3-Column Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Drawer: Question Types Palette */}
        <aside className="w-64 shrink-0 bg-white border-r border-outline-variant/30 overflow-y-auto p-5 hidden md:block">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
            Question Types
          </h3>
          <div className="space-y-2">
            {[
              { type: "single_choice" as const, label: "Multiple Choice", icon: "radio_button_checked" },
              { type: "text" as const, label: "Short Text", icon: "short_text" },
              { type: "single_choice" as const, label: "Linear Scale", icon: "linear_scale" },
              { type: "single_choice" as const, label: "Rating Grid", icon: "grid_on" },
              { type: "multi_choice" as const, label: "Checkbox List", icon: "check_box" },
            ].map((qt, idx) => (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/40 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group bg-white shadow-2xs"
                key={idx}
                onClick={() => addQuestion(qt.type)}
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                  {qt.icon}
                </span>
                <span className="text-xs font-semibold text-on-surface">{qt.label}</span>
                <span className="material-symbols-outlined text-outline-variant ml-auto text-[16px] group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  add
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Canvas: Question Builder List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {questions.map((q, qIndex) => {
              const isActive = activeQuestionId === q.id;

              return (
                <div
                  className={`bg-white rounded-xl overflow-hidden shadow-xs border transition-all ${
                    isActive
                      ? "border-primary ring-2 ring-primary/20 border-l-4 border-l-primary"
                      : "border-outline-variant/40 hover:border-primary/50"
                  }`}
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                >
                  {/* Question Card Header */}
                  <div className="bg-[#f8f9ff] px-5 py-2.5 flex items-center justify-between border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline-variant text-[18px]">
                        drag_indicator
                      </span>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Question {qIndex + 1} • {q.type === "text" ? "Short Text" : "Multiple Choice"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 text-on-surface-variant hover:text-primary rounded transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateQuestion(q.id);
                        }}
                        title="Duplicate"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                      <button
                        className="p-1 text-on-surface-variant hover:text-error rounded transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(q.id);
                        }}
                        title="Delete"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                      <div className="w-px h-4 bg-outline-variant/40 mx-1" />
                      <label
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] font-semibold text-on-surface-variant">Required</span>
                        <input
                          checked={q.required !== false}
                          className="text-primary focus:ring-primary h-3.5 w-3.5 rounded"
                          onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                          type="checkbox"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="p-6">
                    <textarea
                      className="w-full font-['Plus_Jakarta_Sans',sans-serif] text-base md:text-lg font-bold text-[#0D253A] tracking-tight bg-transparent border-none focus:ring-0 p-0 mb-4 focus:bg-[#f8f9ff] rounded px-2 py-1 transition-colors resize-none leading-snug outline-none"
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      placeholder="Question prompt or title…"
                      rows={2}
                      value={q.text}
                    />

                    {q.type === "text" ? (
                      <div className="pl-2">
                        <div className="w-full md:w-2/3 border-b border-dashed border-outline-variant/60 pb-2 text-xs text-outline italic">
                          Short text qualitative response will appear here…
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pl-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <div className="flex items-center gap-3 group/opt" key={optIdx}>
                            <span className="material-symbols-outlined text-outline-variant text-[18px]">
                              radio_button_unchecked
                            </span>
                            <input
                              className="flex-1 px-3 py-1.5 text-xs text-on-surface bg-[#f8f9ff] border border-outline-variant/40 rounded-lg focus:outline-none focus:border-primary"
                              onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              type="text"
                              value={opt}
                            />
                            {(q.options || []).length > 2 && (
                              <button
                                className="text-outline-variant hover:text-error opacity-0 group-hover/opt:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => removeOption(q.id, optIdx)}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            )}
                          </div>
                        ))}

                        <div className="flex items-center gap-3 pt-2">
                          <span className="material-symbols-outlined text-outline-variant text-[18px]">
                            radio_button_unchecked
                          </span>
                          <button
                            className="text-xs text-primary hover:underline font-semibold focus:outline-none cursor-pointer"
                            onClick={() => addOption(q.id)}
                            type="button"
                          >
                            Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Question FAB */}
            <div className="flex justify-center mt-8">
              <button
                className="w-12 h-12 rounded-full bg-[#1d5d8a] hover:bg-[#00456d] text-white shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
                onClick={() => addQuestion("single_choice")}
                title="Add New Question"
                type="button"
              >
                <span className="material-symbols-outlined text-2xl">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Study Insights & Pro Features */}
        <aside className="w-72 shrink-0 bg-white border-l border-outline-variant/30 p-5 flex flex-col hidden lg:flex">
          <h3 className="text-lg font-headline-md font-bold text-primary mb-6">Study Insights</h3>

          {/* AI Analysis Card */}
          <div className="bg-[#f8f9ff] rounded-xl border border-outline-variant/40 p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1d5d8a] to-[#00456d]" />
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">psychiatry</span>
                <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                  AI Analysis
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                PRO
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Automated audit for leading questions, translation coherence, and response velocity checks.
            </p>
            <button
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white border border-outline-variant/50 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              <span>Optimize Survey</span>
            </button>
          </div>

          {/* Study Metadata */}
          <div className="mt-6 pt-6 border-t border-outline-variant/30">
            <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Study Metadata
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Estimated Length</span>
                <span className="font-semibold text-on-surface">
                  {Math.max(1, Math.round(questions.length * 0.8))} mins
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Question Count</span>
                <span className="font-semibold text-on-surface">{questions.length} Questions</span>
              </li>
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Language</span>
                <span className="font-semibold text-primary">English · Amharic · Oromo</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
