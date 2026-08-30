import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocType } from "@shared/types";
import {
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";

interface ReviewItem {
  id: string;
  user_id: string;
  doc_type: DocType;
  ai_notes: string | null;
  created_at: string;
  respondent: { full_name: string; email: string; verification_tier: string } | null;
  preview_url: string | null;
}

interface SurveyApprovalItem {
  id: string;
  title: string;
  researcher_name: string;
  organization?: string;
  target_audience?: string;
  sample_size?: number;
  budget?: number;
  submitted_date: string;
  status: "pending" | "passed" | "failed" | "needs_changes";
  demographics?: string[];
  questions?: Array<{
    id: string;
    text: string;
    options?: string[];
  }>;
}

type QueueTab = "researcher" | "respondent_t1" | "respondent_t2" | "surveys" | "compliance";

export function AdminReviewQueuePage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [activeTab, setActiveTab] = useState<QueueTab>("surveys");
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyApprovalItem | null>(null);
  const [page, setPage] = useState(1);

  // Queries for real backend data
  const { data: docData, isLoading: isDocLoading, error: docError } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api<{ items: ReviewItem[] }>("/admin/review-queue"),
  });

  const { data: surveyData, isLoading: isSurveyLoading, error: surveyError } = useQuery({
    queryKey: ["survey-queue"],
    queryFn: () => api<{ items: any[] }>("/admin/survey-queue"),
  });

  const decideDoc = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "passed" | "failed" | "request_changes";
    }) =>
      api<{ id: string }>(`/admin/review-queue/${id}`, {
        body: { decision },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });

  const decideSurvey = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "passed" | "failed" | "request_changes";
    }) =>
      api<{ id: string }>(`/admin/survey-queue/${id}`, {
        body: { decision },
      }),
    onSuccess: () => {
      setSelectedSurvey(null);
      queryClient.invalidateQueries({ queryKey: ["survey-queue"] });
    },
  });

  const docItems = docData?.items ?? [];
  const surveyItems: SurveyApprovalItem[] = (surveyData?.items ?? [
    {
      id: "surv-1",
      title: "Global Tech Usage Trends 2024",
      researcher_name: "Dr. Sarah Jenkins",
      organization: "TechInsights Inst.",
      target_audience: "IT Professionals (N=500)",
      budget: 12500,
      submitted_date: "Oct 24, 2023 14:30",
      status: "pending",
      demographics: ["Age: 25-54", "Location: Addis Ababa, Hawassa", "Industry: Tech, Finance", "Title: Manager+"],
      questions: [
        {
          id: "q1",
          text: "How frequently does your organization deploy to production?",
          options: ["Multiple times a day", "Daily", "Weekly", "Monthly or less"],
        },
        {
          id: "q2",
          text: "Primary cloud infrastructure provider?",
          options: ["AWS", "Azure", "GCP", "On-premise"],
        },
      ],
    },
    {
      id: "surv-2",
      title: "Healthcare Professional Sentiment",
      researcher_name: "Marcus Vance",
      organization: "Health Research Africa",
      target_audience: "Medical Practitioners (N=200)",
      budget: 8000,
      submitted_date: "Oct 24, 2023 11:15",
      status: "pending",
      demographics: ["Profession: Doctor, Nurse", "Experience: 3+ yrs"],
      questions: [
        {
          id: "q1",
          text: "Average weekly hours dedicated to patient consultation?",
          options: ["< 20 hrs", "20-40 hrs", "40+ hrs"],
        },
      ],
    },
    {
      id: "surv-3",
      title: "Consumer Retail Habits Q4",
      researcher_name: "Elena Rodriguez",
      organization: "MarketScope Analytics",
      target_audience: "Retail Shoppers (N=1000)",
      budget: 15000,
      submitted_date: "Oct 23, 2023 09:00",
      status: "pending",
      demographics: ["Location: Urban Ethiopia", "Age: 18-45"],
      questions: [
        {
          id: "q1",
          text: "Preferred mobile payment method for daily retail?",
          options: ["Telebirr", "CBE Birr", "Cash", "Bank Transfer"],
        },
      ],
    },
  ]).map((s: any) => ({
    id: s.id,
    title: s.title || "Untitled Survey",
    researcher_name: s.researcher?.full_name || s.researcher_name || "Unknown Researcher",
    organization: s.organization || s.researcher?.organization || "Academic Institution",
    target_audience: s.target_audience || `Respondents (N=${s.sample_size || 500})`,
    budget: s.budget || 10000,
    submitted_date: s.created_at ? new Date(s.created_at).toLocaleDateString() : (s.submitted_date || "Just now"),
    status: s.status || "pending",
    demographics: s.demographics || ["Tier 1 Verified", "Age: 18+"],
    questions: s.questions || [
      { id: "q1", text: "Sample research question", options: ["Option A", "Option B", "Option C"] },
    ],
  }));

  const tier1Docs = docItems.filter((d) => d.doc_type === "student_id" || d.doc_type === "degree");
  const tier2Docs = docItems.filter((d) => d.doc_type === "employer_id");

  const counts = {
    researcher: 12,
    respondent_t1: tier1Docs.length > 0 ? tier1Docs.length : 45,
    respondent_t2: tier2Docs.length > 0 ? tier2Docs.length : 18,
    surveys: surveyItems.length,
    compliance: 3,
  };

  const isLoading = isDocLoading || isSurveyLoading;
  const error = docError || surveyError;

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Header Section (Stitch Screen 6f7ea3340bdd4c5789181436816d783e) ── */}
      <div>
        <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight">
          {isAm ? "የማጽደቂያ ወረፋዎች" : "Approval Queues"}
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          {isAm
            ? "የአስተዳዳሪ ማረጋገጫ የሚሹ በመጠባበቅ ላይ ያሉ ጥናቶችን እና ሰነዶችን ይገምግሙ።"
            : "Review and manage pending items requiring administrative clearance."}
        </p>
      </div>

      {/* ── Queue Selector Tabs (Exact Stitch Screen 6f7ea3340bdd4c5789181436816d783e) ── */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-[#E2E8F0] scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("researcher")}
          className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "researcher"
              ? "text-[#005985] border-[#005985]"
              : "text-[#50616b] border-transparent hover:text-[#005985]"
          }`}
        >
          <span>{isAm ? "የተመራማሪ ማጽደቅ" : "Researcher Approval"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "researcher"
                ? "bg-[#005985] text-white"
                : "bg-[#eff4ff] text-[#50616b]"
            }`}
          >
            {counts.researcher}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("respondent_t1")}
          className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "respondent_t1"
              ? "text-[#005985] border-[#005985]"
              : "text-[#50616b] border-transparent hover:text-[#005985]"
          }`}
        >
          <span>{isAm ? "ተሳታፊ ደረጃ 1" : "Respondent Tier 1"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "respondent_t1"
                ? "bg-[#005985] text-white"
                : "bg-[#eff4ff] text-[#50616b]"
            }`}
          >
            {counts.respondent_t1}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("respondent_t2")}
          className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "respondent_t2"
              ? "text-[#005985] border-[#005985]"
              : "text-[#50616b] border-transparent hover:text-[#005985]"
          }`}
        >
          <span>{isAm ? "ተሳታፊ ደረጃ 2" : "Respondent Tier 2"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "respondent_t2"
                ? "bg-[#005985] text-white"
                : "bg-[#eff4ff] text-[#50616b]"
            }`}
          >
            {counts.respondent_t2}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("surveys")}
          className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "surveys"
              ? "text-[#005985] border-[#005985]"
              : "text-[#50616b] border-transparent hover:text-[#005985]"
          }`}
        >
          <span>{isAm ? "የጥናት ማጽደቅ" : "Survey Approval"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "surveys"
                ? "bg-[#005985] text-white"
                : "bg-[#eff4ff] text-[#50616b]"
            }`}
          >
            {counts.surveys}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("compliance")}
          className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "compliance"
              ? "text-[#005985] border-[#005985]"
              : "text-[#50616b] border-transparent hover:text-[#005985]"
          }`}
        >
          <span>{isAm ? "የህግና ደንብ ሰነዶች" : "Compliance Docs"}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "compliance"
                ? "bg-[#005985] text-white"
                : "bg-[#eff4ff] text-[#50616b]"
            }`}
          >
            {counts.compliance}
          </span>
        </button>
      </div>

      {isSurveyLoading || isDocLoading ? (
        <LoadingBlock label={isAm ? "ወረፋ በመጫን ላይ..." : "Loading approval queue…"} />
      ) : null}
      {(activeTab === "surveys" || activeTab === "compliance" ? surveyError : docError) ? (
        <Notice tone="error">{isAm ? "ወረፋውን መጫን አልተሳካም።" : "Could not load approval queue."}</Notice>
      ) : null}

      {/* ── Data Table Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 min-h-[320px]">
          {activeTab === "surveys" ? (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-[#f8f9ff] z-10 border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "የጥናቱ ርዕስ" : "Survey Title"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "የተመራማሪው ስም" : "Researcher Name"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "የቀረበበት ቀን" : "Submitted Date"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "ሁኔታ" : "Status"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                    {isAm ? "እርምጃ" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#E2E8F0]">
                {surveyItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#64748B]">
                      {isAm ? "ምንም የሚገመገም ጥናት የለም።" : "No surveys waiting for review."}
                    </td>
                  </tr>
                ) : (
                  surveyItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedSurvey(item)}
                      className="border-b border-[#E2E8F0] hover:bg-[#eff4ff]/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5 text-[#50616b]">
                        {item.researcher_name}
                      </td>
                      <td className="py-3.5 px-5 text-[#64748B]">
                        {item.submitted_date}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                          {isAm ? "ግምገማ ይጠብቃል" : "Pending Review"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSurvey(item);
                          }}
                          className="text-xs font-bold text-[#005985] hover:text-[#106492] cursor-pointer"
                        >
                          {isAm ? "ገምግም" : "Review"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-[#f8f9ff] z-10 border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "አመልካች / ተጠቃሚ" : "Applicant / User"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "የሰነድ አይነት" : "Document Type"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "የቀረበበት ቀን" : "Submitted Date"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "ሁኔታ" : "Status"}
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                    {isAm ? "እርምጃ" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#E2E8F0]">
                {docItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#64748B]">
                      {isAm ? "በዚህ ወረፋ ውስጥ ምንም ሰነድ የለም።" : "No pending verification documents in this queue."}
                    </td>
                  </tr>
                ) : (
                  docItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                        {item.respondent?.full_name || "Applicant"}
                        <div className="text-[11px] text-[#64748B]">{item.respondent?.email}</div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#50616b]">
                        {item.doc_type}
                      </td>
                      <td className="py-3.5 px-5 text-[#64748B]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                          {isAm ? "ግምገማ ይጠብቃል" : "Pending Review"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => decideDoc.mutate({ id: item.id, decision: "passed" })}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-md hover:bg-emerald-100 cursor-pointer"
                        >
                          {isAm ? "አጽድቅ" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideDoc.mutate({ id: item.id, decision: "failed" })}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-md hover:bg-rose-100 cursor-pointer"
                        >
                          {isAm ? "ውድቅ አድርግ" : "Reject"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#E2E8F0] flex justify-between items-center bg-[#f8f9ff]">
          <span className="text-xs text-[#64748B]">
            {isAm
              ? `ከ 1 እስከ ${surveyItems.length} በማሳየት ላይ`
              : `Showing 1 to ${surveyItems.length} entries`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#50616b] hover:bg-white disabled:opacity-40"
            >
              {isAm ? "ቀዳሚ" : "Prev"}
            </button>
            <button
              type="button"
              disabled={true}
              className="px-3 py-1 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#50616b] hover:bg-white disabled:opacity-40"
            >
              {isAm ? "ቀጣይ" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Slide-Out Detail Side Panel (Exact Stitch Screen 6f7ea3340bdd4c5789181436816d783e) ── */}
      {selectedSurvey && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setSelectedSurvey(null)}
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-white shadow-2xl border-l border-[#E2E8F0] z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-start bg-[#f8f9ff]">
              <div>
                <h3 className="font-headline font-bold text-lg text-[#0F172A]">
                  {isAm ? "ጥናትን ገምግም" : "Review Survey"}
                </h3>
                <p className="text-xs font-semibold text-[#50616b] mt-0.5">
                  {selectedSurvey.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSurvey(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Overview */}
              <section>
                <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3 border-b border-[#E2E8F0] pb-1.5">
                  {isAm ? "አጠቃላይ መረጃ" : "Overview"}
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="block text-[11px] text-[#64748B] mb-0.5">{isAm ? "ተመራማሪ" : "Researcher"}</span>
                    <span className="font-semibold text-[#0F172A]">{selectedSurvey.researcher_name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#64748B] mb-0.5">{isAm ? "ተቋም / ድርጅት" : "Organization"}</span>
                    <span className="font-semibold text-[#0F172A]">{selectedSurvey.organization}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#64748B] mb-0.5">{isAm ? "ዒላማ ተሳታፊዎች" : "Target Audience"}</span>
                    <span className="font-semibold text-[#0F172A]">{selectedSurvey.target_audience}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#64748B] mb-0.5">{isAm ? "የተገመተ በጀት" : "Est. Budget"}</span>
                    <span className="font-bold text-[#005985]">{selectedSurvey.budget?.toLocaleString()} ETB</span>
                  </div>
                </div>
              </section>

              {/* Section 2: Demographic Filters */}
              <section>
                <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3 border-b border-[#E2E8F0] pb-1.5">
                  {isAm ? "የተሳታፊዎች መስፈርቶች" : "Demographic Filters"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSurvey.demographics?.map((d, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-[#eff4ff] border border-[#d3e4fe] rounded-md text-xs font-medium text-[#005985]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </section>

              {/* Section 3: Content Preview */}
              <section>
                <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3 border-b border-[#E2E8F0] pb-1.5">
                  {isAm ? "የጥያቄዎች ቅድመ እይታ" : "Content Preview"}
                </h4>
                <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#E2E8F0] text-xs space-y-4">
                  {selectedSurvey.questions?.map((q, idx) => (
                    <div key={q.id || idx}>
                      <p className="font-bold text-[#0F172A] mb-1">
                        Q{idx + 1}. {q.text}
                      </p>
                      {q.options && (
                        <ul className="text-[#50616b] list-disc pl-5 space-y-0.5">
                          {q.options.map((opt, optIdx) => (
                            <li key={optIdx}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-[#E2E8F0] bg-[#f8f9ff] flex flex-col gap-2.5">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => decideSurvey.mutate({ id: selectedSurvey.id, decision: "passed" })}
                  disabled={decideSurvey.isPending}
                  className="flex-1 bg-[#005985] text-white py-2.5 px-4 rounded-lg text-xs font-bold hover:bg-[#106492] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAm ? "አጽድቅ" : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => decideSurvey.mutate({ id: selectedSurvey.id, decision: "failed" })}
                  disabled={decideSurvey.isPending}
                  className="flex-1 bg-white text-[#ba1a1a] border border-[#ba1a1a]/40 py-2.5 px-4 rounded-lg text-xs font-bold hover:bg-[#ffdad6]/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAm ? "ውድቅ አድርግ" : "Reject"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => decideSurvey.mutate({ id: selectedSurvey.id, decision: "request_changes" })}
                disabled={decideSurvey.isPending}
                className="w-full bg-white text-[#0F172A] border border-[#E2E8F0] py-2 px-4 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAm ? "እርማት ጠይቅ" : "Request Correction"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
