import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function ChooseSubscriptionPlanPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [isAnnual, setIsAnnual] = useState(true);

  const handleSelectPlan = (plan: "pro" | "enterprise") => {
    if (plan === "pro") {
      navigate(`/subscription/checkout?plan=pro&billing=${isAnnual ? "annual" : "monthly"}`);
    } else {
      navigate("/help");
    }
  };

  return (
    <div className="font-['Inter',sans-serif] text-[#131b2e] p-4 md:p-8 max-w-[1280px] mx-auto w-full pb-24">
      {/* ── Current Plan Banner ── */}
      <section className="bg-white border border-[#c0c7d0] rounded-xl p-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-xs gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#40484f] uppercase tracking-wider mb-1">
            {isAm ? "የአሁኑ ንቁ እቅድ" : "Current Active Plan"}
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-[#131b2e] mb-1">
            {isAm ? "መሰረታዊ ተመራማሪ" : "Basic Researcher"}
          </h2>
          <p className="text-xs md:text-sm text-[#40484f]">
            {isAm
              ? "የአሁኑ እቅድዎ እስከ 3 ንቁ ጥናቶች እና በየጥናቱ 100 ምላሾች ይገድባል።"
              : "Your current plan limits you to 3 active surveys and 100 responses per survey."}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#f2f3ff] text-[#40484f] border border-[#c0c7d0]">
            {isAm ? "ጥቅምት 15፣ 2024 ይታደሳል" : "Renews on Oct 15, 2024"}
          </span>
          <button
            type="button"
            className="px-4 py-2 bg-white border border-[#c0c7d0] text-[#131b2e] text-xs font-semibold rounded-lg hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            {isAm ? "ምዝገባን ሰርዝ" : "Cancel Subscription"}
          </button>
        </div>
      </section>

      {/* ── Pricing Header & Toggle ── */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#131b2e] mb-2 tracking-tight">
          {isAm ? "ምርምርዎን ያሻሽሉ" : "Upgrade Your Research"}
        </h1>
        <p className="text-sm md:text-base text-[#40484f] mb-6">
          {isAm
            ? "የመረጃ አሰባሰብ ፍላጎትዎን በተሻለ የሚስማማውን እቅድ ይምረጡ።"
            : "Select the plan that best fits your data collection needs."}
        </p>

        {/* Toggle (Monthly / Annually) */}
        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-xs font-semibold cursor-pointer ${
              !isAnnual ? "text-[#131b2e]" : "text-[#40484f]"
            }`}
            onClick={() => setIsAnnual(false)}
          >
            {isAm ? "በየወሩ" : "Monthly"}
          </span>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#e2e7ff] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#c0c7d0] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2872a1]"></div>
          </label>

          <span
            className={`text-xs font-semibold cursor-pointer flex items-center gap-1 ${
              isAnnual ? "text-[#131b2e]" : "text-[#40484f]"
            }`}
            onClick={() => setIsAnnual(true)}
          >
            <span>{isAm ? "በየዓመቱ" : "Annually"}</span>
            <span className="text-[#2872a1] font-bold text-[11px]">
              ({isAm ? "20% ቅናሽ" : "Save 20%"})
            </span>
          </span>
        </div>
      </div>

      {/* ── Pricing Grid (3 Cards matching Stitch Screen 38ccf487ee184529aa928cfae24138af) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Basic Plan */}
        <div className="bg-white border border-[#c0c7d0] rounded-2xl p-6 md:p-8 flex flex-col relative shadow-xs">
          <h3 className="text-lg font-bold text-[#131b2e] mb-1">
            {isAm ? "መሰረታዊ" : "Basic"}
          </h3>
          <p className="text-xs text-[#40484f] mb-4 h-10">
            {isAm ? "ለግል ተመራማሪዎች አስፈላጊ መሣሪያዎች።" : "Essential tools for individual researchers."}
          </p>
          <div className="mb-6">
            <span className="text-3xl font-bold text-[#131b2e]">
              {isAnnual ? "$12" : "$15"}
            </span>
            <span className="text-xs text-[#40484f]">/mo</span>
          </div>

          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 bg-[#f2f3ff] text-[#40484f] border border-[#c0c7d0] rounded-lg text-xs font-semibold mb-6 cursor-not-allowed"
          >
            {isAm ? "የአሁኑ እቅድ" : "Current Plan"}
          </button>

          <ul className="flex flex-col gap-3 text-xs flex-grow">
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "እስከ 3 ንቁ ጥናቶች" : "Up to 3 active surveys"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "100 ምላሾች በየጥናቱ" : "100 responses / survey"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "መደበኛ የስነ-ህዝብ ዒላማ ማድረግ" : "Standard demographic targeting"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#717880] line-through opacity-60">
              <span className="material-symbols-outlined text-[#717880] text-base shrink-0">close</span>
              <span>{isAm ? "በAI የታገዘ የጥናት ግንባታ" : "AI-assisted survey building"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#717880] line-through opacity-60">
              <span className="material-symbols-outlined text-[#717880] text-base shrink-0">close</span>
              <span>{isAm ? "ጥሬ መረጃ ወደ ውጭ መላክ (CSV/XLSX)" : "Raw Data Export (CSV/XLSX)"}</span>
            </li>
          </ul>
        </div>

        {/* Professional Plan (Recommended) */}
        <div className="bg-white border-2 border-[#2872a1] rounded-2xl p-6 md:p-8 flex flex-col relative shadow-md transform md:-translate-y-3">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2872a1] text-white px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs">
            {isAm ? "የሚመከር" : "Recommended"}
          </div>

          <h3 className="text-lg font-bold text-[#131b2e] mb-1 mt-2">
            {isAm ? "ፕሮፌሽናል" : "Professional"}
          </h3>
          <p className="text-xs text-[#40484f] mb-4 h-10">
            {isAm
              ? "ለሰፊና አጠቃላይ ጥናቶች የተሻሻሉ ባህሪያት።"
              : "Advanced features for comprehensive studies."}
          </p>
          <div className="mb-6">
            <span className="text-3xl font-bold text-[#131b2e]">
              {isAnnual ? "$39" : "$49"}
            </span>
            <span className="text-xs text-[#40484f]">/mo</span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("pro")}
            className="w-full py-2.5 px-4 bg-gradient-to-br from-[#2872a1] to-[#005985] text-white rounded-lg text-xs font-bold hover:opacity-95 transition-opacity mb-6 shadow-sm cursor-pointer"
          >
            {isAm ? "ወደ ፕሮ አሻሽል" : "Upgrade to Pro"}
          </button>

          <ul className="flex flex-col gap-3 text-xs flex-grow">
            <li className="flex items-start gap-2 text-[#131b2e] font-medium">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "ያልተገደበ ንቁ ጥናቶች" : "Unlimited active surveys"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e] font-medium">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "1,000 ምላሾች በየጥናቱ" : "1,000 responses / survey"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "የላቀ የስነ-ህዝብ ዒላማ ማድረግ" : "Advanced demographic targeting"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "በAI የታገዘ የጥናት ግንባታ" : "AI-assisted survey building"}</span>
            </li>
            <li className="flex items-start gap-2 bg-[#f2f3ff] p-2.5 rounded-lg border border-[#dae2fd] text-[#005985] font-semibold">
              <span className="material-symbols-outlined text-[#005985] text-base shrink-0">download</span>
              <span>{isAm ? "ጥሬ መረጃ ወደ ውጭ መላክ (CSV/XLSX)" : "Raw Data Export (CSV/XLSX)"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "የላቀ የትንተና ግንዛቤዎች" : "Advanced Insights Analytics"}</span>
            </li>
          </ul>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white border border-[#c0c7d0] rounded-2xl p-6 md:p-8 flex flex-col relative shadow-xs">
          <h3 className="text-lg font-bold text-[#131b2e] mb-1">
            {isAm ? "ኢንተርፕራይዝ" : "Enterprise"}
          </h3>
          <p className="text-xs text-[#40484f] mb-4 h-10">
            {isAm
              ? "ለተቋማት ከፍተኛ ልኬት እና ልዩ ድጋፍ።"
              : "Maximum scale and dedicated support for organizations."}
          </p>
          <div className="mb-6">
            <span className="text-3xl font-bold text-[#131b2e]">
              {isAnnual ? "$119" : "$149"}
            </span>
            <span className="text-xs text-[#40484f]">/mo</span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("enterprise")}
            className="w-full py-2.5 px-4 bg-white text-[#131b2e] border border-[#c0c7d0] rounded-lg text-xs font-semibold hover:border-[#2872a1] transition-colors mb-6 cursor-pointer"
          >
            {isAm ? "የሽያጭ ክፍል ያነጋግሩ" : "Contact Sales"}
          </button>

          <ul className="flex flex-col gap-3 text-xs flex-grow">
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "ያልተገደበ ንቁ ጥናቶች" : "Unlimited active surveys"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "ያልተገደበ ምላሾች" : "Unlimited responses"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "ብጁ የስነ-ህዝብ ፓነሎች" : "Custom demographic panels"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "ጥሬ መረጃ ወደ ውጭ መላክ (CSV/XLSX/API)" : "Raw Data Export (CSV/XLSX/API)"}</span>
            </li>
            <li className="flex items-start gap-2 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#2872a1] text-base shrink-0">check</span>
              <span>{isAm ? "የተመደበ የመለያ ሥራ አስኪያጅ" : "Dedicated Account Manager"}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
