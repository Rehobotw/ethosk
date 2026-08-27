import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

interface LocationState {
  surveyTitle?: string;
  adminName?: string;
  timestamp?: string;
  reason?: string;
  notes?: string;
}

export function SurveyRejectedSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isAm = language === "am";

  const state = (location.state as LocationState) || {};
  const surveyTitle = state.surveyTitle || "Impact of Urban Noise on Sleep Quality";
  const adminName = state.adminName || "Abebe Admin";
  const reason = state.reason || "Ethical Non-Compliance";
  const notes =
    state.notes ||
    "The participant consent forms provided do not meet the minimum requirements for vulnerable population studies.";
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
      {/* ── Rejection Success Card (Exact Stitch Screen 58fb5b31bd934972be6f74522fc7f841) ── */}
      <div className="max-w-2xl w-full flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 w-full max-w-lg">
          <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center mb-5 ring-8 ring-[#ffdad6]/40">
            <span
              className="material-symbols-outlined text-[#ba1a1a] text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cancel
            </span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight mb-2">
            {isAm ? "ጥናቱ ውድቅ ተደርጓል" : "Survey Successfully Rejected"}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            {isAm
              ? "የጥናቱ ሁኔታ ወደ ውድቅ ተቀይሯል እና ለተመራማሪው ከተሰጠው ማብራሪያ ጋር ማሳወቂያ ተልኳል።"
              : "The survey status has been updated to Rejected and the researcher has been notified with the provided explanation."}
          </p>
        </div>

        {/* Survey Summary Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl w-full mb-6 overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#f8f9ff] flex justify-between items-center text-xs">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              {isAm ? "የጥናት ማጠቃለያ" : "Survey Summary"}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-[#ffdad6] text-[#ba1a1a] font-bold border border-[#ffdad6]">
              {isAm ? "ውድቅ ተደርጓል" : "Rejected"}
            </span>
          </div>

          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div className="md:col-span-2">
                <dt className="text-[11px] font-bold text-[#64748B] uppercase mb-0.5 tracking-wider">
                  {isAm ? "የጥናቱ ስም" : "Survey Name"}
                </dt>
                <dd className="font-bold text-sm text-[#0F172A]">{surveyTitle}</dd>
              </div>

              <div>
                <dt className="text-[11px] font-bold text-[#64748B] uppercase mb-0.5 tracking-wider">
                  {isAm ? "የተፈጸመበት ሰዓት" : "Timestamp"}
                </dt>
                <dd className="font-medium text-xs text-[#0F172A]">{timestamp}</dd>
              </div>

              <div>
                <dt className="text-[11px] font-bold text-[#64748B] uppercase mb-0.5 tracking-wider">
                  {isAm ? "ገምጋሚ" : "Reviewer"}
                </dt>
                <dd className="font-semibold text-xs text-[#0F172A] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[10px] font-bold text-[#005985]">
                    {initials}
                  </span>
                  {adminName}
                </dd>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-[#E2E8F0]">
                <dt className="text-[11px] font-bold text-[#64748B] uppercase mb-0.5 tracking-wider">
                  {isAm ? "ዋና ምክንያት" : "Primary Reason"}
                </dt>
                <dd className="font-semibold text-xs text-[#0F172A]">{reason}</dd>
              </div>

              <div className="md:col-span-2 bg-[#f8f9ff] border border-[#E2E8F0] p-3.5 rounded-lg">
                <dt className="text-[11px] font-bold text-[#64748B] uppercase mb-1 tracking-wider">
                  {isAm ? "የገምጋሚ ማስታወሻ" : "Reviewer Notes"}
                </dt>
                <dd className="text-xs text-[#50616b] leading-relaxed italic">"{notes}"</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
          <Link
            to={`/admin/survey-approvals/${id || "srv-urban-noise"}`}
            className="flex-1 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#f8f9ff] transition-colors flex items-center justify-center gap-2 text-center"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>{isAm ? "የጥናቱን ታሪክ እይ" : "View Survey History"}</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate("/admin/survey-approvals")}
            className="flex-1 bg-[#005985] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#106492] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">queue_play_next</span>
            <span>{isAm ? "ወደ ወረፋው ተመለስ" : "Return to Queue"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
