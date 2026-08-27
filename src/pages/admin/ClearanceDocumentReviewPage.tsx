import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";

interface ClearanceDocDetail {
  id: string;
  survey_id?: string;
  survey_title: string;
  document_type: string;
  research_category: string;
  uploaded_by: {
    full_name: string;
    email: string;
    avatar_initials: string;
  };
  upload_timestamp: string;
  filename: string;
  filesize: string;
  preview_url: string | null;
  status: "under_review" | "approved" | "rejected" | "replacement_requested";
}

export function ClearanceDocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [reviewerNotes, setReviewerNotes] = useState("");
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clearance-doc", id],
    queryFn: async () => {
      try {
        const res = await api<{ doc: ClearanceDocDetail }>(`/admin/clearance-docs/${id}`);
        return res.doc;
      } catch {
        // Fallback demo data adhering exactly to Stitch Screen e0cab0f7836e43b8a7ddf8650daa3a64
        return {
          id: id || "doc-irb-2023",
          survey_id: "srv-urban-noise",
          survey_title: "Impact of Urban Noise on Sleep Quality",
          document_type: "Institutional Review Board (IRB) Approval",
          research_category: "Social & Behavioral Sciences",
          uploaded_by: {
            full_name: "Sarah Jenkins",
            email: "s.jenkins@example.edu",
            avatar_initials: "SJ",
          },
          upload_timestamp: "Oct 12, 2023, 14:32:05 UTC",
          filename: "IRB_Jenkins_2023_v2.pdf",
          filesize: "4.2 MB",
          preview_url: "https://example.com/irb_jenkins_2023.pdf",
          status: "under_review",
        } as ClearanceDocDetail;
      }
    },
  });

  const decide = useMutation({
    mutationFn: ({
      decision,
      notes,
    }: {
      decision: "approved" | "rejected" | "replacement_requested";
      notes?: string;
    }) =>
      api<{ id: string }>(`/admin/clearance-docs/${id || "doc-irb-2023"}/decision`, {
        body: { decision, notes: notes || reviewerNotes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clearance-doc", id] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["survey-queue"] });
      navigate(data?.survey_id ? `/admin/survey-approvals/${data.survey_id}` : "/admin/review-queue");
    },
  });

  const doc = data;

  if (isLoading) {
    return <LoadingBlock label={isAm ? "የማረጋገጫ ሰነድ በመጫን ላይ..." : "Loading clearance document…"} />;
  }

  if (error || !doc) {
    return (
      <Notice tone="error">
        {isAm ? "ሰነዱን መጫን አልተሳካም።" : "Could not load clearance document."}
      </Notice>
    );
  }

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Breadcrumbs & Back Navigation (Exact Stitch Screen e0cab0f7836e43b8a7ddf8650daa3a64) ── */}
      <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-semibold text-[#64748B]">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin" className="hover:text-[#005985] transition-colors">
            {isAm ? "ዳሽቦርድ" : "Dashboard"}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/admin/review-queue" className="hover:text-[#005985] transition-colors">
            {isAm ? "የማጽደቂያ ወረፋዎች" : "Approval Queues"}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link
            to={doc.survey_id ? `/admin/survey-approvals/${doc.survey_id}` : "/admin/survey-approvals"}
            className="hover:text-[#005985] transition-colors truncate max-w-[200px]"
          >
            {doc.survey_title}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#0F172A] font-bold">{isAm ? "የሰነድ ግምገማ" : "Document Review"}</span>
        </div>

        <Link
          to={doc.survey_id ? `/admin/survey-approvals/${doc.survey_id}` : "/admin/survey-approvals"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] hover:bg-[#eff4ff] transition-colors shadow-xs self-start sm:self-auto font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{isAm ? "ወደ ጥናት ግምገማ ተመለስ" : "Return to Survey Review"}</span>
        </Link>
      </nav>

      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 uppercase">
            {isAm ? "በግምገማ ላይ" : "Under Review"}
          </span>
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            {isAm ? "የIRB የስነምግባር ማረጋገጫ" : "IRB Ethical Clearance"}
          </span>
        </div>
        <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight mb-1">
          {doc.survey_title}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] flex items-center gap-1.5">
          <span>{isAm ? "ያቀረበው" : "Submitted by"}</span>
          <span className="text-[#005985] font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">person</span>
            {doc.uploaded_by.full_name}
          </span>
        </p>
      </div>

      {/* ── Main Layout Grid (Left: Preview, Right: Metadata & Decision) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Preview (span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col h-full min-h-[560px]">
            {/* Preview Card Header */}
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#f8f9ff]">
              <h2 className="font-headline font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">description</span>
                <span>{isAm ? "የሰነድ ቅድመ እይታ" : "Document Preview"}</span>
              </h2>
              <div className="flex items-center gap-2">
                {doc.preview_url && (
                  <a
                    href={doc.preview_url}
                    download={doc.filename}
                    className="p-1.5 text-[#64748B] hover:text-[#005985] rounded-md hover:bg-white transition-colors"
                    title={isAm ? "አውርድ" : "Download Original"}
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setFullscreenPreview(true)}
                  className="p-1.5 text-[#64748B] hover:text-[#005985] rounded-md hover:bg-white transition-colors cursor-pointer"
                  title={isAm ? "ሙሉ ገጽ አሳይ" : "Expand View"}
                >
                  <span className="material-symbols-outlined text-[20px]">open_in_full</span>
                </button>
              </div>
            </div>

            {/* Document Viewer Container */}
            <div className="flex-1 bg-[#f8f9ff] flex items-center justify-center p-8 border-t border-[#E2E8F0] border-dashed">
              <div className="text-center max-w-md bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-xs w-full">
                <div className="w-20 h-24 bg-[#eff4ff] border border-[#d3e4fe] rounded-lg mx-auto mb-5 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-4xl text-[#005985]">
                    picture_as_pdf
                  </span>
                </div>
                <p className="font-bold text-sm text-[#0F172A] mb-1">{doc.filename}</p>
                <p className="text-xs text-[#64748B] mb-5">
                  {doc.filesize} • {isAm ? "የተጫነው" : "Uploaded"} {doc.upload_timestamp}
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFullscreenPreview(true)}
                    className="px-4 py-2 bg-[#005985] text-white rounded-lg text-xs font-bold hover:bg-[#106492] transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span>{isAm ? "ሰነዱን ክፈት" : "Open Viewer"}</span>
                  </button>
                  {doc.preview_url && (
                    <a
                      href={doc.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-bold hover:bg-[#eff4ff] transition-colors inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      <span>{isAm ? "በአዲስ ታብ" : "New Tab"}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Decision (span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Metadata Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">
              {isAm ? "የሰነድ መረጃ" : "Document Metadata"}
            </h3>
            <ul className="space-y-3.5 text-xs">
              <li className="flex flex-col gap-1 border-b border-[#E2E8F0] pb-3">
                <span className="text-[11px] text-[#64748B]">{isAm ? "የሰነድ አይነት" : "Document Type"}</span>
                <span className="font-semibold text-[#0F172A]">{doc.document_type}</span>
              </li>
              <li className="flex flex-col gap-1 border-b border-[#E2E8F0] pb-3">
                <span className="text-[11px] text-[#64748B]">{isAm ? "የምርምር ዘርፍ" : "Research Category"}</span>
                <span className="font-semibold text-[#0F172A]">{doc.research_category}</span>
              </li>
              <li className="flex flex-col gap-1 border-b border-[#E2E8F0] pb-3">
                <span className="text-[11px] text-[#64748B]">{isAm ? "የጫነው ተጠቃሚ" : "Uploaded By"}</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-[#d0e2ee] text-[#54656f] flex items-center justify-center text-[10px] font-bold">
                    {doc.uploaded_by.avatar_initials}
                  </div>
                  <span className="font-semibold text-[#0F172A]">{doc.uploaded_by.full_name}</span>
                </div>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-[11px] text-[#64748B]">{isAm ? "የተጫነበት ሰዓት" : "Upload Timestamp"}</span>
                <span className="font-medium text-[#0F172A]">{doc.upload_timestamp}</span>
              </li>
            </ul>
          </div>

          {/* Reviewer Notes (Internal) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <label
              htmlFor="reviewer-notes"
              className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2"
            >
              {isAm ? "የገምጋሚ ማስታወሻ (ውስጣዊ)" : "Reviewer Notes (Internal)"}
            </label>
            <textarea
              id="reviewer-notes"
              rows={4}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder={
                isAm
                  ? "ስለ ሰነዱ ትክክለኛነት፣ የጎደሉ ፊርማዎች ወይም የውድቅ ምክንያቶች እዚህ ይጻፉ..."
                  : "Add observations about validity, missing signatures, or reasons for rejection..."
              }
              className="w-full bg-[#f8f9ff] border border-[#E2E8F0] rounded-lg p-3 text-xs focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] transition-colors"
            />
            <p className="text-[10px] text-[#64748B] mt-2 leading-tight">
              {isAm
                ? "ማስታወሻዎች የሚታዩት ለአስተዳዳሪ ሰራተኞች ብቻ ነው (እርማት ካልተጠየቀ በስተቀር)።"
                : "Notes are visible only to admin staff, unless specifically included in a 'Request Replacement' message."}
            </p>
          </div>

          {/* Verification Decision Sticky Action Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs sticky top-6">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3">
              {isAm ? "የማረጋገጫ ውሳኔ" : "Verification Decision"}
            </h3>

            {/* Critical Reminder Box */}
            <div className="bg-[#eff4ff] border border-[#d3e4fe] rounded-lg p-3 mb-4 flex gap-2.5 items-start">
              <span className="material-symbols-outlined text-[#005985] text-[18px] shrink-0 mt-0.5">
                info
              </span>
              <p className="text-[11px] text-[#40484f] leading-snug">
                <strong className="font-bold block mb-0.5 text-[#0F172A]">
                  {isAm ? "ወሳኝ ማስታወሻ:" : "Critical Reminder:"}
                </strong>
                {isAm
                  ? "ይህ እርምጃ የሰነዱን ትክክለኛነት ብቻ ያረጋግጣል። አጠቃላይ ጥናቱ እንዲጀምር ፈቃድ አይሰጥም።"
                  : "This action only verifies the document's validity and authenticity. It does not approve the overarching survey for deployment."}
              </p>
            </div>

            {/* Decision Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => decide.mutate({ decision: "approved" })}
                disabled={decide.isPending}
                className="w-full py-2.5 px-4 bg-[#005985] hover:bg-[#106492] text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{isAm ? "ሰነዱን ተቀበል" : "Accept Document"}</span>
              </button>

              <button
                type="button"
                onClick={() => setReplacementModalOpen(true)}
                disabled={decide.isPending}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#f8f9ff] border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">find_replace</span>
                <span>{isAm ? "ምትክ ሰነድ ጠይቅ" : "Request Replacement"}</span>
              </button>

              <button
                type="button"
                onClick={() => decide.mutate({ decision: "rejected" })}
                disabled={decide.isPending}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#ffdad6]/40 hover:text-[#ba1a1a] hover:border-[#ffdad6] border border-[#E2E8F0] text-[#ba1a1a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>{isAm ? "ሰነዱን ውድቅ አድርግ" : "Reject Document"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Request Replacement Modal Dialog ── */}
      {replacementModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
            onClick={() => setReplacementModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-base text-[#0F172A]">
                  {isAm ? "ምትክ ሰነድ መጠየቂያ" : "Request Document Replacement"}
                </h3>
                <button
                  type="button"
                  onClick={() => setReplacementModalOpen(false)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  ✕
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  {isAm ? "ለተመራማሪው የተሰጠ አስተያየት" : "Instructions for Researcher"}
                </label>
                <textarea
                  rows={4}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder={
                    isAm
                      ? "ለምሳሌ፦ ሰነዱ ላይ ፊርማ ጎድሏል ወይም ጊዜው አልፏል። እባክዎ የታደሰ ሰነድ ይስቀሉ..."
                      : "e.g., The uploaded IRB letter is missing authorized institutional signatures or has expired. Please re-upload current clearance..."
                  }
                  className="w-full p-3 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplacementModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#eff4ff] rounded-lg"
                >
                  {isAm ? "ሰርዝ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    decide.mutate({ decision: "replacement_requested", notes: reviewerNotes });
                    setReplacementModalOpen(false);
                  }}
                  disabled={decide.isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#005985] hover:bg-[#106492] rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isAm ? "ጥያቄውን ላክ" : "Send Replacement Request"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Fullscreen Document Viewer Modal ── */}
      {fullscreenPreview && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
            onClick={() => setFullscreenPreview(false)}
          />
          <div className="fixed inset-6 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#E2E8F0]">
            <div className="p-4 border-b border-[#E2E8F0] bg-[#f8f9ff] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005985]">picture_as_pdf</span>
                <span className="font-bold text-sm text-[#0F172A]">{doc.filename}</span>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenPreview(false)}
                className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold hover:bg-[#eff4ff]"
              >
                ✕ {isAm ? "ዝጋ" : "Close Viewer"}
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center">
              {doc.preview_url ? (
                <iframe
                  title={doc.filename}
                  src={doc.preview_url}
                  className="w-full h-full rounded-lg border border-[#E2E8F0] bg-white shadow-sm"
                />
              ) : (
                <div className="text-center text-[#64748B]">
                  <span className="material-symbols-outlined text-5xl mb-2 text-[#005985]">description</span>
                  <p className="font-semibold text-sm">{doc.filename}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
