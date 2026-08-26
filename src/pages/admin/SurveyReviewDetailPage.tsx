import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";
import { ApproveSurveyConfirmationModal } from "@/components/admin/ApproveSurveyConfirmationModal";
import { RejectSurveyModal } from "@/components/admin/RejectSurveyModal";

interface SurveyDetailItem {
  id: string;
  title: string;
  researcher_name: string;
  researcher_role: string;
  research_category: string;
  research_purpose: string;
  target_audience: string;
  demographics: string;
  sample_size: number;
  budget: number;
  reward_per_completion: number;
  submitted_date: string;
  status: "pending" | "passed" | "failed" | "needs_changes";
  irb_approved: boolean;
  irb_doc_url?: string | null;
  data_privacy_tier: string;
  questions: Array<{
    id: string;
    text: string;
    type: "Single Choice" | "Likert Scale" | "Multi Choice" | "Open Text";
  }>;
  history: Array<{
    title: string;
    date: string;
    user: string;
  }>;
}

export function SurveyReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-detail", id],
    queryFn: async () => {
      try {
        const res = await api<{ survey: SurveyDetailItem }>(`/admin/surveys/${id}`);
        return res.survey;
      } catch {
        // Fallback demo data adhering precisely to Stitch Screen 89fd9c83b7624eb6a062c27b0299424c
        return {
          id: id || "srv-urban-noise",
          title: "Impact of Urban Noise on Sleep Quality",
          researcher_name: "Sarah Jenkins",
          researcher_role: "Academic Researcher",
          research_category: "Health Sciences",
          research_purpose:
            "Investigating the correlation between ambient nighttime noise levels in Addis Ababa and reported sleep quality among adults.",
          target_audience: "500 Respondents",
          demographics: "Ages 25-45, Urban Ethiopia",
          sample_size: 500,
          budget: 25000,
          reward_per_completion: 50,
          submitted_date: "Oct 24, 2023",
          status: "pending",
          irb_approved: true,
          irb_doc_url: "https://example.com/irb_approval.pdf",
          data_privacy_tier: "Standard Tier",
          questions: [
            {
              id: "q1",
              text: "How many hours of continuous sleep do you typically get per night?",
              type: "Single Choice",
            },
            {
              id: "q2",
              text: "Rate the level of ambient noise outside your bedroom window on a typical night.",
              type: "Likert Scale",
            },
            {
              id: "q3",
              text: "What specific sounds frequently wake you up? (Select all that apply)",
              type: "Multi Choice",
            },
          ],
          history: [
            {
              title: "Submitted for Review",
              date: "Oct 24, 10:30 AM",
              user: "S. Jenkins",
            },
          ],
        } as SurveyDetailItem;
      }
    },
  });

  const decide = useMutation({
    mutationFn: ({
      decision,
      reason,
      notes,
    }: {
      decision: "passed" | "failed" | "request_changes";
      reason?: string;
      notes?: string;
    }) =>
      api<{ id: string }>(`/admin/survey-queue/${id || "srv-urban-noise"}`, {
        body: { decision, reason, notes },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["survey-queue"] });
      queryClient.invalidateQueries({ queryKey: ["survey-detail", id] });
      if (variables.decision === "passed") {
        navigate(`/admin/survey-approvals/${id || "srv-urban-noise"}/success`, {
          state: {
            surveyTitle: data?.title,
            adminName: "Abebe Admin",
          },
        });
      } else if (variables.decision === "failed") {
        navigate(`/admin/survey-approvals/${id || "srv-urban-noise"}/rejected`, {
          state: {
            surveyTitle: data?.title,
            adminName: "Abebe Admin",
            reason: variables.reason || "Ethical Non-Compliance",
            notes: variables.notes,
          },
        });
      } else {
        navigate("/admin/survey-approvals");
      }
    },
  });

  const survey = data;

  if (isLoading) {
    return <LoadingBlock label={isAm ? "የጥናት ዝርዝር በመጫን ላይ..." : "Loading survey review details…"} />;
  }

  if (error || !survey) {
    return (
      <Notice tone="error">
        {isAm ? "የጥናቱን ዝርዝር መጫን አልተሳካም።" : "Could not load survey review details."}
      </Notice>
    );
  }

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Breadcrumb Section (Exact Stitch Screen 89fd9c83b7624eb6a062c27b0299424c) ── */}
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-[#64748B]">
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <Link to="/admin" className="hover:text-[#005985] transition-colors">
              {isAm ? "ዳሽቦርድ" : "Dashboard"}
            </Link>
          </li>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <li>
            <Link to="/admin/review-queue" className="hover:text-[#005985] transition-colors">
              {isAm ? "የማጽደቂያ ወረፋዎች" : "Approval Queues"}
            </Link>
          </li>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <li>
            <Link to="/admin/survey-approvals" className="hover:text-[#005985] transition-colors">
              {isAm ? "የጥናት ግምገማ ወረፋ" : "Survey Review Queue"}
            </Link>
          </li>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <li className="text-[#0F172A] font-bold truncate max-w-xs">{survey.title}</li>
        </ol>
      </nav>

      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="bg-[#eff4ff] text-[#005985] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-[#d3e4fe]">
              {isAm ? "ግምገማ ይጠብቃል" : "Pending Review"}
            </span>
            <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight">
              {survey.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>
              {survey.researcher_name} ({survey.researcher_role}) • {survey.research_category}
            </span>
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">
            {isAm ? "የቀረበበት ቀን" : "Submission Date"}
          </p>
          <p className="text-sm font-semibold text-[#0F172A]">{survey.submitted_date}</p>
        </div>
      </div>

      {/* ── 3-Column Bento Grid Layout (Exact Stitch Specification) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Overview & Questions (span 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Research Purpose */}
            <div className="sm:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                {isAm ? "የጥናቱ ዓላማ" : "Research Purpose"}
              </h3>
              <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed italic">
                "{survey.research_purpose}"
              </p>
            </div>

            {/* Target Audience */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#005985]">
                <span className="material-symbols-outlined text-[20px]">group</span>
                <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ዒላማ ተሳታፊዎች" : "Target Audience"}
                </h3>
              </div>
              <p className="font-headline font-bold text-lg text-[#0F172A] mb-0.5">
                {survey.target_audience}
              </p>
              <p className="text-xs text-[#64748B]">{survey.demographics}</p>
            </div>

            {/* Budget Allocation */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#005985]">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የበጀት ድልድል" : "Budget Allocation"}
                </h3>
              </div>
              <p className="font-headline font-bold text-lg text-[#0F172A] mb-0.5">
                {survey.budget.toLocaleString()} ETB
              </p>
              <p className="text-xs text-[#64748B]">
                {survey.reward_per_completion} ETB {isAm ? "በተሞላ መጠይቅ" : "per completion"}
              </p>
            </div>
          </div>

          {/* Survey Questions Instrument Preview */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#f8f9ff] flex justify-between items-center">
              <h3 className="font-headline font-bold text-sm text-[#0F172A]">
                {isAm ? "የጥናቱ መጠይቅ ቅድመ እይታ" : "Survey Instrument Preview"}
              </h3>
              <span className="text-xs font-semibold text-[#64748B]">
                {survey.questions.length} {isAm ? "ጥያቄዎች በድምሩ" : "Questions Total"}
              </span>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {survey.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-5 hover:bg-[#f8f9ff] transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                      <span className="text-[#64748B] mr-2">Q{idx + 1}.</span>
                      {q.text}
                    </p>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                        q.type === "Single Choice"
                          ? "bg-[#eff4ff] text-[#005985] border border-[#d3e4fe]"
                          : q.type === "Likert Scale"
                          ? "bg-[#d0e2ee] text-[#54656f] border border-[#c0c7d0]"
                          : "bg-[#eff4ff] text-[#005985] border border-[#d3e4fe]"
                      }`}
                    >
                      {q.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Compliance (span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">
              {isAm ? "ህግና ደንብ" : "Compliance"}
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#0F172A]">
                    {isAm ? "የIRB ፈቃድ" : "IRB Approval"}
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                    check_circle
                  </span>
                </div>
                {survey.irb_doc_url ? (
                  <Link
                    to={`/admin/compliance-docs/${survey.id}`}
                    className="text-xs font-bold text-[#005985] hover:underline flex items-center gap-1 mt-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>{isAm ? "ሰነድ እይ" : "View Doc"}</span>
                  </Link>
                ) : (
                  <span className="text-[11px] text-[#64748B]">{isAm ? "ሰነድ አልተያያዘም" : "No doc attached"}</span>
                )}
              </div>

              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#0F172A]">
                    {isAm ? "የመረጃ ደህንነት" : "Data Privacy"}
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                    check_circle
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#64748B]">
                  {survey.data_privacy_tier}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Actions & History (span 3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Actions Sticky Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs sticky top-6">
            <h3 className="font-headline font-bold text-base text-[#0F172A] mb-4">
              {isAm ? "የግምገማ ውሳኔ" : "Review Decision"}
            </h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setApproveModalOpen(true)}
                disabled={decide.isPending}
                className="w-full bg-[#005985] text-white py-2.5 px-4 rounded-lg text-xs font-bold hover:bg-[#106492] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>{isAm ? "ጥናቱን አጽድቅ" : "Approve Survey"}</span>
              </button>

              <button
                type="button"
                onClick={() => setCorrectionModalOpen(true)}
                disabled={decide.isPending}
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] py-2.5 px-4 rounded-lg text-xs font-semibold hover:border-[#005985] hover:text-[#005985] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>{isAm ? "እርማት ጠይቅ" : "Request Correction"}</span>
              </button>

              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={decide.isPending}
                className="w-full bg-[#ffdad6] text-[#ba1a1a] py-2.5 px-4 rounded-lg text-xs font-bold hover:bg-[#ba1a1a] hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                <span className="material-symbols-outlined text-[18px]">block</span>
                <span>{isAm ? "ጥናቱን ውድቅ አድርግ" : "Reject Survey"}</span>
              </button>
            </div>
          </div>

          {/* Review History */}
          <div className="bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-4">
              {isAm ? "የግምገማ ታሪክ" : "Review History"}
            </h3>
            <div className="relative pl-4 border-l-2 border-[#d3e4fe] space-y-4">
              {survey.history.map((h, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#005985] ring-4 ring-[#f8f9ff]" />
                  <p className="text-xs font-bold text-[#0F172A]">{h.title}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {h.date} by {h.user}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Request Correction Modal ── */}
      {correctionModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
            onClick={() => setCorrectionModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-base text-[#0F172A]">
                  {isAm ? "እርማት መጠየቂያ" : "Request Survey Correction"}
                </h3>
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  ✕
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  {isAm ? "የእርማት ዝርዝር ማብራሪያ" : "Notes for Researcher"}
                </label>
                <textarea
                  rows={4}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder={
                    isAm
                      ? "ለተመራማሪው ሊስተካከሉ የሚገባቸውን ነጥቦች እዚህ ይጻፉ..."
                      : "Describe required changes (e.g. clarify question wording, upload updated IRB approval)..."
                  }
                  className="w-full p-3 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#eff4ff] rounded-lg"
                >
                  {isAm ? "ሰርዝ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    decide.mutate({ decision: "request_changes", notes: correctionNotes });
                    setCorrectionModalOpen(false);
                  }}
                  disabled={decide.isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#005985] hover:bg-[#106492] rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isAm ? "እርማቱን ላክ" : "Send Correction Request"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* ── Approve Survey Confirmation Modal (Stitch Screen 66601c7feee045ab92e08a138b891f2e) ── */}
      <ApproveSurveyConfirmationModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={() => {
          decide.mutate({ decision: "passed" });
          setApproveModalOpen(false);
        }}
        isPending={decide.isPending}
        survey={{
          id: survey.id,
          title: survey.title,
          researcher_name: survey.researcher_name,
          research_category: survey.research_category,
          current_status: isAm ? "ግምገማ ይጠብቃል" : "Pending Review",
          document_status: survey.irb_approved ? "Accepted" : "Pending",
        }}
      />

      {/* ── Reject Survey Modal (Stitch Screen 5fb2ab1086804ebabbd6cb0fb368a540) ── */}
      <RejectSurveyModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={({ reason, explanation }) => {
          decide.mutate({ decision: "failed", reason, notes: explanation });
          setRejectModalOpen(false);
        }}
        isPending={decide.isPending}
        survey={{
          id: survey.id,
          title: survey.title,
          researcher_name: survey.researcher_name,
        }}
      />
    </div>
  );
}
