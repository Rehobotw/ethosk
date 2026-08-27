import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function ServerErrorPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-[680px] w-full bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 text-center shadow-xs">
          <div className="mb-6 flex justify-center">
            <span
              className="material-symbols-outlined text-[#ba1a1a] text-[64px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ችግር አጋጥሟል" : "Something went wrong"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-[480px] mx-auto leading-relaxed">
            {isAm
              ? "በሰርቨራችን ላይ ያልተጠበቀ ስህተት አጋጥሟል። ችግሩን እያስተካከልን ባለበት ወቅት እባክዎ እንደገና ይሞክሩ ወይም ወደ ዋናው ገጽ ይመለሱ።"
              : "We encountered an unexpected error on our server. Please try again or return to a safe page while we work on fixing this."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-semibold text-xs md:text-sm px-6 py-3 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>{isAm ? "እንደገና ሞክር" : "Retry"}</span>
            </button>
            <Link
              to="/"
              className="bg-white border border-[#c0c7d0] text-[#131b2e] font-semibold text-xs md:text-sm px-6 py-3 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
            >
              <span>{isAm ? "ወደ ዋናው ገጽ ተመለስ" : "Return to Homepage"}</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[#c0c7d0]/40">
            <p className="font-mono text-xs text-[#50616b] flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">bug_report</span>
              <span>Error Code: 500 INTERNAL_SERVER_ERROR</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto text-xs text-[#50616b] gap-4">
          <div className="font-bold text-[#005985]">Ethosk</div>
          <div className="flex gap-6">
            <Link to="/contact" className="hover:text-[#005985] transition-colors">
              Support
            </Link>
            <Link to="/privacy" className="hover:text-[#005985] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#005985] transition-colors">
              Terms of Service
            </Link>
          </div>
          <div>© {new Date().getFullYear()} Ethosk Platform. Professional Data Rigor.</div>
        </div>
      </footer>
    </div>
  );
}
