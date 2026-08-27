import { useState } from "react";
import { useLanguage } from "@/lib/language";

export interface RejectSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; explanation: string }) => void;
  isPending?: boolean;
  survey: {
    id: string;
    title: string;
    researcher_name: string;
  };
}

export function RejectSurveyModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
  survey,
}: RejectSurveyModalProps) {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !explanation.trim()) return;
    onConfirm({ reason, explanation: explanation.trim() });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Dark Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container (Exact Stitch Screen 5fb2ab1086804ebabbd6cb0fb368a540) */}
      <div className="relative z-50 w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-['Inter',sans-serif] text-[#0F172A]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <h2
            className="font-headline font-bold text-lg text-[#0F172A] flex items-center gap-2"
            id="reject-modal-title"
          >
            <span
              className="material-symbols-outlined text-[#ba1a1a] text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <span>{isAm ? "ጥናቱን ውድቅ አድርግ" : "Reject Survey"}</span>
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors rounded-full p-1 hover:bg-[#E2E8F0] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
          {/* Warning Alert */}
          <div className="bg-[#ffdad6]/30 border border-[#ffdad6] rounded-lg p-3.5 flex gap-3 items-start">
            <span
              className="material-symbols-outlined text-[#93000a] text-[20px] mt-0.5 shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              info
            </span>
            <p className="text-xs text-[#93000a] leading-relaxed">
              {isAm
                ? "ይህ እርምጃ ቋሚ ሲሆን ለተመራማሪው ጥናታቸው ውድቅ መደረጉን ያሳውቃል።"
                : "This action is permanent and will notify the researcher that their study has been rejected."}
            </p>
          </div>

          {/* Survey Summary */}
          <div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              {isAm ? "ዒላማ ጥናት" : "Target Survey"}
            </p>
            <div className="bg-[#f8f9ff] border border-[#E2E8F0] rounded-lg p-3 text-xs">
              <p className="font-semibold text-[#0F172A] mb-0.5">'{survey.title}'</p>
              <p className="text-[#64748B]">
                {isAm ? "በ" : "by"} {survey.researcher_name}
              </p>
            </div>
          </div>

          {/* Rejection Reason Dropdown */}
          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              {isAm ? "የውድቅ ምክንያት" : "Rejection Reason"} <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <select
                id="rejection-reason"
                name="rejection-reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="appearance-none w-full bg-white border border-[#E2E8F0] rounded-lg py-2.5 pl-3 pr-10 text-xs text-[#0F172A] focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] transition-colors cursor-pointer"
              >
                <option disabled value="">
                  {isAm ? "ምክንያት ይምረጡ..." : "Select a reason..."}
                </option>
                <option value="Violation of Terms of Service">
                  {isAm ? "የአገልግሎት ውል መጣስ" : "Violation of Terms of Service"}
                </option>
                <option value="Ethical Non-Compliance">
                  {isAm ? "የስነምግባር ደንብ አለማሟላት" : "Ethical Non-Compliance"}
                </option>
                <option value="Fraudulent Content">
                  {isAm ? "አሳሳች ይዘት" : "Fraudulent Content"}
                </option>
                <option value="Poor Research Quality">
                  {isAm ? "ዝቅተኛ የጥናት ጥራት" : "Poor Research Quality"}
                </option>
                <option value="Other">{isAm ? "ሌላ" : "Other"}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#64748B]">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* Additional Explanation Textarea */}
          <div>
            <label
              htmlFor="rejection-explanation"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              {isAm ? "ተጨማሪ ማብራሪያ" : "Additional Explanation"} <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              id="rejection-explanation"
              name="rejection-explanation"
              required
              rows={4}
              maxLength={500}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={
                isAm
                  ? "ተመራማሪው እንዲረዱት ይህ ጥናት ለምን ውድቅ እንደተደረገ ዝርዝር ማስታወሻዎችን እዚህ ያቅርቡ..."
                  : "Provide detailed notes on why this survey is being rejected to help the researcher understand..."
              }
              className="w-full bg-white border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] transition-colors resize-y min-h-[100px]"
            />
            <p className="text-[11px] text-[#64748B] mt-1 text-right">{explanation.length}/500</p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-[#f8f9ff] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAm ? "ሰርዝ" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isPending || !reason || !explanation.trim()}
              className="px-4 py-2 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:bg-[#93000a] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isAm ? "ጥናቱን ውድቅ አድርግ" : "Reject Survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
