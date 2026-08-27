import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function SubscriptionCheckoutProcessingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isAm = language === "am";

  const plan = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "annual";
  const isAnnual = billing === "annual";

  const planPrice = isAnnual ? 39 : 49;
  const tax = Number((planPrice * 0.15).toFixed(2));
  const total = (planPrice + tax).toFixed(2);

  const [simulatedProgress, setSimulatedProgress] = useState(66);

  useEffect(() => {
    // Progress animation simulator
    const timer = setTimeout(() => {
      setSimulatedProgress(100);
      navigate(`/subscription/checkout/success?plan=${plan}&billing=${billing}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, plan, billing]);

  return (
    <div className="font-['Inter',sans-serif] text-[#131b2e] bg-[#faf8ff] min-h-screen relative overflow-hidden flex flex-col">
      {/* ── Processing Overlay Modal (Exact Stitch Screen 2adc77615764481cbf7c3199b440fdc8) ── */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8ff]/80 backdrop-blur-xs transition-opacity duration-300 p-4"
      >
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_10px_25px_-3px_rgba(0,89,133,0.1),0_4px_6px_-2px_rgba(0,0,0,0.02)] border border-[#c0c7d0] max-w-md w-full flex flex-col items-center text-center">
          {/* Animated Spinner & Lock */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#e2e7ff]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#005985] border-t-transparent animate-spin"></div>
            <span className="material-symbols-outlined text-[#005985] text-4xl">lock</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-[#131b2e] mb-2">
            {isAm ? "ክፍያ በመከናወን ላይ ነው" : "Processing Payment"}
          </h2>
          <p className="text-xs md:text-sm text-[#40484f] mb-6 leading-relaxed">
            {isAm
              ? "እባክዎ ምዝገባዎን እስክናረጋግጥ ድረስ ይጠብቁ። ይህን ገጽ አያድሱ ወይም አይዝጉ።"
              : "Please wait while we confirm your subscription. Do not refresh or close this page."}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#005985] h-full rounded-full transition-all duration-500"
              style={{ width: `${simulatedProgress}%` }}
            ></div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(`/subscription/checkout/success?plan=${plan}&billing=${billing}`)
            }
            className="mt-6 text-[11px] text-[#005985] hover:underline font-semibold cursor-pointer"
          >
            {isAm ? "ወደ ስኬት ገጽ ዝለል (ሙከራ)" : "Skip to Success (Demo)"}
          </button>
        </div>
      </div>

      {/* ── Background Checkout Page (Blurred context per spec) ── */}
      <div className="flex flex-col min-h-screen opacity-40 blur-[2px] pointer-events-none">
        {/* Top Header */}
        <header className="bg-white border-b border-[#c0c7d0] flex justify-between items-center w-full px-6 h-16 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#005985]">Ethosk</span>
            <span className="text-sm text-[#40484f] ml-2 pl-2 border-l border-[#c0c7d0]">
              Secure Checkout
            </span>
          </div>
        </header>

        {/* Content Preview */}
        <main className="flex-1 p-4 md:p-8 max-w-[680px] mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#131b2e] mb-1">
              Complete Your Subscription
            </h1>
            <p className="text-xs text-[#40484f]">
              Review your details and finalize the payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Payment Method */}
              <section className="bg-white border border-[#c0c7d0] rounded-xl p-5">
                <h3 className="text-xs font-bold text-[#131b2e] mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  <span>Payment Method</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#40484f] mb-1">Card Number</label>
                    <div className="flex items-center border border-[#c0c7d0] rounded-lg px-3 py-2 bg-[#faf8ff] text-xs font-mono text-[#40484f]">
                      <span className="material-symbols-outlined text-[18px] mr-2">credit_card</span>
                      <span>•••• •••• •••• 4242</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#40484f] mb-1">Expiry Date</label>
                      <div className="border border-[#c0c7d0] rounded-lg px-3 py-2 bg-[#faf8ff] text-xs font-mono text-[#40484f]">
                        12 / 25
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#40484f] mb-1">CVC</label>
                      <div className="border border-[#c0c7d0] rounded-lg px-3 py-2 bg-[#faf8ff] text-xs font-mono text-[#40484f]">
                        •••
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#40484f] mb-1">Name on Card</label>
                    <div className="border border-[#c0c7d0] rounded-lg px-3 py-2 bg-[#faf8ff] text-xs text-[#131b2e]">
                      Jane Doe
                    </div>
                  </div>
                </div>
              </section>

              {/* Billing Address */}
              <section className="bg-white border border-[#c0c7d0] rounded-xl p-5">
                <h3 className="text-xs font-bold text-[#131b2e] mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">home</span>
                  <span>Billing Address</span>
                </h3>
                <div className="text-xs text-[#40484f] p-3 bg-[#f2f3ff] rounded-lg border border-[#c0c7d0] border-dashed space-y-0.5">
                  <p className="font-semibold text-[#131b2e]">Jane Doe</p>
                  <p>123 Research Ave, Suite 400</p>
                  <p>Addis Ababa, Ethiopia</p>
                </div>
              </section>
            </div>

            {/* Order Summary Sidebar */}
            <div className="md:col-span-1">
              <aside className="bg-[#f2f3ff] border border-[#c0c7d0] rounded-xl p-5 sticky top-6">
                <h3 className="text-xs font-bold text-[#131b2e] mb-3">Order Summary</h3>
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between items-center text-[#40484f]">
                    <span>Professional Plan</span>
                    <span className="font-semibold text-[#131b2e]">${planPrice}.00</span>
                  </div>
                  <div className="flex justify-between items-center text-[#40484f]">
                    <span>Billed</span>
                    <span className="capitalize">{billing}</span>
                  </div>
                  <div className="pt-2 border-t border-[#c0c7d0]/50 flex justify-between items-center text-[#40484f]">
                    <span>Tax (VAT 15%)</span>
                    <span className="font-semibold text-[#131b2e]">${tax}</span>
                  </div>
                </div>

                <div className="border-t border-[#c0c7d0] pt-3 mb-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-[#131b2e]">Total</span>
                    <span className="text-base font-bold text-[#005985]">${total}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full bg-[#dae2fd] text-[#40484f] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Processing...</span>
                </button>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
