import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingBlock } from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";
import { ApproveSurveyConfirmationModal } from "@/components/admin/ApproveSurveyConfirmationModal";
import { RejectSurveyModal } from "@/components/admin/RejectSurveyModal";

interface ResubmissionData {
  id: string;
  survey_code: string;
  title: string;
  researcher_name: string;
  research_category: string;
  status: string;
  previous_version: {
    version_label: string;
    correction_date: string;
    correction_feedback: string;
    doc_name: string;
    doc_url?: string;
    total_budget: number;
    incentive_per_participant: number;
  };
  updated_version: {
    version_label: string;
    doc_name: string;
    doc_change_summary: string;
    doc_url?: string;
    researcher_note: string;
    previous_budget: number;
    new_budget: number;
    previous_incentive: number;
    new_incentive: number;
  };
}

const mockResubmissionData: ResubmissionData = {
  id: "srv-8924",
  survey_code: "SRV-8924",
  title: "Impact of Remote Work on Pediatric Mental Health in Urban Centers",
  researcher_name: "Dr. Sarah Jenkins",
  research_category: "Health Sciences",
  status: "Resubmitted",
  previous_version: {
    version_label: "Previous Version (V1)",
    correction_date: "Oct 12, 2023",
    correction_feedback:
      "Clarify the ethical consent process for minors. The provided document lacks specific guidelines for guardian co-signing. Also, budget justification for participant incentives is unclear.",
    doc_name: "consent_form_draft_v1.pdf",
    total_budget: 500,
    incentive_per_participant: 5,
  },
  updated_version: {
    version_label: "Updated Version (V2)",
    doc_name: "consent_form_minor_guardian_v2.pdf",
    doc_change_summary: "Added dual-signature requirement",
    researcher_note:
      "Updated the consent form to explicitly include a guardian co-signing section as requested in the previous review.",
    previous_budget: 500,
    new_budget: 750,
    previous_incentive: 5,
    new_incentive: 7.5,
  },
};

export function ResubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [furtherCorrectionNotes, setFurtherCorrectionNotes] = useState("");
  const [previewDocOpen, setPreviewDocOpen] = useState(false);

  const { data = mockResubmissionData, isLoading } = useQuery({
    queryKey: ["resubmission-review", id],
    queryFn: async () => {
      try {
        const res = await api<{ survey: ResubmissionData }>(`/admin/resubmission-review/${id}`);
        return res?.survey ?? mockResubmissionData;
      } catch {
        return mockResubmissionData;
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
      api<{ id: string }>(`/admin/survey-queue/${id || "srv-8924"}`, {
        body: { decision, reason, notes },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resubmission-review"] });
      queryClient.invalidateQueries({ queryKey: ["correction-queue"] });
      if (variables.decision === "passed") {
        navigate(`/admin/survey-approvals/${id || "srv-8924"}/success`, {
          state: {
            surveyTitle: data.title,
            adminName: "Abebe Admin",
          },
        });
      } else if (variables.decision === "failed") {
        navigate(`/admin/survey-approvals/${id || "srv-8924"}/rejected`, {
          state: {
            surveyTitle: data.title,
            adminName: "Abebe Admin",
            reason: variables.reason || "Ethical Non-Compliance",
            notes: variables.notes,
          },
        });
      } else {
        navigate("/admin/correction-queue");
      }
    },
  });

  if (isLoading) {
    return <LoadingBlock label={isAm ? "የድጋሚ ግምገማ ዝርዝር በመጫን ላይ..." : "Loading resubmission review…"} />;
  }

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#0F172A] pb-28 max-w-[1600px] mx-auto">
      {/* ── Breadcrumbs & Top Section (Exact Stitch Screen 13605bbe317c455aa5611d113d11c4ca) ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <nav className="flex items-center text-[#64748B] text-xs font-semibold mb-2">
            <Link to="/admin" className="hover:text-[#005985] transition-colors">
              {isAm ? "ዳሽቦርድ" : "Dashboard"}
            </Link>
            <span className="material-symbols-outlined text-[14px] mx-1">chevron_right</span>
            <Link to="/admin/review-queue" className="hover:text-[#005985] transition-colors">
              {isAm ? "የማጽደቂያ ወረፋዎች" : "Approval Queues"}
            </Link>
            <span className="material-symbols-outlined text-[14px] mx-1">chevron_right</span>
            <Link to="/admin/correction-queue" className="hover:text-[#005985] transition-colors">
              {isAm ? "የእርማት ወረፋ" : "Correction Queue"}
            </Link>
            <span className="material-symbols-outlined text-[14px] mx-1">chevron_right</span>
            <span className="text-[#0F172A] font-bold">
              {isAm ? "የድጋሚ ግምገማ" : "Resubmission Review"}
            </span>
          </nav>

          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Survey #{data.survey_code}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#005985] border border-[#005985]/20 text-[11px] font-bold uppercase tracking-wider">
              {isAm ? "እንደገና የቀረበ" : "Resubmitted"}
            </span>
          </div>
          <p className="text-sm text-[#64748B] max-w-2xl">{data.title}</p>
        </div>

        <Link
          to="/admin/correction-queue"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:border-[#005985] hover:text-[#005985] transition-colors text-xs font-semibold shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{isAm ? "ወደ ወረፋው ተመለስ" : "Back to Queue"}</span>
        </Link>
      </div>

      {/* ── Split View Container (2-Column V1 vs V2 Comparison) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── LEFT COLUMN: PREVIOUS VERSION (V1) ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <span className="material-symbols-outlined text-[#64748B]">history</span>
            <h2 className="font-bold text-base text-[#0F172A]">
              {isAm ? "ቀዳሚ ስሪት (ስሪት 1)" : "Previous Version (V1)"}
            </h2>
          </div>

          {/* Sticky Feedback Alert */}
          <div className="bg-[#ffdad6]/20 border-l-4 border-[#ba1a1a] p-4 rounded-r-lg shadow-xs sticky top-4 z-10 bg-white">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-[#ba1a1a] text-[20px] mt-0.5 shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#93000a] mb-1">
                  {isAm ? "የእርማት ጥያቄ" : "Correction Requested"} ({data.previous_version.correction_date})
                </h3>
                <p className="text-xs text-[#93000a]/90 leading-relaxed">
                  {data.previous_version.correction_feedback}
                </p>
              </div>
            </div>
          </div>

          {/* Previous Compliance Documents */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 opacity-75 shadow-xs">
            <h4 className="text-[11px] font-bold uppercase text-[#64748B] tracking-widest mb-3">
              {isAm ? "የስነምግባር ማረጋገጫ ሰነዶች" : "Compliance Documents"}
            </h4>
            <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg bg-[#f8f9ff]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#64748B]">description</span>
                <span className="text-xs text-[#0F172A] font-mono">{data.previous_version.doc_name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocOpen(true)}
                className="text-[#005985] hover:underline text-xs font-bold cursor-pointer"
              >
                {isAm ? "እይ" : "View"}
              </button>
            </div>
          </div>

          {/* Previous Budget & Rewards */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 opacity-75 shadow-xs">
            <h4 className="text-[11px] font-bold uppercase text-[#64748B] tracking-widest mb-3">
              {isAm ? "በጀት እና ማበረታቻ" : "Budget & Rewards"}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">
                  {isAm ? "አጠቃላይ በጀት" : "Total Budget"}
                </span>
                <span className="font-semibold text-[#0F172A]">
                  {data.previous_version.total_budget} ETB
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">
                  {isAm ? "ለአንድ ተሳታፊ ማበረታቻ" : "Incentive per Participant"}
                </span>
                <span className="font-semibold text-[#0F172A]">
                  {data.previous_version.incentive_per_participant} ETB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: UPDATED VERSION (V2) ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#005985]">update</span>
              <h2 className="font-bold text-base text-[#005985]">
                {isAm ? "የተሻሻለ ስሪት (ስሪት 2)" : "Updated Version (V2)"}
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-[#d3e4fe] text-[#005985] text-[11px] font-bold border border-[#005985]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005985] mr-1.5 animate-pulse" />
              {isAm ? "ለውጦች ተገኝተዋል" : "Changes Detected"}
            </span>
          </div>

          {/* Diff Block 1: Compliance Documents */}
          <div className="bg-white border border-[#005985]/30 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#005985]" />
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-bold uppercase text-[#64748B] tracking-widest">
                {isAm ? "የስነምግባር ማረጋገጫ ሰነዶች" : "Compliance Documents"}
              </h4>
              <span className="text-[10px] font-bold bg-[#dce9ff] text-[#005985] px-2 py-0.5 rounded">
                {isAm ? "የተሻሻለ" : "Modified"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-[#005985]/20 rounded-lg bg-[#eff4ff] gap-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#005985] text-[22px] mt-0.5">
                  description
                </span>
                <div>
                  <span className="text-xs font-mono font-bold text-[#0F172A] block">
                    {data.updated_version.doc_name}
                  </span>
                  <span className="text-[11px] font-semibold text-[#005985] block mt-0.5">
                    {data.updated_version.doc_change_summary}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocOpen(true)}
                className="flex items-center justify-center gap-1.5 text-[#005985] hover:bg-[#dce9ff] text-xs font-bold bg-white px-3 py-1.5 rounded border border-[#E2E8F0] shadow-xs cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>{isAm ? "ሰነዱን እይ" : "View Document"}</span>
              </button>
            </div>

            {/* Researcher Note */}
            <div className="mt-3.5 p-3.5 bg-[#f8f9ff] border border-[#E2E8F0] rounded-lg">
              <span className="text-[11px] font-bold text-[#64748B] block mb-1">
                {isAm ? "የተመራማሪው ማስታወሻ:" : "Researcher Note:"}
              </span>
              <p className="text-xs text-[#50616b] italic leading-relaxed">
                "{data.updated_version.researcher_note}"
              </p>
            </div>
          </div>

          {/* Diff Block 2: Budget & Rewards */}
          <div className="bg-white border border-[#005985]/30 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#005985]" />
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-bold uppercase text-[#64748B] tracking-widest">
                {isAm ? "በጀት እና ማበረታቻ" : "Budget & Rewards"}
              </h4>
              <span className="text-[10px] font-bold bg-[#dce9ff] text-[#005985] px-2 py-0.5 rounded">
                {isAm ? "የተሻሻለ" : "Modified"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-[#eff4ff] border border-[#005985]/20 rounded-lg">
                <span className="text-[11px] text-[#64748B] block mb-1">
                  {isAm ? "አጠቃላይ በጀት" : "Total Budget"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-[#64748B] text-xs">
                    {data.updated_version.previous_budget} ETB
                  </span>
                  <span className="material-symbols-outlined text-[#64748B] text-[14px]">
                    arrow_forward
                  </span>
                  <span className="text-[#005985] font-bold text-sm">
                    {data.updated_version.new_budget} ETB
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#eff4ff] border border-[#005985]/20 rounded-lg">
                <span className="text-[11px] text-[#64748B] block mb-1">
                  {isAm ? "ለአንድ ተሳታፊ ማበረታቻ" : "Incentive per Participant"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-[#64748B] text-xs">
                    {data.updated_version.previous_incentive} ETB
                  </span>
                  <span className="material-symbols-outlined text-[#64748B] text-[14px]">
                    arrow_forward
                  </span>
                  <span className="text-[#005985] font-bold text-sm">
                    {data.updated_version.new_incentive} ETB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Footer Action Bar (Exact Stitch Design) ── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[260px] bg-white border-t border-[#E2E8F0] p-4 px-6 md:px-8 shadow-2xl z-40">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-[#64748B] text-xs">
            <span className="material-symbols-outlined text-[#005985] text-[18px]">info</span>
            <span>
              {isAm
                ? "ጥናቱን ከማጽደቅዎ በፊት ሁሉም የተጠየቁ እርማቶች መሟላታቸውን ያረጋግጡ።"
                : "Ensure all requested corrections are fully met before approving."}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setRejectModalOpen(true)}
              disabled={decide.isPending}
              className="px-4 py-2 rounded-lg border border-[#ba1a1a] text-[#ba1a1a] text-xs font-bold hover:bg-[#ffdad6]/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAm ? "ውድቅ አድርግ" : "Reject Survey"}
            </button>

            <button
              type="button"
              onClick={() => setCorrectionModalOpen(true)}
              disabled={decide.isPending}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-xs font-semibold hover:border-[#005985] hover:text-[#005985] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAm ? "ተጨማሪ እርማት ጠይቅ" : "Request Further Correction"}
            </button>

            <button
              type="button"
              onClick={() => setApproveModalOpen(true)}
              disabled={decide.isPending}
              className="px-5 py-2 rounded-lg bg-[#005985] text-white text-xs font-bold hover:bg-[#106492] transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{isAm ? "ጥናቱን አጽድቅ" : "Approve Survey"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Document Preview Modal ── */}
      {previewDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-xs"
            onClick={() => setPreviewDocOpen(false)}
          />
          <div className="relative z-50 w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden flex flex-col p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005985]">description</span>
                <span className="font-bold text-sm text-[#0F172A] font-mono">
                  {data.updated_version.doc_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="py-8 px-4 bg-[#f8f9ff] border border-dashed border-[#d3e4fe] rounded-lg my-4 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[#005985] text-[48px] mb-2">
                picture_as_pdf
              </span>
              <p className="font-bold text-xs text-[#0F172A] mb-1">
                Ethical Clearance & Guardian Consent Document (V2)
              </p>
              <p className="text-[11px] text-[#64748B]">
                Includes explicit dual-signature and minor assent authorization section.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDocOpen(false)}
                className="px-4 py-1.5 bg-[#005985] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {isAm ? "ዝጋ" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Further Correction Modal ── */}
      {correctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-xs"
            onClick={() => setCorrectionModalOpen(false)}
          />
          <div className="relative z-50 w-full max-w-lg bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden flex flex-col p-6 font-['Inter',sans-serif]">
            <h3 className="font-bold text-base text-[#0F172A] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#005985]">edit_note</span>
              <span>{isAm ? "ተጨማሪ እርማት ጠይቅ" : "Request Further Correction"}</span>
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              {isAm
                ? "ለተመራማሪው ተጨማሪ ማስተካከያ የሚያስፈልጋቸውን ነጥቦች በዝርዝር ያብራሩ።"
                : "Specify remaining issues or additional clarification required from the researcher."}
            </p>
            <textarea
              rows={4}
              value={furtherCorrectionNotes}
              onChange={(e) => setFurtherCorrectionNotes(e.target.value)}
              placeholder={
                isAm
                  ? "የሚያስፈልጉትን ተጨማሪ ለውጦች እዚህ ይግለጹ..."
                  : "Describe further required changes..."
              }
              className="w-full bg-[#f8f9ff] border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#005985] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#eff4ff] rounded-lg cursor-pointer"
              >
                {isAm ? "ሰርዝ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  decide.mutate({ decision: "request_changes", notes: furtherCorrectionNotes });
                  setCorrectionModalOpen(false);
                }}
                disabled={decide.isPending || !furtherCorrectionNotes.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#005985] hover:bg-[#106492] rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isAm ? "እርማቱን ላክ" : "Send Correction Request"}
              </button>
            </div>
          </div>
        </div>
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
          id: data.id,
          title: data.title,
          researcher_name: data.researcher_name,
          research_category: data.research_category,
          current_status: isAm ? "እንደገና የቀረበ" : "Resubmitted",
          document_status: "Accepted (V2)",
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
          id: data.id,
          title: data.title,
          researcher_name: data.researcher_name,
        }}
      />
    </div>
  );
}
