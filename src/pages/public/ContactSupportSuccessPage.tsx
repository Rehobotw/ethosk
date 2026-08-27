import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function ContactSupportSuccessPage() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isAm = language === "am";

  const ticketId = searchParams.get("ticket") || "#ETH-2938";

  return (
    <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center p-4 md:p-8 font-['Inter',sans-serif] text-[#131b2e] antialiased">
      {/* ── Success Card (Exact Stitch Screen 6e0e7e1e4d274e79902a95c33037a3b6) ── */}
      <main className="w-full max-w-[680px] flex flex-col items-center">
        <div className="w-full bg-white border border-[#c0c7d0] rounded-2xl p-8 md:p-12 flex flex-col items-center text-center shadow-[0_10px_25px_-3px_rgba(0,89,133,0.06),0_4px_6px_-2px_rgba(0,0,0,0.02)]">
          {/* Check Icon */}
          <div className="mb-6 flex items-center justify-center h-20 w-20 rounded-full bg-[#f2f3ff] border border-[#005985]/20 text-[#005985]">
            <span className="material-symbols-outlined text-[44px]">check_circle</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "መልእክትዎ ደርሶናል!" : "Message Received!"}
          </h1>

          {/* Body */}
          <p className="text-sm md:text-base text-[#50616b] max-w-md mx-auto mb-6 leading-relaxed">
            {isAm
              ? "ስለተገናኙን እናመሰግናለን። የድጋፍ ባለሙያ ጥያቄዎን ገምግሞ በ24 ሰዓታት ውስጥ በኢሜይል ምላሽ ይሰጣል።"
              : "Thank you for reaching out. A support specialist will review your request and respond via email within 24 hours."}
          </p>

          {/* Ticket ID Badge */}
          <div className="bg-[#e2e7ff] rounded-lg px-4 py-2 border border-[#c0c7d0]/60 mb-8 flex items-center gap-2">
            <span className="text-xs text-[#50616b] font-semibold uppercase tracking-wider">
              {isAm ? "የትኬት ቁጥር:" : "Ticket ID:"}
            </span>
            <span className="font-mono text-xs text-[#131b2e] font-bold">
              {ticketId.startsWith("#") ? ticketId : `#${ticketId}`}
            </span>
          </div>

          {/* Divider */}
          <hr className="w-full border-t border-[#c0c7d0]/40 mb-6" />

          {/* Next Steps */}
          <p className="text-xs md:text-sm text-[#50616b] mb-8">
            {isAm ? (
              <>
                በዚህ መካከል፣ ፈጣን መልሶችን ለማግኘት{" "}
                <Link to="/help" className="text-[#005985] font-semibold underline hover:text-[#2872a1]">
                  የእውቀት ማዕከላችንን (Knowledge Base)
                </Link>{" "}
                መጎብኘት ይችላሉ።
              </>
            ) : (
              <>
                In the meantime, feel free to browse our{" "}
                <Link to="/help" className="text-[#005985] font-semibold underline hover:text-[#2872a1]">
                  Knowledge Base
                </Link>{" "}
                for quick answers.
              </>
            )}
          </p>

          {/* CTA */}
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs font-bold rounded-lg px-8 py-3.5 hover:opacity-95 transition-opacity shadow-sm"
          >
            {isAm ? "ወደ መነሻ ገጽ ይመለሱ" : "Return to Homepage"}
          </Link>
        </div>
      </main>
    </div>
  );
}
