import { useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function SubscriptionCheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isAm = language === "am";

  const plan = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "annual";
  const isAnnual = billing === "annual";
  const amount = isAnnual ? "$39.00 USD" : "$49.00 USD";

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleDownloadReceipt = () => {
    const receiptContent = `ETHOSK RESEARCH PLATFORM
--------------------------------
SUBSCRIPTION RECEIPT
Order ID: ETH-8942-XJ
Plan: ${plan.toUpperCase()} Plan (${billing})
Amount: ${amount}
Date: ${todayStr}
Status: Completed / Paid
Payment: Card / Telebirr / CBE Birr
--------------------------------
Thank you for using Ethosk!`;

    if (typeof window !== "undefined" && typeof URL.createObjectURL === "function") {
      const blob = new Blob([receiptContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ethosk-receipt-ETH-8942-XJ.txt`;
      a.click();
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen font-['Inter',sans-serif] antialiased relative overflow-hidden flex flex-col justify-center items-center p-4 md:p-8">
      {/* Ambient Background Effects (Exact Stitch Spec) */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#f2f3ff] to-transparent pointer-events-none"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#cbe6ff] opacity-30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#d3e5f1] opacity-20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-[680px] mx-auto py-12">
        <div className="bg-white border border-[#c0c7d0] rounded-2xl shadow-[0_10px_25px_-3px_rgba(0,89,133,0.08),0_4px_6px_-2px_rgba(0,0,0,0.02)] p-6 md:p-10 flex flex-col items-center text-center">
          {/* Success Icon Animation Container */}
          <div className="mb-6 relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30"></div>
            <div className="relative w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px]">check_circle</span>
            </div>
          </div>

          {/* Header Text */}
          <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-2 tracking-tight">
            {isAm ? "ክፍያው በተሳካ ሁኔታ ተጠናቋል!" : "Payment Successful!"}
          </h1>
          <p className="text-sm md:text-base text-[#40484f] max-w-md mx-auto mb-8">
            {isAm
              ? "የፕሮፌሽናል እቅድዎ አሁን ንቁ ነው። ደረሰኝ ወደ ኢሜይልዎ ተልኳል።"
              : "Your Professional Plan is now active. A receipt has been sent to your email."}
          </p>

          {/* Transaction Details Card */}
          <div className="w-full bg-[#f2f3ff] border border-[#c0c7d0] rounded-xl p-4 md:p-5 mb-8 text-left">
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center py-1.5 border-b border-[#c0c7d0]/40">
                <span className="text-xs font-semibold text-[#40484f]">
                  {isAm ? "የትዕዛዝ ቁጥር" : "Order ID"}
                </span>
                <span className="font-mono text-xs text-[#131b2e] font-bold">ETH-8942-XJ</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#c0c7d0]/40">
                <span className="text-xs font-semibold text-[#40484f]">
                  {isAm ? "የተከፈለው መጠን" : "Amount Paid"}
                </span>
                <span className="text-xs text-[#131b2e] font-bold">{amount}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs font-semibold text-[#40484f]">
                  {isAm ? "ቀን" : "Date"}
                </span>
                <span className="text-xs text-[#131b2e] font-medium">{todayStr}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity w-full sm:w-auto min-w-[180px]"
            >
              {isAm ? "ወደ ዳሽቦርድ ሂድ" : "Go to Dashboard"}
            </Link>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-[#c0c7d0] text-[#131b2e] text-xs font-bold rounded-lg hover:border-[#005985] hover:text-[#005985] transition-colors w-full sm:w-auto min-w-[180px] gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{isAm ? "ደረሰኝ አውርድ" : "Download Receipt"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
