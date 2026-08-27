import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function SurveyCompletionSuccessDesktopPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased relative">
      {/* ── Top Header ── */}
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">
            Ethosk
          </Link>
          <Link to="/wallet" className="text-xs font-semibold text-[#005985] hover:underline">
            {isAm ? "ዋሌት" : "Wallet"}
          </Link>
        </div>
      </header>

      {/* ── Main Desktop Splash Canvas ── */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 py-12 relative overflow-hidden">
        {/* Subtle radial background glows */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#8fcdff]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#dae2fd]/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-white w-full max-w-[680px] rounded-2xl border border-[#c0c7d0]/60 shadow-xs p-6 md:p-10 relative overflow-hidden text-center z-10">
          {/* Top Decorative Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#005985] to-[#cbe6ff]" />

          {/* Success Checkmark */}
          <div className="w-20 h-20 rounded-full bg-[#eff4ff] flex items-center justify-center mx-auto mb-6 text-[#005985]">
            <span
              className="material-symbols-outlined text-[48px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ጥናቱ በተሳካ ሁኔታ ተጠናቋል" : "Survey Completed Successfully"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-[80%] mx-auto leading-relaxed">
            {isAm
              ? "ለ'ከፍተኛ ቦታዎች የሰብል ምርት ስርዓት' ጥናት ላበረከቱት አስተያየት እናመሰግናለን።"
              : "Thank you for contributing your insights to the 'Highland Crop Yield Patterns' study."}
          </p>

          {/* Data Grid */}
          <div className="w-full bg-[#faf8ff] border border-[#c0c7d0]/60 rounded-xl p-5 mb-6 text-left grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#50616b] uppercase tracking-wider">
                {isAm ? "የተጠናቀቀበት ቀን" : "Completion Date"}
              </span>
              <span className="text-xs md:text-sm font-bold text-[#131b2e]">Oct 24, 2023</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#50616b] uppercase tracking-wider">
                {isAm ? "የተገኘ ክፍያ" : "Reward Earned"}
              </span>
              <span className="text-sm md:text-base font-bold text-[#005985]">50 ETB</span>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2 pt-2 border-t border-[#c0c7d0]/40">
              <span className="text-[11px] font-bold text-[#50616b] uppercase tracking-wider">
                {isAm ? "የክፍያ ሁኔታ" : "Reward Status"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded bg-[#eaedff] px-2.5 py-1 text-[11px] font-bold text-[#005985]">
                  <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                  <span>{isAm ? "በሂደት ላይ" : "Processing"}</span>
                </span>
                <span className="text-[11px] text-[#50616b]">
                  {isAm ? "(በ24 ሰዓት ውስጥ ወደ ዋሌት ገቢ ይደረጋል)" : "(Transferred to Wallet in 24h)"}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps Box */}
          <div className="w-full flex items-start gap-3 bg-[#eff4ff] border border-[#c0c7d0]/40 rounded-xl p-4 mb-8 text-left">
            <span className="material-symbols-outlined text-[#005985] text-xl shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs text-[#50616b] leading-relaxed">
              {isAm
                ? "ውጤቶችዎ አሁን በተመራማሪው እየተረጋገጡ ነው። አንዴ ከጸደቀ፣ ክፍያዎ ተጠናቆ ወደ አጠቃላይ ሂሳብዎ ይደመራል።"
                : "Your results are now being verified by the researcher. Once approved, your reward will be finalized and added to your total balance."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row w-full gap-3 justify-center items-center">
            <Link
              to="/wallet"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-bold text-xs md:text-sm px-6 py-3 rounded-lg shadow-xs hover:opacity-95 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>{isAm ? "ገቢዎችን ይመልከቱ" : "View Earnings"}</span>
            </Link>

            <Link
              to="/inbox"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-bold text-xs md:text-sm px-6 py-3 rounded-lg shadow-xs hover:opacity-95 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{isAm ? "ተጨማሪ ጥናቶችን ይመልከቱ" : "Browse More Surveys"}</span>
            </Link>
          </div>

          <div className="mt-5">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-[#50616b] hover:text-[#005985] transition-colors underline underline-offset-4"
            >
              {isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
