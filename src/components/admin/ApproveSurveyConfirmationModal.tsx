import { useLanguage } from "@/lib/language";

export interface ApproveSurveyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  survey: {
    id: string;
    title: string;
    researcher_name: string;
    research_category: string;
    current_status?: string;
    document_status?: "Accepted" | "Pending" | "Missing";
  };
}

export function ApproveSurveyConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
  survey,
}: ApproveSurveyConfirmationModalProps) {
  const { language } = useLanguage();
  const isAm = language === "am";

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Dark Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card (Exact Stitch Screen 66601c7feee045ab92e08a138b891f2e) */}
      <div className="relative bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-[560px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 font-['Inter',sans-serif] text-[#0F172A]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#f8f9ff]">
          <h2 className="font-headline font-bold text-lg text-[#0F172A]" id="modal-title">
            {isAm ? "ጥናቱን አጽድቅ" : "Approve Survey"}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors rounded-lg p-1 hover:bg-[#E2E8F0] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Warning / Confirmation Message Box */}
          <div className="flex gap-3 bg-[#eff4ff] p-4 rounded-lg border border-[#cbe6ff]">
            <span
              className="material-symbols-outlined text-[#005985] text-[20px] shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              info
            </span>
            <p className="text-xs sm:text-sm text-[#40484f] leading-relaxed">
              {isAm
                ? "እርግጠኛ ነዎት ይህንን ጥናት ማጽደቅ ይፈልጋሉ? አንዴ ከጸደቀ በኋላ ጥናቱ ለተሳታፊዎች ወዲያውኑ ክፍት ይሆናል።"
                : "Are you sure you want to approve this survey? Once approved, it will be immediately available for respondents to participate."}
            </p>
          </div>

          {/* Survey Details for Confirmation */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[11px] font-bold text-[#50616b] uppercase tracking-wider">
              {isAm ? "ለማረጋገጫ የቀረቡ የጥናት ዝርዝሮች" : "Survey Details for Confirmation"}
            </h3>

            <div className="bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div className="col-span-1 md:col-span-2">
                <span className="block text-[11px] text-[#64748B] mb-0.5 uppercase tracking-wider">
                  {isAm ? "የጥናቱ ርዕስ" : "Survey Title"}
                </span>
                <span className="font-bold text-sm text-[#0F172A]">{survey.title}</span>
              </div>

              <div>
                <span className="block text-[11px] text-[#64748B] mb-0.5 uppercase tracking-wider">
                  {isAm ? "ተመራማሪ" : "Researcher"}
                </span>
                <span className="font-semibold text-[#0F172A]">{survey.researcher_name}</span>
              </div>

              <div>
                <span className="block text-[11px] text-[#64748B] mb-0.5 uppercase tracking-wider">
                  {isAm ? "የምርምር ዘርፍ" : "Research Category"}
                </span>
                <span className="font-semibold text-[#0F172A]">{survey.research_category}</span>
              </div>

              <div>
                <span className="block text-[11px] text-[#64748B] mb-0.5 uppercase tracking-wider">
                  {isAm ? "የአሁኑ የግምገማ ሁኔታ" : "Current Review Status"}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#d3e4fe] text-[#005985] text-[11px] font-bold border border-[#c0c7d0]">
                  {survey.current_status || (isAm ? "ግምገማ ይጠብቃል" : "Pending Review")}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-[#64748B] mb-0.5 uppercase tracking-wider">
                  {isAm ? "የማረጋገጫ ሰነድ ሁኔታ" : "Approval Document Status"}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] text-[11px] font-bold border border-[#bbf7d0]">
                  <span
                    className="material-symbols-outlined text-[14px] mr-1"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  {survey.document_status || (isAm ? "ተቀባይነት አግኝቷል" : "Accepted")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Actions) */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#f8f9ff] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-xs font-semibold hover:bg-[#eff4ff] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAm ? "ሰርዝ" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[#005985] text-white text-xs font-bold hover:bg-[#106492] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>{isAm ? "ጥናቱን አጽድቅ" : "Approve Survey"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
