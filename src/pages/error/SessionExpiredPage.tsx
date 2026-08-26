import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function SessionExpiredPage() {
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
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#cbe6ff]/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#d3e5f1]/40 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-[680px] w-full flex flex-col items-center text-center z-10">
          {/* Icon */}
          <div className="w-24 h-24 rounded-full bg-[#cbe6ff] flex items-center justify-center mb-6 shadow-xs border border-[#8fcdff]/50">
            <span
              className="material-symbols-outlined text-[#005985] text-[48px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              schedule
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold text-[#131b2e] mb-4 tracking-tight">
            {isAm ? "ክፍለ-ጊዜው አልፎበታል" : "Session Expired"}
          </h1>

          {/* Explanation */}
          <p className="text-sm md:text-base text-[#50616b] max-w-[500px] mb-8 leading-relaxed">
            {isAm
              ? "ለደህንነትዎ ሲባል ባልተንቀሳቀሱበት ምክንያት ክፍለ-ጊዜዎ ተቋርጧል። ስራዎን ለመቀጠል እባክዎ እንደገና ይግቡ። ሂደቶችዎ በደህንነት ተቀምጠዋል።"
              : "For your security, your session has timed out due to inactivity, or you need to log in to access this page. Please log in again to continue your work. We've saved your progress securely."}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/login"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-semibold text-xs md:text-sm px-6 py-3 rounded-lg hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group shadow-xs"
            >
              <span>{isAm ? "እንደገና ግባ" : "Log In Again"}</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
            <Link
              to="/"
              className="bg-white border border-[#c0c7d0] text-[#131b2e] font-semibold text-xs md:text-sm px-6 py-3 rounded-lg hover:border-[#005985] hover:text-[#005985] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>{isAm ? "ወደ ዋናው ገጽ ተመለስ" : "Return to Homepage"}</span>
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
