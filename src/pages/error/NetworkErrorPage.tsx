import { useLanguage } from "@/lib/language";

export function NetworkErrorPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-[480px] w-full bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#eff4ff] flex items-center justify-center mx-auto mb-4 text-[#005985]">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              wifi_off
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#131b2e] mb-2 tracking-tight">
            {isAm ? "የግንኙነት ችግር" : "Connection Problem"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-6 leading-relaxed">
            {isAm
              ? "ከሰርቨሮቻችን ጋር ለመገናኘት ችግር ያለ ይመስላል። እባክዎ የበይነመረብ ግንኙነትዎን ይፈትሹ እና እንደገና ይሞክሩ።"
              : "It looks like you're having trouble connecting to our servers. Please check your internet connection and try again."}
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-semibold text-xs md:text-sm hover:opacity-95 transition-opacity shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>{isAm ? "እንደገና ሞክር" : "Retry"}</span>
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full py-3 px-4 rounded-lg bg-white border border-[#c0c7d0] text-[#131b2e] font-semibold text-xs md:text-sm hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{isAm ? "ወደ ቀደመው ገጽ ተመለስ" : "Return to Previous Page"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
