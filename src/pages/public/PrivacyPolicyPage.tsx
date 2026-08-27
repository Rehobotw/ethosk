import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [activeSection, setActiveSection] = useState("collection");

  const sections = [
    { id: "collection", title: isAm ? "1. የመረጃ አሰባሰብ" : "1. Information Collection", icon: "data_usage" },
    { id: "usage", title: isAm ? "2. የመረጃ አጠቃቀም" : "2. How We Use Data", icon: "monitoring" },
    { id: "sharing", title: isAm ? "3. መረጃ መጋራት" : "3. Data Sharing", icon: "share" },
    { id: "security", title: isAm ? "4. የመረጃ ደህንነት" : "4. Data Security", icon: "security" },
    { id: "rights", title: isAm ? "5. የእርስዎ መብቶች" : "5. Your Rights", icon: "gavel" },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      {/* ── Top Navigation Bar (Exact Stitch Screen b9657a94beb747508336fb4d86087b80) ── */}
      <header className="bg-white sticky top-0 w-full z-50 border-b border-[#c0c7d0]/40 transition-all">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="font-bold text-xl md:text-2xl text-[#005985] tracking-tight hover:opacity-90 transition-opacity"
            >
              Ethosk
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-[#50616b]">
              <Link to="/#solutions" className="hover:text-[#005985] transition-colors">
                {isAm ? "መፍትሄዎች" : "Solutions"}
              </Link>
              <Link to="/help" className="hover:text-[#005985] transition-colors">
                {isAm ? "የእርዳታ ማዕከል" : "Resources"}
              </Link>
              <Link to="/subscription/plans" className="hover:text-[#005985] transition-colors">
                {isAm ? "ዋጋ" : "Pricing"}
              </Link>
              <Link to="/contact" className="hover:text-[#005985] transition-colors">
                {isAm ? "ስለ እኛ" : "About"}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#50616b] hover:text-[#005985] transition-colors hidden sm:inline"
            >
              {isAm ? "ግባ" : "Sign In"}
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
            >
              {isAm ? "ይጀምሩ" : "Get Started"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Layout: Privacy Center Sidebar & Reading Canvas ── */}
      <div className="flex-1 max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row relative">
        {/* Desktop SideNav */}
        <aside className="hidden lg:flex flex-col sticky top-16 bg-[#f2f3ff] w-64 h-[calc(100vh-64px)] border-r border-[#c0c7d0]/50 shrink-0">
          <div className="p-6 border-b border-[#c0c7d0]/40">
            <h2 className="text-sm font-bold text-[#005985] mb-0.5">
              {isAm ? "የግላዊነት ማዕከል" : "Privacy Center"}
            </h2>
            <p className="text-[11px] text-[#50616b]">
              {isAm ? "ለመጨረሻ ጊዜ የተሻሻለው፡ ጥቅምት 2023" : "Last updated Oct 2023"}
            </p>
          </div>

          <nav className="flex-1 p-4 flex flex-col gap-1 text-xs">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className={`p-3 flex items-center gap-3 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                  activeSection === s.id
                    ? "bg-white text-[#005985] font-bold shadow-xs border border-[#c0c7d0]/40"
                    : "text-[#40484f] hover:bg-[#e2e7ff]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Reading Canvas */}
        <main className="flex-1 bg-white p-6 md:p-10 lg:p-12 flex justify-center w-full">
          <div className="max-w-[720px] w-full flex flex-col gap-8">
            <header className="border-b border-[#c0c7d0]/40 pb-6">
              <h1 className="text-2xl md:text-4xl font-bold text-[#005985] mb-3 tracking-tight">
                {isAm ? "የግላዊነት መመሪያ" : "Privacy Policy"}
              </h1>
              <p className="text-xs md:text-sm text-[#50616b] bg-[#f2f3ff] py-2 px-3 border-l-4 border-[#005985] rounded-r-lg inline-block font-medium mb-3">
                {isAm ? "የሚፀናበት ቀን፡ " : "Effective Date: "}
                <span className="font-bold text-[#131b2e]">
                  {isAm ? "ጥቅምት 2023" : "October 2023"}
                </span>
              </p>
              <p className="text-xs md:text-sm text-[#50616b] leading-relaxed">
                {isAm
                  ? "ኢቶስክ የተመራማሪዎቻችንን እና የተሳታፊዎቻችንን እምነት ለመጠበቅ ቁርጠኛ ነው። ይህ የግላዊነት መመሪያ በኢትዮጵያ ገበያ ውስጥ መረጃዎን እንዴት እንደምንሰበስብ፣ እንደምንጠቀም እና እንደምንጠብቅ በዝርዝር ያብራራል።"
                  : "Ethosk is committed to maintaining the trust of our researchers and respondents. This Privacy Policy details how we collect, use, and protect your information within the Ethiopian market, ensuring technical precision and institutional reliability."}
              </p>
            </header>

            <article className="flex flex-col gap-10 text-xs md:text-sm text-[#131b2e] leading-relaxed">
              {/* Section 1: Information Collection */}
              <section id="collection" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#005985]">
                    <span className="material-symbols-outlined text-[20px]">data_usage</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#005985]">
                    {isAm ? "1. የመረጃ አሰባሰብ" : "1. Information Collection"}
                  </h2>
                </div>
                <div className="pl-10 space-y-2 text-[#50616b]">
                  <p>
                    {isAm
                      ? "ትክክለኛ እና አስተማማኝ የምርምር መሣሪያዎችን ለማቅረብ የሚከተሉትን መረጃዎች እንሰበስባለን፡"
                      : "We collect information to provide rigorous and reliable research tools. This includes:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong className="text-[#131b2e]">{isAm ? "የግል ውሂብ፡ " : "Personal Data: "}</strong>
                      {isAm
                        ? "ለመለያ ፈጠራ እና ለተሳታፊ መገለጫ የሚያስፈልግ ስም፣ የእውቂያ ዝርዝሮች እና የስነ-ህዝብ መረጃ።"
                        : "Name, contact details, and demographic information required for account creation and respondent profiling."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የፋይዳ ብሄራዊ መታወቂያ ውህደት፡ " : "Fayda ID Integration: "}
                      </strong>
                      {isAm
                        ? "ለተረጋገጡ ተሳታፊዎች ከብሔራዊ የፋይዳ ስርዓት ጋር በደህንነት እንገናኛለን። የባዮሜትሪክ መረጃዎችን አናስቀምጥም፣ የማረጋገጫ ሁኔታውን ብቻ እንመዘግባለን።"
                        : "For verified respondents, we securely integrate with the national Fayda ID system. We do not store the underlying biometric data, only the verification status."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የጥናት ምላሽ ውሂብ፡ " : "Survey Response Data: "}
                      </strong>
                      {isAm
                        ? "በጥናት ወቅት የሚቀርቡ መልሶች ለምርምር ትንተና ይሰበሰባሉ።"
                        : "Data submitted during surveys is collected and structured for research analytics."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 2: How We Use Data */}
              <section id="usage" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#005985]">
                    <span className="material-symbols-outlined text-[20px]">monitoring</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#005985]">
                    {isAm ? "2. የመረጃ አጠቃቀም" : "2. How We Use Data"}
                  </h2>
                </div>
                <div className="pl-10 space-y-2 text-[#50616b]">
                  <p>
                    {isAm
                      ? "የምንሰበስበው መረጃ መድረካችንን ለማስኬድ እና ለማሻሻል ብቻ ጥቅም ላይ ይውላል፡"
                      : "The information we collect is strictly utilized to operate and improve our platform:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong className="text-[#131b2e]">{isAm ? "የአገልግሎት አቅርቦት፡ " : "Service Provision: "}</strong>
                      {isAm
                        ? "ጥናቶችን መፍጠር፣ ማሰራጨት እና ማጠናቀቅን ለማመቻቸት።"
                        : "To facilitate the creation, distribution, and completion of surveys."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የማንነት ማረጋገጫ፡ " : "Identity Verification: "}
                      </strong>
                      {isAm
                        ? "በፋይዳ መታወቂያ አማካኝነት የታማኝ ተሳታፊዎችን ስብስብ ማረጋገጥ።"
                        : "Ensuring the integrity of our respondent pool through Fayda ID validation."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የምርምር ትንተና፡ " : "Research Analytics: "}
                      </strong>
                      {isAm
                        ? "ለምላሾች የተጠቃለለ እና የማይታወቅ (anonymized) ግንዛቤዎችን ለተመራማሪዎች ማቅረብ።"
                        : "Aggregating and anonymizing response data to provide actionable insights to researchers."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3: Data Sharing */}
              <section id="sharing" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#005985]">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#005985]">
                    {isAm ? "3. መረጃ መጋራት" : "3. Data Sharing"}
                  </h2>
                </div>
                <div className="pl-10 space-y-2 text-[#50616b]">
                  <div className="bg-[#faf8ff] border border-[#c0c7d0]/60 rounded-xl p-4 my-2">
                    <h3 className="text-xs font-bold text-[#131b2e] mb-1">
                      {isAm ? "የተቋማዊ ተመራማሪዎች ተደራሽነት" : "Institutional Researcher Access"}
                    </h3>
                    <p className="text-xs text-[#50616b]">
                      {isAm
                        ? "ተመራማሪዎች የተጠቃለለ እና የማይታወቅ መረጃ ብቻ ይቀበላሉ፤ ተሳታፊው በግልጽ ካልፈቀደ በስተቀር የግል መለያ መረጃዎች አይጋሩም።"
                        : "Researchers only receive aggregated, anonymized data unless explicit consent is provided by the respondent for personally identifiable information sharing."}
                    </p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "ሶስተኛ ወገን አገልግሎት ሰጪዎች፡ " : "Third-Party Service Providers: "}
                      </strong>
                      {isAm
                        ? "የመድረክ ስራዎችን የሚያግዙ የታመኑ አጋሮች (ለምሳሌ የቴሌብር ክፍያ ውህደት)።"
                        : "Trusted infrastructure partners operating under strict data processing agreements."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የህግ ተገዢነት፡ " : "Legal Compliance: "}
                      </strong>
                      {isAm
                        ? "በኢትዮጵያ ህግ ሲጠየቅ ወይም የመድረኩን ደህንነት ለመጠበቅ አስፈላጊ ሆኖ ሲገኝ።"
                        : "When required by Ethiopian law or to protect user safety."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4: Data Security */}
              <section id="security" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#005985]">
                    <span className="material-symbols-outlined text-[20px]">security</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#005985]">
                    {isAm ? "4. የመረጃ ደህንነት" : "4. Data Security"}
                  </h2>
                </div>
                <div className="pl-10 space-y-2 text-[#50616b]">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የኢንክሪፕሽን ደረጃዎች፡ " : "Encryption Standards: "}
                      </strong>
                      {isAm
                        ? "ሁሉም መረጃዎች በሚተላለፉበት እና በሚቀመጡበት ጊዜ በደረጃ 256-ቢት ኢንክሪፕት ይደረጋሉ።"
                        : "All data is encrypted in transit and at rest using industry-standard AES-256 protocols."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የኢትዮጵያ የውሂብ ነዋሪነት፡ " : "Ethiopian Data Residency: "}
                      </strong>
                      {isAm
                        ? "የአካባቢ ህጎችን ለማክበር መረጃዎች በኢትዮጵያ ውስጥ ባሉ ሰርቨሮች ላይ ይስተናገዳሉ።"
                        : "Where applicable, data is hosted on servers compliant with local data residency requirements."}
                    </li>
                    <li>
                      <strong className="text-[#131b2e]">
                        {isAm ? "የሚና-ተኮር የመዳረሻ ቁጥጥሮች፡ " : "Access Controls: "}
                      </strong>
                      {isAm
                        ? "ፈቃድ ያላቸው ባለሙያዎች ብቻ ሚስጥራዊ መረጃዎችን ማግኘት ይችላሉ።"
                        : "Strict role-based access ensures only authorized personnel handle sensitive datasets."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5: Your Rights */}
              <section id="rights" className="scroll-mt-28 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#005985]">
                    <span className="material-symbols-outlined text-[20px]">gavel</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#005985]">
                    {isAm ? "5. የእርስዎ መብቶች" : "5. Your Rights"}
                  </h2>
                </div>
                <div className="pl-10 space-y-3 text-[#50616b]">
                  <p>
                    {isAm
                      ? "በግል መረጃዎ ላይ ሙሉ ቁጥጥር አለዎት። የሚከተሉት መብቶች አሉዎት፡"
                      : "You maintain control over your personal information. You have the right to:"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-[#c0c7d0]/60 rounded-xl p-3.5 bg-white">
                      <span className="material-symbols-outlined text-[#005985] text-lg mb-1 block">
                        visibility
                      </span>
                      <h4 className="text-xs font-bold text-[#131b2e] mb-0.5">
                        {isAm ? "የመመልከት መብት (Access)" : "Access"}
                      </h4>
                      <p className="text-[11px] text-[#50616b]">
                        {isAm
                          ? "ስለ እርስዎ የያዝነውን የግል መረጃ ቅጂ የመጠየቅ መብት።"
                          : "Request a copy of the personal data we hold about you."}
                      </p>
                    </div>

                    <div className="border border-[#c0c7d0]/60 rounded-xl p-3.5 bg-white">
                      <span className="material-symbols-outlined text-[#005985] text-lg mb-1 block">
                        edit
                      </span>
                      <h4 className="text-xs font-bold text-[#131b2e] mb-0.5">
                        {isAm ? "የማረም መብት (Correction)" : "Correction"}
                      </h4>
                      <p className="text-[11px] text-[#50616b]">
                        {isAm
                          ? "ትክክለኛ ያልሆነ መረጃን የማስተካከል ወይም የማሟላት መብት።"
                          : "Update or correct inaccurate or incomplete information."}
                      </p>
                    </div>

                    <div className="border border-[#c0c7d0]/60 rounded-xl p-3.5 bg-white md:col-span-2">
                      <span className="material-symbols-outlined text-[#005985] text-lg mb-1 block">
                        delete
                      </span>
                      <h4 className="text-xs font-bold text-[#131b2e] mb-0.5">
                        {isAm ? "የመሰረዝ መብት (Deletion)" : "Deletion"}
                      </h4>
                      <p className="text-[11px] text-[#50616b]">
                        {isAm
                          ? "ህጋዊ ግዴታዎችን መሰረት በማድረግ የግል መረጃዎ እንዲሰረዝ የመጠየቅ መብት።"
                          : "Request the erasure of your personal data, subject to legal and contractual obligations."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </article>

            {/* Bottom Support CTA Box */}
            <div className="mt-8 p-6 bg-[#f2f3ff] rounded-2xl border border-[#c0c7d0]/60 text-center space-y-3">
              <h3 className="text-sm font-bold text-[#131b2e]">
                {isAm ? "አሁንም ጥያቄዎች አሉዎት?" : "Still have questions?"}
              </h3>
              <p className="text-xs text-[#50616b] max-w-md mx-auto">
                {isAm
                  ? "የእኛ የመረጃ ግላዊነት ቡድን ይህንን ፖሊሲ በተመለከተ ማንኛውንም ጥያቄ ለመመለስ ዝግጁ ነው።"
                  : "Our data privacy team is ready to assist you with any inquiries regarding this policy."}
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 bg-white border border-[#c0c7d0] hover:border-[#005985] hover:text-[#005985] text-[#131b2e] px-5 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>{isAm ? "የድጋፍ ቡድንን ያነጋግሩ" : "Contact Support"}</span>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#c0c7d0]/40 mt-auto w-full py-8 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#50616b]">
          <div className="font-bold text-[#005985] text-base">Ethosk</div>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="font-bold text-[#005985]">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#005985] transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="hover:text-[#005985] transition-colors">
              Help Center
            </Link>
            <Link to="/contact" className="hover:text-[#005985] transition-colors">
              Contact
            </Link>
          </div>
          <div>© {new Date().getFullYear()} Ethosk. Registered in Ethiopia.</div>
        </div>
      </footer>
    </div>
  );
}
