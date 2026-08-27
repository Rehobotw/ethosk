import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/lib/language";

type PaymentMethod = "telebirr" | "cbe_birr" | "bank_transfer" | "wallet";

export function SubscriptionCheckoutReadyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isAm = language === "am";

  const plan = searchParams.get("plan") || "pro";
  const billing = searchParams.get("billing") || "annual";
  const isAnnual = billing === "annual";

  // Prices in ETB (Photo-Aligned to Ethiopian Currency & verify.et integration)
  const subtotalEtb = isAnnual ? 4700 : 490;
  const vatRate = 0.15;
  const taxEtb = Number((subtotalEtb * vatRate).toFixed(2));
  const totalEtb = (subtotalEtb + taxEtb).toFixed(2);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("telebirr");
  const [phoneNumber, setPhoneNumber] = useState("0911234567");
  const [txnRef, setTxnRef] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [fullName, setFullName] = useState("Dr. Selamawit G.");
  const [institution, setInstitution] = useState("Addis Ababa University");
  const [address, setAddress] = useState("King George VI St");
  const [city, setCity] = useState("Addis Ababa");
  const [postal, setPostal] = useState("1000");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;

    navigate(
      `/subscription/checkout/processing?plan=${plan}&billing=${billing}&method=${paymentMethod}&ref=${encodeURIComponent(
        txnRef || "AUTO-VERIFY",
      )}`,
    );
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] font-['Inter',sans-serif] min-h-screen flex flex-col antialiased">
      {/* ── Top Header (Minimal Transactional Shell per Stitch Screen 0b2a8dffd1b340318a48cee18e4d2c91) ── */}
      <header className="bg-white border-b border-[#c0c7d0] flex justify-between items-center w-full px-6 h-16 max-w-[1280px] mx-auto shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            to="/subscription/plans"
            className="font-bold text-xl text-[#005985] tracking-tight hover:opacity-90 transition-opacity"
          >
            Ethosk
          </Link>
          <span className="text-xs text-[#40484f] pl-3 border-l border-[#c0c7d0] font-medium hidden sm:inline">
            {isAm ? "ተመራማሪ ፖርታል - ደህንነቱ የተጠበቀ ክፍያ" : "Researcher Portal — Secure Checkout"}
          </span>
        </div>
        <Link
          to="/subscription/plans"
          className="text-[#50616b] hover:text-[#005985] transition-colors p-1 rounded-full flex items-center justify-center"
          aria-label="Cancel and return"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </Link>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 w-full max-w-[1024px] mx-auto p-4 md:p-8 lg:p-12 pb-24">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] tracking-tight mb-2">
            {isAm ? "ደህንነቱ የተጠበቀ ክፍያ" : "Secure Checkout"}
          </h1>
          <p className="text-sm md:text-base text-[#40484f]">
            {isAm
              ? "የላቁ የምርምር መሣሪያዎችን ለመጠቀም ምዝገባዎን በቴሌብር ወይም በሲቢኢ ብር ያጠናቅቁ።"
              : "Complete your subscription with Telebirr or CBE Birr via verify.et automated verification."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Payment & Billing ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Payment Method Selector (verify.et Approach) */}
            <div className="bg-white border border-[#c0c7d0] rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#005985]">payments</span>
                  <h2 className="text-base font-bold text-[#131b2e]">
                    {isAm ? "የክፍያ ዘዴ" : "Payment Method"}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 bg-[#eff4ff] text-[#005985] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#dae2fd]">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  <span>verify.et</span>
                </span>
              </div>

              {/* Method Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("telebirr")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === "telebirr"
                      ? "border-[#005985] bg-[#eff4ff] text-[#005985] font-bold shadow-xs"
                      : "border-[#c0c7d0] bg-white text-[#40484f] hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">phone_android</span>
                  <span className="text-xs">Telebirr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cbe_birr")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === "cbe_birr"
                      ? "border-[#005985] bg-[#eff4ff] text-[#005985] font-bold shadow-xs"
                      : "border-[#c0c7d0] bg-white text-[#40484f] hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  <span className="text-xs">CBE Birr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === "wallet"
                      ? "border-[#005985] bg-[#eff4ff] text-[#005985] font-bold shadow-xs"
                      : "border-[#c0c7d0] bg-white text-[#40484f] hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  <span className="text-xs">Escrow Wallet</span>
                </button>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                {paymentMethod !== "wallet" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#40484f] mb-1">
                        {paymentMethod === "telebirr"
                          ? isAm
                            ? "የቴሌብር ስልክ ቁጥር"
                            : "Telebirr Registered Mobile"
                          : isAm
                          ? "የሲቢኢ ብር ስልክ ቁጥር ወይም መለያ"
                          : "CBE Birr Phone or Account Number"}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0911234567"
                          className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs md:text-sm text-[#131b2e] focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] font-mono transition-all"
                          required
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                          lock
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#40484f] mb-1">
                        {isAm
                          ? "የግብይት ማጣቀሻ ቁጥር (ከተከፈለ በኋላ የሚላክ)"
                          : "Transaction Reference ID (verify.et Reconciliation)"}
                      </label>
                      <input
                        type="text"
                        value={txnRef}
                        onChange={(e) => setTxnRef(e.target.value)}
                        placeholder="e.g. TXN-99412 or CBE Ref code"
                        className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs md:text-sm text-[#131b2e] focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] font-mono transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-[#eff4ff] rounded-lg border border-[#dae2fd] text-xs text-[#005985] space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                      <span>{isAm ? "ከዋሌት ሂሳብ ይቀነሳል" : "Deduct directly from Wallet balance"}</span>
                    </p>
                    <p className="text-[11px] text-[#40484f]">
                      {isAm
                        ? "ክፍያው ከኢስክሮው ዋሌትዎ በቀጥታ ተቀናሽ ይደረጋል።"
                        : "Amount will be debited instantly from your researcher escrow deposit."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Address Card */}
            <div className="bg-white border border-[#c0c7d0] rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#005985]">location_on</span>
                <h2 className="text-base font-bold text-[#131b2e]">
                  {isAm ? "የክፍያ አድራሻ" : "Billing Address & Institution"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#40484f] mb-1">
                      {isAm ? "ሙሉ ስም" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs text-[#131b2e] focus:outline-none focus:border-[#005985] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#40484f] mb-1">
                      {isAm ? "ተቋም" : "Institution / Organization"}
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs text-[#131b2e] focus:outline-none focus:border-[#005985] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#40484f] mb-1">
                    {isAm ? "የመንገድ አድራሻ" : "Street Address"}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs text-[#131b2e] focus:outline-none focus:border-[#005985] transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#40484f] mb-1">
                      {isAm ? "ከተማ" : "City"}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs text-[#131b2e] focus:outline-none focus:border-[#005985] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#40484f] mb-1">
                      {isAm ? "ፖስታ ኮድ" : "Postal Code"}
                    </label>
                    <input
                      type="text"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                      className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs text-[#131b2e] focus:outline-none focus:border-[#005985] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#40484f] mb-1">
                      {isAm ? "ሀገር" : "Country"}
                    </label>
                    <select className="w-full bg-[#faf8ff] border border-[#c0c7d0] rounded-lg px-3.5 py-2 text-xs text-[#131b2e] focus:outline-none focus:border-[#005985] transition-all cursor-pointer">
                      <option value="ET">Ethiopia</option>
                      <option value="KE">Kenya</option>
                      <option value="RW">Rwanda</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="lg:col-span-5 relative">
            <aside className="sticky top-6 bg-white border border-[#c0c7d0] rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[#131b2e]">
                {isAm ? "የትዕዛዝ ማጠቃለያ" : "Order Summary"}
              </h2>

              {/* Plan Details Box */}
              <div className="bg-[#f2f3ff] rounded-xl p-4 border border-[#c0c7d0]/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-[#131b2e]">
                      {plan === "pro"
                        ? isAm
                          ? "ፕሮፌሽናል ተመራማሪ"
                          : "Professional Researcher"
                        : isAm
                        ? "ኢንተርፕራይዝ ተመራማሪ"
                        : "Enterprise Researcher"}
                    </h3>
                    <p className="text-[11px] text-[#40484f] capitalize">
                      {billing} {isAm ? "ክፍያ" : "Billing"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#005985]">
                    {subtotalEtb.toLocaleString()} ETB/{isAnnual ? "yr" : "mo"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#50616b] text-[11px] pt-1">
                  <span className="material-symbols-outlined text-[14px]">autorenew</span>
                  <span>{isAm ? "በጥቅምት 15፣ 2025 ይታደሳል" : "Renews on Oct 15, 2025"}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 py-3 border-b border-[#c0c7d0]/30 text-xs">
                <div className="flex justify-between text-[#40484f]">
                  <span>{isAm ? "ንዑስ ድምር" : "Subtotal"}</span>
                  <span className="font-medium text-[#131b2e]">{subtotalEtb.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-[#40484f]">
                  <span>{isAm ? "ግብር (15% ተ.እ.ታ)" : "Tax (15% VAT)"}</span>
                  <span className="font-medium text-[#131b2e]">{taxEtb.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-bold text-[#131b2e]">{isAm ? "ጠቅላላ ድምር" : "Total"}</span>
                <span className="text-lg font-bold text-[#005985]">{totalEtb} ETB</span>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="terms-agree"
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#c0c7d0] text-[#005985] focus:ring-[#005985] cursor-pointer"
                  required
                />
                <label htmlFor="terms-agree" className="text-[11px] text-[#40484f] leading-relaxed cursor-pointer">
                  {isAm ? (
                    <>
                      'አረጋግጥ እና ክፈል' የሚለውን ሲጫኑ የኢቶስክን{" "}
                      <span className="text-[#005985] underline">የአገልግሎት ውሎች</span> እና{" "}
                      <span className="text-[#005985] underline">የግላዊነት መመሪያ</span> ይስማማሉ።
                    </>
                  ) : (
                    <>
                      By clicking 'Confirm and Pay', you agree to Ethosk's{" "}
                      <span className="text-[#005985] underline">Terms of Service</span> and{" "}
                      <span className="text-[#005985] underline">Privacy Policy</span>.
                    </>
                  )}
                </label>
              </div>

              {/* Confirm & Pay CTA Button */}
              <button
                type="submit"
                disabled={!agreedTerms}
                className="w-full py-3 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>{isAm ? "አረጋግጥ እና በverify.et ክፈል" : "Confirm and Pay via verify.et"}</span>
              </button>

              {/* Trust & Security Badges */}
              <div className="pt-2 flex justify-center gap-4 text-[#50616b] text-[11px] opacity-80">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>verify.et Automated</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">shield</span>
                  <span>SSL 256-Bit</span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}
