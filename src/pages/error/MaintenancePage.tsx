import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function MaintenancePage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased relative">
      {/* Top Header */}
      <header className="border-b border-[#c0c7d0]/40 bg-white sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">
            Ethosk
          </Link>
        </div>
      </header>

      {/* Main Canvas with Grid Pattern */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #005985 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-[680px] w-full bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center relative z-10 shadow-xs">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-[#eff4ff] flex items-center justify-center mb-6 text-[#005985]">
            <span
              className="material-symbols-outlined text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              engineering
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ኢቶስክ በጊዜያዊነት አይገኝም" : "Ethosk is temporarily unavailable"}
          </h1>

          {/* Subheadline */}
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-[500px] leading-relaxed">
            {isAm
              ? "መድረካችንን ለማሻሻል የታቀደ የጥገና ስራ እያከናወንን ነው። በቅርቡ ተመልሰን እንደምንጀምር እንጠብቃለን። በትግስትዎ እናመሰግናለን።"
              : "We're currently performing scheduled maintenance to improve our platform. We expect to be back online shortly. Thank you for your patience."}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRetry}
              className="px-6 py-3 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white rounded-lg font-semibold text-xs md:text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              <span>{isAm ? "እንደገና ሞክር" : "Retry"}</span>
            </button>
            <Link
              to="/"
              className="px-6 py-3 bg-white border border-[#c0c7d0] text-[#131b2e] rounded-lg font-semibold text-xs md:text-sm hover:border-[#005985] hover:text-[#005985] transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>{isAm ? "ወደ ዋናው ገጽ ተመለስ" : "Return Home"}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk. All rights reserved.</div>
          <nav className="flex gap-6">
            <Link to="/contact" className="hover:text-[#005985] transition-colors">
              Support
            </Link>
            <Link to="/privacy" className="hover:text-[#005985] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#005985] transition-colors">
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
