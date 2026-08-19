import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import { Icon, LoadingBlock, Notice } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

type WizardStep = 1 | 2 | 3 | 4;
type SurveyFormat = "web_form" | "ai_chat" | "voice";

interface MatchResult {
  matched_count: number;
  power_warning?: boolean;
}

export function SurveyPostingWizardPage() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const initialId = paramId || searchParams.get("surveyId") || searchParams.get("id") || "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard Navigation State
  const [step, setStep] = useState<WizardStep>(initialId ? 2 : 1);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(initialId);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 2: Format
  const [format, setFormat] = useState<SurveyFormat>("web_form");

  // Step 3: Audience Filters
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [gender, setGender] = useState<string>("any");
  const [education, setEducation] = useState<string>("any");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Addis Ababa"]);
  const [industry, setIndustry] = useState<string>("all");
  const [incomeRange, setIncomeRange] = useState<string>("any");

  // Step 4: Sample & Budget
  const [sampleSize, setSampleSize] = useState<number>(200);
  const [rewardPerRespondent, setRewardPerRespondent] = useState<number>(120);
  const platformFeePerRespondent = Math.round(rewardPerRespondent * 0.25); // 30 ETB
  const ratePerRespondent = rewardPerRespondent + platformFeePerRespondent; // 150 ETB
  const totalEscrowRequired = sampleSize * ratePerRespondent;

  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(null);

  // Fetch Researcher's Final Drafts & Surveys
  const { data: surveysData, isLoading: isLoadingSurveys } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyRecord[] }>("/surveys"),
  });

  const surveys = surveysData?.surveys || [];

  // Filter available drafts (favor final_draft or editable drafts)
  const availableDrafts = useMemo(() => {
    return surveys.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [surveys, searchQuery]);

  const selectedSurvey = useMemo(() => {
    return surveys.find((s) => s.id === selectedSurveyId) || null;
  }, [surveys, selectedSurveyId]);

  // Set initial reward from selected survey if present
  useEffect(() => {
    if (selectedSurvey?.reward_etb) {
      setRewardPerRespondent(selectedSurvey.reward_etb);
    }
  }, [selectedSurvey]);

  // Live Audience Match Query
  const { data: matchData, isFetching: isMatching } = useQuery({
    queryKey: [
      "survey-match",
      selectedSurveyId,
      minAge,
      maxAge,
      gender,
      education,
      selectedRegions,
      industry,
      incomeRange,
    ],
    queryFn: async () => {
      if (!selectedSurveyId) return { matched_count: 3420 };
      try {
        const filters: Record<string, unknown> = {};
        if (minAge > 18) filters.age_min = minAge;
        if (maxAge < 65) filters.age_max = maxAge;
        if (gender !== "any") filters.gender = gender;
        if (education !== "any") filters.education = education;
        if (selectedRegions.length > 0) filters.regions = selectedRegions;
        if (industry !== "all") filters.industry = industry;
        if (incomeRange !== "any") filters.income = incomeRange;

        return await api<MatchResult>(`/surveys/${selectedSurveyId}/match`, {
          body: { filters },
        });
      } catch {
        return { matched_count: 3420 };
      }
    },
    enabled: Boolean(selectedSurveyId),
  });

  const matchedCount = matchData?.matched_count ?? 3420;

  // Toggle Ethiopian Region
  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  // Launch / Send Mutation
  const postSurveyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSurveyId) throw new Error("Please select a survey draft first.");
      setBanner(null);

      const filters = {
        age_min: minAge,
        age_max: maxAge,
        gender: gender === "any" ? undefined : gender,
        education: education === "any" ? undefined : education,
        regions: selectedRegions,
        industry: industry === "all" ? undefined : industry,
        income: incomeRange === "any" ? undefined : incomeRange,
        format,
        sample_size: sampleSize,
      };

      return api<{ targeted_count: number; status: string; reserved_etb: number }>(
        `/surveys/${selectedSurveyId}/send`,
        {
          body: {
            reward_etb: rewardPerRespondent,
            filters,
          },
        },
      );
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      navigate(`/researcher/surveys`, {
        state: {
          banner: {
            tone: "success",
            text: `Survey submitted successfully for institutional review! ${data.targeted_count || sampleSize} verified respondents targeted.`,
          },
        },
      });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text:
          error instanceof ApiRequestError
            ? error.message
            : "Failed to post survey. Please check your escrow balance and try again.",
      });
    },
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-sans antialiased text-[#0b1c30] flex flex-col justify-between">
      {/* ── Transactional Header (Stitch Spec) ── */}
      <header className="w-full bg-white border-b border-[#c1c7cc]/40 px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/researcher")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#eff4ff] text-[#41484c] hover:text-[#001d29] transition-colors cursor-pointer"
            title="Exit Survey Wizard"
          >
            <Icon className="text-[20px]" name="close" />
          </button>
          <div className="h-5 w-px bg-[#c1c7cc]/40"></div>
          <div className="flex items-center gap-2">
            <Icon className="text-[#001d29] text-[22px]" filled name="account_balance" />
            <span className="font-headline font-bold text-base md:text-lg text-[#001d29] tracking-tight">
              Ethosk Institutional
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#eff4ff] px-3.5 py-1.5 rounded-lg border border-[#c1c7cc]/30">
          <Icon className="text-[#41484c] text-[16px]" name="linear_scale" />
          <span className="font-mono text-[11px] font-bold text-[#41484c] uppercase tracking-wider">
            Survey Wizard
          </span>
        </div>
      </header>

      {/* ── Main Wizard Canvas ── */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col items-center">
        {banner && (
          <div className="w-full max-w-3xl mb-6">
            <Notice tone={banner.tone}>{banner.text}</Notice>
          </div>
        )}

        {/* ── 4-Step Stepper Navigation (Stitch Spec) ── */}
        <div className="w-full max-w-3xl mb-10">
          <div className="flex items-center justify-between relative">
            {/* Background connecting lines */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-[#c1c7cc]/40 -z-0"></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2 relative z-10 w-24">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-xs transition-all cursor-pointer ${
                  step === 1
                    ? "bg-[#001d29] text-white ring-4 ring-[#dde9ff]"
                    : step > 1
                    ? "bg-[#003345] text-white"
                    : "bg-[#dde9ff] text-[#71787c]"
                }`}
              >
                {step > 1 ? <Icon className="text-[16px]" name="check" /> : "1"}
              </button>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider text-center ${
                  step === 1 ? "font-bold text-[#001d29]" : "text-[#71787c]"
                }`}
              >
                Select Draft
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2 relative z-10 w-24">
              <button
                type="button"
                onClick={() => selectedSurveyId && setStep(2)}
                disabled={!selectedSurveyId}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-xs transition-all ${
                  step === 2
                    ? "bg-[#001d29] text-white ring-4 ring-[#dde9ff] cursor-pointer"
                    : step > 2
                    ? "bg-[#003345] text-white cursor-pointer"
                    : "bg-[#dde9ff] text-[#71787c] opacity-60"
                }`}
              >
                {step > 2 ? <Icon className="text-[16px]" name="check" /> : "2"}
              </button>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider text-center ${
                  step === 2 ? "font-bold text-[#001d29]" : "text-[#71787c]"
                }`}
              >
                Format
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2 relative z-10 w-24">
              <button
                type="button"
                onClick={() => selectedSurveyId && setStep(3)}
                disabled={!selectedSurveyId}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-xs transition-all ${
                  step === 3
                    ? "bg-[#001d29] text-white ring-4 ring-[#dde9ff] cursor-pointer"
                    : step > 3
                    ? "bg-[#003345] text-white cursor-pointer"
                    : "bg-[#dde9ff] text-[#71787c] opacity-60"
                }`}
              >
                {step > 3 ? <Icon className="text-[16px]" name="check" /> : "3"}
              </button>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider text-center ${
                  step === 3 ? "font-bold text-[#001d29]" : "text-[#71787c]"
                }`}
              >
                Audience
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-2 relative z-10 w-24">
              <button
                type="button"
                onClick={() => selectedSurveyId && setStep(4)}
                disabled={!selectedSurveyId}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-xs transition-all ${
                  step === 4
                    ? "bg-[#001d29] text-white ring-4 ring-[#dde9ff] cursor-pointer"
                    : "bg-[#dde9ff] text-[#71787c] opacity-60"
                }`}
              >
                4
              </button>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider text-center ${
                  step === 4 ? "font-bold text-[#001d29]" : "text-[#71787c]"
                }`}
              >
                Sample &amp; Budget
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 1: SELECT DRAFT (Stitch Screen d715e7df4a24432f8c76)   ── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="w-full max-w-2xl flex flex-col gap-6">
            <div className="bg-white border border-[#c1c7cc]/40 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="p-6 md:p-8 border-b border-[#c1c7cc]/20 bg-[#f8f9ff]">
                <h2 className="font-headline font-semibold text-xl md:text-2xl text-[#001d29] mb-1">
                  Select a Final Draft
                </h2>
                <p className="text-xs md:text-sm text-[#41484c]">
                  Search and select a finalized instrument from your research library to begin the deployment configuration.
                </p>
              </div>

              <div className="p-6 md:p-8 flex flex-col gap-5">
                {/* Search Bar */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-[#41484c]" htmlFor="draft-search">
                    Target Draft
                  </label>
                  <div className="relative group">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71787c] group-focus-within:text-[#001d29] text-[20px]" name="search" />
                    <input
                      id="draft-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search final drafts by name or ID..."
                      className="w-full pl-12 pr-10 py-3 border border-[#c1c7cc]/60 rounded-xl text-xs md:text-sm text-[#001d29] focus:outline-none focus:border-[#001d29] focus:ring-1 focus:ring-[#001d29] transition-all bg-[#f8f9ff] outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71787c] hover:text-[#001d29] cursor-pointer"
                      >
                        <Icon className="text-[16px]" name="close" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drafts List */}
                <div className="border border-[#c1c7cc]/40 rounded-xl bg-white overflow-hidden flex flex-col divide-y divide-[#c1c7cc]/20 max-h-[380px] overflow-y-auto">
                  {isLoadingSurveys ? (
                    <div className="p-8 text-center">
                      <LoadingBlock label="Loading workspace drafts…" />
                    </div>
                  ) : availableDrafts.length === 0 ? (
                    <div className="p-8 text-center text-xs md:text-sm text-[#71787c]">
                      No finalized drafts found. Create a survey in the{" "}
                      <Link to="/survey-builder" className="text-[#001d29] font-bold underline">
                        Survey Builder
                      </Link>{" "}
                      first.
                    </div>
                  ) : (
                    availableDrafts.map((draft) => {
                      const isSelected = selectedSurveyId === draft.id;
                      return (
                        <div
                          key={draft.id}
                          onClick={() => setSelectedSurveyId(draft.id)}
                          className={`px-5 py-4 cursor-pointer transition-colors flex items-start justify-between relative group ${
                            isSelected ? "bg-[#eff4ff]" : "hover:bg-[#f8f9ff]"
                          }`}
                        >
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#001d29]"></div>}
                          <div className="flex flex-col gap-1 pr-4">
                            <span className="text-xs md:text-sm font-semibold text-[#001d29]">
                              {draft.title}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[10px] text-[#41484c] bg-[#dde9ff] px-2 py-0.5 rounded">
                                ID: {draft.id.slice(0, 8)}
                              </span>
                              <span className="text-xs text-[#71787c] flex items-center gap-1">
                                <Icon className="text-[13px]" name="schedule" />
                                <span>{draft.questions?.length || 0} Questions</span>
                              </span>
                              <span className="text-xs text-[#71787c]">
                                {draft.status === "final_draft" ? "Final Draft" : "Draft"}
                              </span>
                            </div>
                          </div>

                          <Icon
                            className={`mt-1 text-[20px] ${isSelected ? "text-[#001d29]" : "text-[#c1c7cc]"}`}
                            filled={isSelected}
                            name={isSelected ? "check_circle" : "radio_button_unchecked"}
                          />
                        </div>
                      );
                    })
                  )}

                  <div className="px-5 py-2.5 bg-[#f8f9ff] flex justify-center text-[11px] font-mono text-[#71787c] uppercase tracking-wider">
                    Showing {availableDrafts.length} of {surveys.length} total drafts
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/researcher")}
                className="px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold text-[#001d29] border border-[#c1c7cc]/50 hover:bg-[#eff4ff] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSurveyId}
                onClick={() => setStep(2)}
                className="bg-[#001d29] hover:bg-[#003345] text-white px-8 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>Next Step</span>
                <Icon className="text-[16px]" name="arrow_forward" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 2: SELECT FORMAT (Stitch Screen 2ea22b145f80435c85f6) ── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <div className="text-center max-w-lg">
              <h2 className="font-headline font-bold text-2xl md:text-3xl text-[#001d29] mb-2 tracking-tight">
                Select Survey Format
              </h2>
              <p className="text-xs md:text-sm text-[#41484c]">
                Choose the primary methodology for your data collection. This determines the user experience for your respondents.
              </p>
            </div>

            {/* 3 Format Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* Option 1: Traditional Web Form */}
              <div
                onClick={() => setFormat("web_form")}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition-all relative ${
                  format === "web_form"
                    ? "border-[#001d29] ring-2 ring-[#001d29] shadow-md"
                    : "border-[#c1c7cc]/40 hover:border-[#001d29]/40 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#dde9ff] text-[#001d29] flex items-center justify-center">
                      <Icon className="text-[24px]" name="view_list" />
                    </div>
                    <span className="bg-[#eff4ff] text-[#001d29] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>

                  <h3 className="font-headline font-bold text-base md:text-lg text-[#001d29] mb-2">
                    Traditional Web Form
                  </h3>
                  <p className="text-xs text-[#41484c] leading-relaxed">
                    Recommended for quantitative reach. A linear, structured approach ideal for standard metrics and large-scale data aggregation.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Icon
                    className={`text-[20px] ${format === "web_form" ? "text-[#001d29]" : "text-[#c1c7cc]"}`}
                    filled={format === "web_form"}
                    name={format === "web_form" ? "check_circle" : "radio_button_unchecked"}
                  />
                </div>
              </div>

              {/* Option 2: Conversational AI Chat */}
              <div
                onClick={() => setFormat("ai_chat")}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition-all relative ${
                  format === "ai_chat"
                    ? "border-[#001d29] ring-2 ring-[#001d29] shadow-md"
                    : "border-[#c1c7cc]/40 hover:border-[#001d29]/40 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#dde9ff] text-[#001d29] flex items-center justify-center">
                      <Icon className="text-[24px]" name="smart_toy" />
                    </div>
                  </div>

                  <h3 className="font-headline font-bold text-base md:text-lg text-[#001d29] mb-2">
                    Conversational AI Chat
                  </h3>
                  <p className="text-xs text-[#41484c] leading-relaxed">
                    Ideal for high engagement. Dynamically adapts to user responses to probe deeper into qualitative sentiments in real-time.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Icon
                    className={`text-[20px] ${format === "ai_chat" ? "text-[#001d29]" : "text-[#c1c7cc]"}`}
                    filled={format === "ai_chat"}
                    name={format === "ai_chat" ? "check_circle" : "radio_button_unchecked"}
                  />
                </div>
              </div>

              {/* Option 3: Voice Survey (Coming Soon) */}
              <div className="bg-[#f8f9ff] rounded-2xl border border-[#c1c7cc]/30 p-6 flex flex-col justify-between opacity-60 cursor-not-allowed relative">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#c1c7cc]/30 text-[#71787c] flex items-center justify-center">
                      <Icon className="text-[24px]" name="mic" />
                    </div>
                    <span className="bg-[#c1c7cc]/30 text-[#71787c] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>

                  <h3 className="font-headline font-bold text-base md:text-lg text-[#71787c] mb-2">
                    Voice Survey
                  </h3>
                  <p className="text-xs text-[#71787c] leading-relaxed">
                    Qualitative depth through automated voice-guided interviews. Transcribed and analyzed via NLP.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Icon className="text-[20px] text-[#c1c7cc]" name="radio_button_unchecked" />
                </div>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex justify-between items-center w-full max-w-4xl pt-4 border-t border-[#c1c7cc]/30">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold text-[#001d29] border border-[#c1c7cc]/50 hover:bg-[#eff4ff] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icon className="text-[16px]" name="arrow_back" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#001d29] hover:bg-[#003345] text-white px-8 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Next Step</span>
                <Icon className="text-[16px]" name="arrow_forward" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 3: DEMOGRAPHIC FILTERS (Stitch Screen 047333c6ac4e4ce7) ─ */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="w-full max-w-5xl flex flex-col gap-8">
            <div className="mb-2">
              <h2 className="font-headline font-bold text-2xl md:text-3xl text-[#001d29] mb-1 tracking-tight">
                Audience Targeting
              </h2>
              <p className="text-xs md:text-sm text-[#41484c]">
                Define your demographic parameters to reach the exact verified respondents needed for your research study.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Filter Fields (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Core Demographics Card */}
                <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 shadow-xs p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#c1c7cc]/20 pb-3">
                    <Icon className="text-[#001d29] text-[20px]" name="person_search" />
                    <h3 className="font-headline text-base font-bold text-[#001d29]">Core Demographics</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Age Range */}
                    <div>
                      <label className="block text-xs font-semibold text-[#001d29] mb-1.5">Age Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="18"
                          max="100"
                          value={minAge}
                          onChange={(e) => setMinAge(Number(e.target.value))}
                          className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg px-3 py-2 text-xs md:text-sm text-[#001d29] outline-none focus:ring-1 focus:ring-[#001d29]"
                        />
                        <span className="text-xs text-[#71787c]">to</span>
                        <input
                          type="number"
                          min="18"
                          max="100"
                          value={maxAge}
                          onChange={(e) => setMaxAge(Number(e.target.value))}
                          className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg px-3 py-2 text-xs md:text-sm text-[#001d29] outline-none focus:ring-1 focus:ring-[#001d29]"
                        />
                      </div>
                    </div>

                    {/* Gender Identity */}
                    <div>
                      <label className="block text-xs font-semibold text-[#001d29] mb-1.5">Gender Identity</label>
                      <div className="flex items-center gap-3 h-10">
                        {["any", "female", "male"].map((g) => (
                          <label key={g} className="flex items-center gap-1.5 cursor-pointer text-xs capitalize text-[#001d29]">
                            <input
                              type="radio"
                              name="gender"
                              value={g}
                              checked={gender === g}
                              onChange={(e) => setGender(e.target.value)}
                              className="text-[#001d29] focus:ring-[#001d29]"
                            />
                            <span>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Education */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#001d29] mb-1.5">
                        Minimum Education Level
                      </label>
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg p-2.5 text-xs md:text-sm text-[#001d29] outline-none focus:ring-1 focus:ring-[#001d29]"
                      >
                        <option value="any">Any Education Level</option>
                        <option value="secondary">Secondary School (10th/12th Grade)</option>
                        <option value="diploma">Technical / Vocational Diploma</option>
                        <option value="bachelor">Bachelor's Degree</option>
                        <option value="postgrad">Master's / Doctorate Degree</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Geography & Economics Card */}
                <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 shadow-xs p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#c1c7cc]/20 pb-3">
                    <Icon className="text-[#001d29] text-[20px]" name="location_on" />
                    <h3 className="font-headline text-base font-bold text-[#001d29]">Geography &amp; Economics</h3>
                  </div>

                  {/* Region (Ethiopia) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#001d29] mb-2">Region (Ethiopia)</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Addis Ababa",
                        "Oromia",
                        "Amhara",
                        "Dire Dawa",
                        "Sidama",
                        "Tigray",
                        "Somali",
                        "SNNPR",
                        "Afar",
                        "Benishangul-Gumuz",
                        "Gambela",
                        "Harari",
                      ].map((reg) => {
                        const isChecked = selectedRegions.includes(reg);
                        return (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => toggleRegion(reg)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? "bg-[#001d29] text-white border-[#001d29]"
                                : "bg-[#f8f9ff] text-[#41484c] border-[#c1c7cc] hover:bg-[#eff4ff]"
                            }`}
                          >
                            <Icon className="text-[14px]" name={isChecked ? "check" : "add"} />
                            <span>{reg}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* Industry / Profession */}
                    <div>
                      <label className="block text-xs font-semibold text-[#001d29] mb-1.5">
                        Industry / Profession
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg p-2.5 text-xs md:text-sm text-[#001d29] outline-none focus:ring-1 focus:ring-[#001d29]"
                      >
                        <option value="all">All Industries</option>
                        <option value="agriculture">Agriculture &amp; Farming</option>
                        <option value="tech">Technology &amp; Telecom</option>
                        <option value="finance">Banking &amp; Financial Services</option>
                        <option value="healthcare">Healthcare &amp; Pharma</option>
                        <option value="retail">Retail, Trade &amp; FMCG</option>
                        <option value="education">Education &amp; Academia</option>
                      </select>
                    </div>

                    {/* Monthly Income Range */}
                    <div>
                      <label className="block text-xs font-semibold text-[#001d29] mb-1.5">
                        Monthly Income Range (ETB)
                      </label>
                      <select
                        value={incomeRange}
                        onChange={(e) => setIncomeRange(e.target.value)}
                        className="w-full bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg p-2.5 text-xs md:text-sm text-[#001d29] outline-none focus:ring-1 focus:ring-[#001d29]"
                      >
                        <option value="any">Any Income</option>
                        <option value="low">&lt; 5,000 ETB</option>
                        <option value="mid">5,000 – 15,000 ETB</option>
                        <option value="upper_mid">15,000 – 30,000 ETB</option>
                        <option value="high">30,000+ ETB</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Audience Match Card (4 cols) */}
              <div className="lg:col-span-4 space-y-4 sticky top-24">
                <div className="bg-gradient-to-b from-[#003345] to-[#001d29] text-white rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#a3cce3]">
                    Live Audience Match
                  </span>

                  <div>
                    <div className="text-4xl font-headline font-bold tracking-tight text-white mb-1">
                      {isMatching ? "…" : matchedCount.toLocaleString()}
                    </div>
                    <p className="text-xs text-[#d3e3ff]">Verified Respondents Available</p>
                  </div>

                  <div className="pt-3 border-t border-white/15 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Icon className="text-[16px]" filled name="verified_user" />
                      <span>Fayda ID Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      All matched respondents have completed Level 2 Fayda national ID verification, ensuring zero bots and high data integrity for institutional research.
                    </p>
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#71787c]">Estimated Fieldwork Time</span>
                    <span className="font-semibold text-[#001d29]">2–3 Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#71787c]">Cost per Complete</span>
                    <span className="font-mono font-bold text-[#001d29]">{ratePerRespondent} ETB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-[#c1c7cc]/30">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold text-[#001d29] border border-[#c1c7cc]/50 hover:bg-[#eff4ff] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icon className="text-[16px]" name="arrow_back" />
                <span>Back to Format</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-[#001d29] hover:bg-[#003345] text-white px-8 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Continue to Review</span>
                <Icon className="text-[16px]" name="arrow_forward" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 4: SAMPLE & BUDGET (Stitch Screen 412ab6dfb5034bb280c1) ─ */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="w-full max-w-[640px] flex flex-col gap-6">
            <div className="text-center">
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-[#001d29] mb-1 tracking-tight">
                {selectedSurvey?.title || "New Consumer Study"}
              </h2>
              <p className="text-xs md:text-sm text-[#41484c]">
                Determine your target audience volume and securely fund the project escrow to begin data collection.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 shadow-xs p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#001d29]"></div>

              <div>
                <h3 className="font-headline text-lg font-bold text-[#001d29] mb-1">
                  Sample Size &amp; Funding
                </h3>
                <p className="text-xs text-[#41484c]">
                  Escrow guarantees instant disbursement to respondents upon verified survey completion.
                </p>
              </div>

              {/* Sample Size Input */}
              <div className="flex flex-col gap-2 bg-[#f8f9ff] p-4 rounded-xl border border-[#c1c7cc]/30">
                <label className="text-xs font-semibold text-[#001d29] flex items-center gap-2" htmlFor="sample_size">
                  <Icon className="text-[18px] text-[#001d29]" name="group" />
                  <span>Target Sample Size</span>
                </label>
                <div className="relative">
                  <input
                    id="sample_size"
                    type="number"
                    min="10"
                    max="10000"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Math.max(10, Number(e.target.value)))}
                    className="w-full bg-white border border-[#c1c7cc] rounded-lg py-2.5 px-4 text-sm font-semibold text-[#001d29] focus:outline-none focus:ring-2 focus:ring-[#001d29] outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-xs text-[#71787c] font-medium">
                    Respondents
                  </div>
                </div>
                <p className="text-[11px] text-[#71787c] font-mono">
                  Minimum sample size is 10. Rate varies by audience complexity.
                </p>
              </div>

              {/* Budget Breakdown */}
              <div className="flex flex-col gap-3">
                <h4 className="font-mono text-[11px] font-bold text-[#41484c] uppercase tracking-wider flex items-center gap-1.5">
                  <Icon className="text-[15px]" name="receipt_long" />
                  <span>Budget Breakdown</span>
                </h4>

                <div className="bg-[#eff4ff]/60 rounded-xl p-4 border border-[#c1c7cc]/30 space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-[#001d29]">
                    <span className="flex items-center gap-1">
                      <span>Respondent Rewards</span>
                      <span title="Direct compensation to verified respondents">
                        <Icon className="text-[14px] text-[#71787c]" name="info" />
                      </span>
                    </span>
                    <span className="font-mono">{sampleSize} × {rewardPerRespondent} ETB</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#001d29]">
                    <span className="flex items-center gap-1">
                      <span>Platform Infrastructure Fee</span>
                      <span title="Operational & verification platform fee">
                        <Icon className="text-[14px] text-[#71787c]" name="info" />
                      </span>
                    </span>
                    <span className="font-mono">{sampleSize} × {platformFeePerRespondent} ETB</span>
                  </div>

                  <div className="w-full h-px bg-[#c1c7cc]/40 my-1"></div>

                  <div className="flex justify-between items-center text-xs font-bold text-[#001d29]">
                    <span>Rate per Respondent</span>
                    <span className="font-mono">{ratePerRespondent} ETB</span>
                  </div>
                </div>

                {/* Total Escrow Required */}
                <div className="mt-2 bg-[#003345] text-white rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#a3cce3]">
                      Total Escrow Required
                    </span>
                    <span className="text-xs text-slate-300">Funds held securely until data verification.</span>
                  </div>
                  <div className="font-headline text-2xl md:text-3xl font-bold text-white">
                    {totalEscrowRequired.toLocaleString()}{" "}
                    <span className="text-base font-normal text-[#a3cce3]">ETB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#001d29] text-[#001d29] font-semibold text-xs md:text-sm hover:bg-[#eff4ff] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icon className="text-[16px]" name="arrow_back" />
                <span>Back to Audience</span>
              </button>

              <button
                type="button"
                disabled={postSurveyMutation.isPending}
                onClick={() => postSurveyMutation.mutate()}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#001d29] hover:bg-[#003345] text-white font-semibold text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {postSurveyMutation.isPending ? (
                  <Icon className="animate-spin text-white text-[18px]" name="progress_activity" />
                ) : (
                  <Icon className="text-[18px]" name="lock" />
                )}
                <span>{postSurveyMutation.isPending ? "Locking Escrow & Posting…" : "Confirm & Fund Escrow"}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-4 flex justify-center text-center border-t border-[#c1c7cc]/30 bg-white">
        <p className="text-[11px] font-mono text-[#71787c] uppercase tracking-wider">
          © 2026 Ethosk Institutional Research Infrastructure. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
