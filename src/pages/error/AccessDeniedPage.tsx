import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function AccessDeniedPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      {/* Top Header */}
      <header className="border-b border-[#c0c7d0]/40 bg-white sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">
            Ethosk
          </Link>
          <Link to="/help" className="text-xs font-semibold text-[#50616b] hover:text-[#005985] transition-colors">
            {isAm ? "እርዳታ" : "Help"}
          </Link>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 pt-12">
        <div className="max-w-[680px] w-full flex flex-col items-center text-center">
          {/* Illustration Container */}
          <div className="w-32 h-32 rounded-full bg-[#e2e7ff] flex items-center justify-center mb-6 relative overflow-hidden shadow-xs">
            <div className="absolute inset-0 bg-[#005985]/5 rounded-full" />
            <span
              className="material-symbols-outlined text-[64px] text-[#005985] relative z-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>

          {/* Typography */}
          <h1 className="text-3xl md:text-5xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "መዳረሻ ተከልክሏል" : "Access Restricted"}
          </h1>
          <p className="text-sm md:text-base text-[#50616b] max-w-md mx-auto mb-8 leading-relaxed">
            {isAm
              ? "ይህንን ገጽ ለማየት ፈቃድ የለዎትም። ይህም የመለያ ደረጃ ገደብ ወይም የፈቃድ ማነስ ምክንያት ሊሆን ይችላል።"
              : "You do not have permission to access this page. This may be due to account tier restrictions or institutional permissions."}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-semibold text-xs md:text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>{isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}</span>
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto bg-white border border-[#c0c7d0] text-[#131b2e] font-semibold text-xs md:text-sm px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              <span>{isAm ? "የድጋፍ ቡድንን ያነጋግሩ" : "Contact Support"}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-[#c0c7d0]/40 max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center px-4 md:px-8 mt-auto gap-4 text-xs text-[#50616b]">
        <div>© {new Date().getFullYear()} Ethosk. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-[#005985] transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-[#005985] transition-colors">
            Terms of Service
          </Link>
          <Link to="/contact" className="hover:text-[#005985] transition-colors">
            Contact Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
