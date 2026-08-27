import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function PaymentConfirmationPage() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isAm = language === "am";

  const plan = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "annual";
  const isAnnual = billing === "annual";

  const handleDownloadReceipt = () => {
    const receiptContent = `ETHOSK RESEARCH PLATFORM
--------------------------------
PAYMENT CONFIRMATION RECEIPT
Order ID: ETH-CONF-${Math.floor(100000 + Math.random() * 900000)}
Plan: ${plan.toUpperCase()} Plan (${billing.toUpperCase()})
Amount: ${isAnnual ? "4,700 ETB + 15% VAT (5,405.00 ETB)" : "490 ETB + 15% VAT (563.50 ETB)"}
Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
Status: Verified & Activated via verify.et
Payment Method: Telebirr / CBE Birr
--------------------------------
Thank you for using Ethosk!`;

    if (typeof window !== "undefined" && typeof URL.createObjectURL === "function") {
      const blob = new Blob([receiptContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ethosk-subscription-receipt.txt`;
      a.click();
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen font-['Inter',sans-serif] flex items-center justify-center p-4 md:p-8 lg:p-12">
      {/* ── Centered Card Container (Exact Stitch Screen e485b4fa37b9492b8fd347c01420ad67) ── */}
      <div className="max-w-[680px] w-full bg-white border border-[#c0c7d0] rounded-2xl p-6 md:p-10 flex flex-col items-center text-center shadow-[0_10px_25px_-3px_rgba(0,89,133,0.06),0_4px_6px_-2px_rgba(0,0,0,0.02)]">
        {/* Success Header */}
        <div className="mb-4 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#eff4ff] rounded-full flex items-center justify-center mb-4 text-[#005985] shadow-xs">
            <span className="material-symbols-outlined text-[44px]">check_circle</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-2 tracking-tight">
            {isAm ? "ምዝገባዎ ነቅቷል!" : "Subscription Activated!"}
          </h1>

          <div className="text-sm md:text-base text-[#40484f] flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>
              {plan === "pro"
                ? isAm
                  ? "የፕሮፌሽናል እቅድዎ አሁን ንቁ ነው።"
                  : "Your Professional Plan is now active."
                : isAm
                ? "የኢንተርፕራይዝ እቅድዎ አሁን ንቁ ነው።"
                : "Your Enterprise Plan is now active."}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-[#e2e7ff] text-[#131b2e] font-semibold text-xs rounded-md">
              {isAnnual
                ? isAm
                  ? "በየዓመቱ የሚከፈል"
                  : "Billed Annually"
                : isAm
                ? "በየወሩ የሚከፈል"
                : "Billed Monthly"}
            </span>
          </div>
        </div>

        <div className="w-full h-px bg-[#c0c7d0]/40 my-6"></div>

        {/* Feature Highlights */}
        <div className="w-full text-left mb-8">
          <h2 className="text-sm font-bold text-[#131b2e] mb-3 uppercase tracking-wider text-center sm:text-left">
            {isAm ? "በስራ ቦታዎ ላይ ምን አዲስ ነገር አለ" : "What's new in your workspace"}
          </h2>

          <ul className="flex flex-col gap-2.5">
            <li className="flex items-center justify-between p-3.5 bg-[#f2f3ff] border border-[#c0c7d0]/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">check</span>
                <span className="text-xs md:text-sm font-semibold text-[#131b2e]">
                  {isAm ? "ጥሬ መረጃ ወደ ውጭ መላክ (CSV/XLSX)" : "Raw Data Export (CSV/XLSX)"}
                </span>
              </div>
              <span className="bg-[#2872a1] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {isAm ? "ተከፍቷል" : "UNLOCKED"}
              </span>
            </li>

            <li className="flex items-center justify-between p-3.5 bg-white border border-[#c0c7d0]/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">check</span>
                <span className="text-xs md:text-sm text-[#131b2e]">
                  {isAm ? "የላቀ የትንተና ግንዛቤዎች" : "Advanced Insights Analytics"}
                </span>
              </div>
            </li>

            <li className="flex items-center justify-between p-3.5 bg-white border border-[#c0c7d0]/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">check</span>
                <span className="text-xs md:text-sm text-[#131b2e]">
                  {isAm ? "1,000 ምላሾች በየጥናቱ" : "1,000 Responses per Survey"}
                </span>
              </div>
            </li>

            <li className="flex items-center justify-between p-3.5 bg-white border border-[#c0c7d0]/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">check</span>
                <span className="text-xs md:text-sm text-[#131b2e]">
                  {isAm ? "ብጁ የስነ-ህዝብ ማጣሪያዎች" : "Custom Demographic Filters"}
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
          <Link
            to="/researcher"
            className="w-full bg-gradient-to-br from-[#005985] to-[#2872a1] text-white rounded-lg px-6 py-3 text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-sm"
          >
            <span>{isAm ? "ወደ ዳሽቦርድ ቀጥል" : "Continue to Dashboard"}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>

          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#40484f]">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex items-center gap-1 hover:text-[#005985] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>{isAm ? "ደረሰኝ አውርድ" : "Download Receipt"}</span>
            </button>
            <div className="w-1 h-1 rounded-full bg-[#c0c7d0]"></div>
            <Link
              to="/researcher/subscription"
              className="flex items-center gap-1 hover:text-[#005985] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              <span>{isAm ? "የክፍያ ቅንብሮችን ይመልከቱ" : "View Billing Settings"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
