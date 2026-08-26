import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

interface LocationState {
  surveyTitle?: string;
  adminName?: string;
  timestamp?: string;
}

export function SurveyApprovedSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isAm = language === "am";

  const state = (location.state as LocationState) || {};
  const surveyTitle = state.surveyTitle || "Impact of Urban Noise on Sleep Quality";
  const adminName = state.adminName || "Abebe Admin";
  const timestamp = state.timestamp || new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  });

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AA";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] flex items-center justify-center min-h-[calc(100vh-140px)] font-['Inter',sans-serif] text-[#0F172A]">
      {/* ── Success Card (Exact Stitch Screen bbc2fa584f964f43b5d7b152f094e065) ── */}
      <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-2xl p-8 md:p-12 flex flex-col items-center text-center shadow-xs">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-[#eff4ff] flex items-center justify-center mb-6 border border-[#cbe6ff]">
          <span
            className="material-symbols-outlined text-[#005985] text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight mb-2">
          {isAm ? "ጥናቱ በተሳካ ሁኔታ ጸድቋል" : "Survey Successfully Approved"}
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] mb-8 max-w-lg leading-relaxed">
          {isAm
            ? "ጥናቱ ተረጋግጦ ከግምገማ ወረፋ ወጥቷል። አሁን ንቁ ሆኖ ለተሳታፊዎች ዝግጁ ነው።"
            : "The survey has been verified and moved out of the approval queue. It is now active and ready for deployment."}
        </p>

        {/* Data Details Box */}
        <div className="w-full bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl p-6 mb-8 text-left grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-xs">
          <div className="col-span-1 md:col-span-2">
            <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              {isAm ? "የጥናቱ ስም" : "Survey Name"}
            </span>
            <span className="block font-semibold text-sm text-[#0F172A]">
              {surveyTitle}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              {isAm ? "ሁኔታ" : "Status"}
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#cbe6ff] text-[#001e30] font-bold text-xs border border-[#8fcdff]">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              {isAm ? "ጸድቋል" : "Approved"}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              {isAm ? "የጸደቀበት ሰዓት" : "Timestamp"}
            </span>
            <span className="block font-medium text-xs text-[#0F172A]">{timestamp}</span>
          </div>

          <div className="col-span-1 md:col-span-2 border-t border-[#E2E8F0] pt-4 mt-1">
            <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              {isAm ? "ያጸደቀው አስተዳዳሪ" : "Approved By"}
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#d0e2ee] text-[#54656f] flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <span className="font-semibold text-xs text-[#0F172A]">{adminName}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
          <button
            type="button"
            onClick={() => navigate("/admin/survey-approvals")}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#005985] text-white rounded-lg text-xs font-bold hover:bg-[#106492] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{isAm ? "ወደ ግምገማ ወረፋ ተመለስ" : "Return to Review Queue"}</span>
          </button>
          <Link
            to={`/admin/survey-approvals/${id || "srv-urban-noise"}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-white text-[#0F172A] border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#f8f9ff] transition-colors text-center"
          >
            {isAm ? "የጥናቱን ዝርዝር እይ" : "View Survey Details"}
          </Link>
        </div>
      </div>
    </div>
  );
}
