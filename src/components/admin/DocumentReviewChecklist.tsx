import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useLanguage } from "@/lib/language";

export interface ReviewChecklistState {
  relevance: boolean;
  apparent_authenticity: boolean;
  category_alignment: boolean;
  completeness_expiry: boolean;
}

export interface DocumentReviewChecklistProps {
  documentTitle?: string;
  previewUrl?: string | null;
  researchCategory?: string | null;
  isPending?: boolean;
  initialChecklist?: Partial<ReviewChecklistState>;
  onSubmitDecision: (params: {
    decision: "passed" | "failed" | "request_changes";
    checklist: ReviewChecklistState;
    notes?: string;
  }) => void;
}

export function DocumentReviewChecklist({
  documentTitle = "Compliance & Clearance Document",
  previewUrl,
  researchCategory,
  isPending = false,
  initialChecklist,
  onSubmitDecision,
}: DocumentReviewChecklistProps) {
  const { isAm } = useLanguage();

  const [checklist, setChecklist] = useState<ReviewChecklistState>({
    relevance: initialChecklist?.relevance ?? false,
    apparent_authenticity: initialChecklist?.apparent_authenticity ?? false,
    category_alignment: initialChecklist?.category_alignment ?? false,
    completeness_expiry: initialChecklist?.completeness_expiry ?? false,
  });

  const [activeAction, setActiveAction] = useState<"passed" | "failed" | "request_changes" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passedCount = Object.values(checklist).filter(Boolean).length;
  const allPassed = passedCount === 4;

  const toggleItem = (key: keyof ReviewChecklistState) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrorMessage(null);
  };

  const setAll = (val: boolean) => {
    setChecklist({
      relevance: val,
      apparent_authenticity: val,
      category_alignment: val,
      completeness_expiry: val,
    });
    setErrorMessage(null);
  };

  const handleStartAction = (action: "passed" | "failed" | "request_changes") => {
    if (action === "passed" && !allPassed) {
      setErrorMessage(
        isAm
          ? "ለማጽደቅ ሁሉም 4 የሰነድ ማረጋገጫ ነጥቦች መሟላት አለባቸው።"
          : "All 4 document checklist criteria must be verified to approve.",
      );
      return;
    }
    setActiveAction(action);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;

    if ((activeAction === "failed" || activeAction === "request_changes") && !decisionNotes.trim()) {
      setErrorMessage(
        activeAction === "request_changes"
          ? isAm
            ? "እባክዎ የተጠየቁትን ማስተካከያዎች ወይም የጎደሉ ሰነዶችን ይግለጹ።"
            : "Please specify the corrections or additional documents requested."
          : isAm
          ? "እባክዎ ሰነዱ ውድቅ የተደረገበትን ምክንያት ያስገቡ።"
          : "Please provide a reason for rejecting the document.",
      );
      return;
    }

    onSubmitDecision({
      decision: activeAction,
      checklist,
      notes: decisionNotes.trim() || undefined,
    });
  };

  const checklistItems = [
    {
      key: "relevance" as const,
      title: isAm ? "1. ተዛማጅነት (Relevance)" : "1. Relevance",
      description: isAm
        ? "ሰነዱ ከተጠቀሰው የጥናት ርዕስ፣ ተመራማሪ ወይም አመልካች ጋር በቀጥታ የተገናኘ መሆኑን አረጋግጥ።"
        : "The document explicitly pertains to the stated study, investigator, or applicant.",
    },
    {
      key: "apparent_authenticity" as const,
      title: isAm ? "2. ተዓማኒነት (Apparent Authenticity)" : "2. Apparent Authenticity",
      description: isAm
        ? "ሰነዱን የሰጠው ተቋም፣ ማህተም፣ ይፋዊ አርማ ወይም ፊርማ በግልጽ የሚታይ መሆኑን አረጋግጥ።"
        : "Issuing body, institutional letterhead, official seal, or verifiable signatory is identifiable.",
    },
    {
      key: "category_alignment" as const,
      title: isAm ? "3. የጥናት ዘርፍ ተስማሚነት (Category Alignment)" : "3. Study-Category Alignment",
      description: isAm
        ? `የሰነዱ ዓይነት ለተመረጠው የጥናት ዘርፍ (${researchCategory ? researchCategory.replace(/_/g, " ") : "የተገለጸው ዘርፍ"}) የሚያስፈልገውን ያሟላል (ለምሳሌ የሥነ-ምግባር ቦርድ/ሚኒስቴር ፈቃድ)።`
        : `The document matches regulatory requirements for the declared research category${
            researchCategory ? ` (${researchCategory.replace(/_/g, " ")})` : ""
          } (e.g. IRB/ethics approval, Ministry clearance).`,
    },
    {
      key: "completeness_expiry" as const,
      title: isAm ? "4. ሙሉነት እና ህጋዊ ጊዜ (Completeness & Validity)" : "4. Completeness & Expiry",
      description: isAm
        ? "ሰነዱ ሙሉ ገጾች ያሉት እና ህጋዊ ጊዜው ያላለፈበት (ያልተቃጠለ) መሆኑን አረጋግጥ።"
        : "Document is complete with all pages/clauses attached and, where applicable, not expired.",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#E1E8EE]">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[#00456d] text-lg">
              fact_check
            </span>
            <h4 className="font-headline-md text-sm font-bold text-[#0D253A]">
              {isAm ? "የሰነድ ማረጋገጫ 4-ነጥብ ዝርዝር (v4 §7.4 §5)" : "4-Point Document Review Checklist (v4 §7.4, §5)"}
            </h4>
          </div>
          <p className="text-[11px] text-[#5A6E7F] mt-0.5">
            {isAm
              ? "ውሳኔ ከመስጠትዎ በፊት እያንዳንዱን መስፈርት ይገምግሙ።"
              : "Reviewers must assess all 4 points per document before submitting a review decision."}
          </p>
        </div>

        {/* Score & Quick Toggles */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
              allPassed
                ? "bg-emerald-100 text-emerald-800"
                : passedCount > 0
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xs">
              {allPassed ? "verified" : "checklist"}
            </span>
            <span>
              {passedCount}/4 {isAm ? "ተረጋግጠዋል" : "Verified"}
            </span>
          </span>

          <div className="flex items-center gap-1">
            <button
              className="text-[11px] font-bold text-[#00456d] hover:underline px-1.5 py-0.5 cursor-pointer"
              onClick={() => setAll(true)}
              type="button"
            >
              {isAm ? "ሁሉንም ምረጥ" : "Check All"}
            </button>
            <span className="text-[#c1c7d0]">|</span>
            <button
              className="text-[11px] font-bold text-[#5A6E7F] hover:underline px-1.5 py-0.5 cursor-pointer"
              onClick={() => setAll(false)}
              type="button"
            >
              {isAm ? "አጽዳ" : "Clear"}
            </button>
          </div>
        </div>
      </div>

      {/* 4-Point Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checklistItems.map((item) => {
          const isChecked = checklist[item.key];
          return (
            <div
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                isChecked
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 shadow-xs"
                  : "bg-[#f8f9fa] border-[#E1E8EE] text-[#0D253A] hover:border-[#c1c7d0]"
              }`}
              key={item.key}
              onClick={() => toggleItem(item.key)}
            >
              <div className="pt-0.5">
                <input
                  aria-label={item.title}
                  checked={isChecked}
                  className="w-4 h-4 text-emerald-600 rounded border-[#c1c7d0] focus:ring-emerald-500 cursor-pointer"
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleItem(item.key);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  type="checkbox"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold">{item.title}</span>
                  {isChecked ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      Pass
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5A6E7F] mt-1 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
          {errorMessage}
        </div>
      )}

      {/* Action Form / Decision Area */}
      {activeAction ? (
        <form className="mt-4 pt-3 border-t border-[#E1E8EE] space-y-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-[#0D253A]">
              {activeAction === "passed" && (isAm ? "ማጽደቅን አረጋግጥ" : "Confirm Approval")}
              {activeAction === "request_changes" && (isAm ? "ማስተካከያ / ተጨማሪ ሰነዶች ጠይቅ" : "Request Documents / Correction")}
              {activeAction === "failed" && (isAm ? "ሰነዱን ውድቅ አድርግ" : "Reject Document & Submission")}
            </h5>
            <button
              className="text-[11px] text-[#5A6E7F] hover:underline cursor-pointer"
              onClick={() => {
                setActiveAction(null);
                setDecisionNotes("");
                setErrorMessage(null);
              }}
              type="button"
            >
              {isAm ? "ሰርዝ" : "Cancel"}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0D253A] mb-1">
              {activeAction === "passed"
                ? isAm
                  ? "የግምገማ ማስታወሻ (አማራጭ)"
                  : "Approval Audit Notes (Optional)"
                : activeAction === "request_changes"
                ? isAm
                  ? "የተጠየቁ ማስተካከያዎች ወይም የጎደሉ ሰነዶች *"
                  : "Requested Corrections / Missing Items *"
                : isAm
                ? "ውድቅ የተደረገበት ምክንያት *"
                : "Rejection Reason *"}
            </label>
            <textarea
              className="w-full bg-[#f8f9fa] border border-[#E1E8EE] rounded-lg p-2 text-xs text-[#0D253A] focus:outline-none focus:border-[#00456d]"
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder={
                activeAction === "passed"
                  ? "e.g. All institutional clearance checks verified and approved."
                  : activeAction === "request_changes"
                  ? "e.g. Please provide page 2 of the IRB clearance letter showing the expiration date."
                  : "e.g. Institutional letterhead is missing and document does not match declared health category."
              }
              required={activeAction !== "passed"}
              rows={2}
              value={decisionNotes}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#5A6E7F] hover:bg-[#f0f4f8] transition-colors cursor-pointer"
              onClick={() => {
                setActiveAction(null);
                setDecisionNotes("");
                setErrorMessage(null);
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${
                activeAction === "passed"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : activeAction === "request_changes"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Submitting…"
                : activeAction === "passed"
                ? "Submit Approval"
                : activeAction === "request_changes"
                ? "Send Correction Request"
                : "Confirm Rejection"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#E1E8EE]">
          <button
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              allPassed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            disabled={!allPassed}
            onClick={() => handleStartAction("passed")}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xs">
              check
            </span>
            <span>{isAm ? "አጽድቅ (Approve)" : "Approve"}</span>
          </button>

          <button
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            onClick={() => handleStartAction("request_changes")}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xs">
              edit_note
            </span>
            <span>{isAm ? "ማስተካከያ ጠይቅ" : "Request Correction"}</span>
          </button>

          <button
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            onClick={() => handleStartAction("failed")}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xs">
              close
            </span>
            <span>{isAm ? "ውድቅ አድርግ" : "Reject"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
