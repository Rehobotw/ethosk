import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function NotFoundPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-16 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#cbe6ff]/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#d0e2ee]/40 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="max-w-[680px] w-full flex flex-col items-center text-center space-y-6 relative z-10">
          {/* Icon Container */}
          <div className="w-24 h-24 rounded-2xl bg-[#e2e7ff] border border-[#c0c7d0]/60 flex items-center justify-center mb-2 shadow-sm">
            <span
              className="material-symbols-outlined text-[48px] text-[#005985]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              broken_image
            </span>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold text-[#131b2e] tracking-tight">
              {isAm ? "404 - ገጹ አልተገኘም" : "404 - Page Not Found"}
            </h1>
            <p className="text-sm md:text-base text-[#50616b] max-w-[540px] mx-auto leading-relaxed">
              {isAm
                ? "እየፈለጉት ያለው ገጽ ተሰርዞ፣ ስሙ ተቀይሮ ወይም በጊዜያዊነት የማይገኝ ሊሆን ይችላል።"
                : "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
            <Link
              to="/"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-semibold text-xs md:text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 shadow-xs w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>{isAm ? "ወደ ዋናው ገጽ ተመለስ" : "Back to Homepage"}</span>
            </Link>
            <Link
              to="/dashboard"
              className="bg-white text-[#131b2e] border border-[#c0c7d0] font-semibold text-xs md:text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>{isAm ? "ወደ ዳሽቦርድ ሂድ" : "Go to Dashboard"}</span>
            </Link>
          </div>

          {/* Support Link */}
          <div className="pt-8 border-t border-[#c0c7d0]/40 w-full mt-6">
            <p className="text-xs md:text-sm text-[#50616b]">
              {isAm ? "እርዳታ ይፈልጋሉ? " : "Need help? "}
              <Link to="/contact" className="text-[#005985] font-semibold hover:underline">
                {isAm ? "ድጋፍ ያግኙ" : "Contact Support"}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
