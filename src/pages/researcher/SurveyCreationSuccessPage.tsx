import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import { Icon, LoadingBlock } from "@/components/ui";
import { api } from "@/lib/api";

export function SurveyCreationSuccessPage() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const effectiveId = paramId || searchParams.get("id");
  const navigate = useNavigate();

  const { data: survey, isLoading } = useQuery({
    queryKey: ["survey-success", effectiveId],
    queryFn: () => (effectiveId ? api<SurveyRecord>(`/surveys/${effectiveId}`) : null),
    enabled: Boolean(effectiveId),
  });

  if (isLoading) return <LoadingBlock label="Loading survey details…" />;

  const title = survey?.title || searchParams.get("title") || "Consumer Experience & Retail Habits 2026";
  const questionCount = survey?.questions ? survey.questions.length : Number(searchParams.get("count") || 8);
  const estimatedMinutes = Math.max(2, Math.round(questionCount * 0.5));
  const builderType =
    (survey as Record<string, unknown> | null | undefined)?.builder_type as string ||
    searchParams.get("type") ||
    "Manual Builder";

  const builderTypeLabel =
    builderType === "ai"
      ? "AI Generator"
      : builderType === "import"
      ? "Import Survey"
      : "Manual Builder";

  return (
    <main className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 w-full">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_12px_32px_rgba(0,65,98,0.08)] w-full max-w-[560px] p-6 md:p-8 flex flex-col items-center text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-[#0F9B8E]/10 rounded-full flex items-center justify-center mb-6 shrink-0">
          <Icon className="text-[40px] text-[#0F9B8E]" filled name="check_circle" />
        </div>

        {/* Headers */}
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#004162] mb-2 tracking-tight">
          Survey Draft Created Successfully!
        </h1>
        <p className="text-xs md:text-sm text-[#41484c] mb-6 max-w-md leading-relaxed">
          Your question schema has been validated and saved to your workspace drafts.
        </p>

        {/* Summary Card */}
        <div className="w-full bg-[#f8f9ff] border border-[#E2E8F0] rounded-2xl p-5 text-left mb-6 space-y-4">
          <h2 className="font-headline text-sm md:text-base font-bold text-[#001d29]">
            {title}
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs text-[#41484c]">
            <div className="flex items-center gap-2">
              <Icon className="text-[16px] text-[#71787c]" name="format_list_numbered" />
              <span>{questionCount} Questions</span>
            </div>

            <div className="flex items-center gap-2">
              <Icon className="text-[16px] text-[#71787c]" name="schedule" />
              <span>~{estimatedMinutes} Minutes</span>
            </div>

            <div className="flex items-center gap-2">
              <Icon className="text-[16px] text-[#71787c]" name="language" />
              <span className="truncate" title="English, Amharic, Afaan Oromo">Eng, Amh, Omo</span>
            </div>

            <div className="flex items-center gap-2">
              <Icon className="text-[16px] text-[#71787c]" name="construction" />
              <span>{builderTypeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0F9B8E]/10 text-[#0F9B8E] px-3 py-1 rounded-full w-fit">
            <Icon className="text-[14px]" name="check" />
            <span className="font-mono text-[11px] font-bold">Schema Validated · No Formatting Errors</span>
          </div>
        </div>

        {/* Next Steps Prompt */}
        <p className="text-xs text-[#41484c] mb-4">
          Configure your target audience demographics and set researcher rewards in the next step.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mb-6">
          <button
            type="button"
            onClick={() => {
              if (effectiveId) {
                navigate(`/survey-posting/${effectiveId}`);
              } else {
                navigate("/survey-posting");
              }
            }}
            className="w-full bg-[#2872A1] hover:bg-[#003345] text-white font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Proceed to Demographic Targeting &amp; Posting</span>
            <Icon className="text-[16px]" name="arrow_forward" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (effectiveId) {
                navigate(`/survey-builder/manual/${effectiveId}`);
              } else {
                navigate("/survey-builder");
              }
            }}
            className="w-full bg-[#EDF3FF] hover:bg-[#dce6fa] text-[#004162] font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition-colors cursor-pointer"
          >
            Return to Survey Builder / Edit Questions
          </button>
        </div>

        {/* Return to Dashboard */}
        <Link
          to="/researcher"
          className="text-xs md:text-sm text-[#004162] hover:underline flex items-center gap-1 font-semibold group transition-colors"
        >
          <Icon className="text-[16px] group-hover:-translate-x-0.5 transition-transform" name="arrow_back" />
          <span>Back to Research Operations Dashboard</span>
        </Link>
      </div>
    </main>
  );
}
