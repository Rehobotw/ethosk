import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function TermsAndConditionsPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [activeSection, setActiveSection] = useState("intro");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: "intro", title: isAm ? "1. መግቢያ" : "1. Introduction", icon: "info" },
    { id: "privacy", title: isAm ? "2. የመረጃ ግላዊነት" : "2. Data Privacy", icon: "gavel" },
    { id: "conduct", title: isAm ? "3. የተጠቃሚ ስነ-ምግባር" : "3. User Conduct", icon: "person_check" },
    { id: "ip", title: isAm ? "4. አእምሯዊ ንብረት" : "4. Intellectual Property", icon: "copyright" },
    { id: "liability", title: isAm ? "5. ተጠያቂነት እና ዋስትና" : "5. Liability & Warranties", icon: "security" },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      {/* ── Top Navigation Bar (Exact Stitch Screen f65ad9193f004371b46667cace84d125) ── */}
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

      {/* ── Main Layout: Legal Center Sidebar & Content Canvas ── */}
      <div className="flex-1 max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row relative">
        {/* Mobile Menu Dropdown */}
        <div className="lg:hidden p-4 border-b border-[#c0c7d0]/40 bg-white sticky top-16 z-40">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-between w-full text-left font-bold text-xs text-[#005985]"
          >
            <span>{isAm ? "የህግ ማዕከል ምናሌ" : "Legal Center Menu"}</span>
            <span
              className={`material-symbols-outlined transition-transform duration-200 ${
                mobileMenuOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>
          {mobileMenuOpen && (
            <div className="flex flex-col gap-1 pt-3 border-t border-slate-100 mt-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={`p-2.5 flex items-center gap-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    activeSection === s.id
                      ? "bg-[#eff4ff] text-[#005985] font-bold"
                      : "text-[#40484f] hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop SideNav */}
        <aside className="hidden lg:flex flex-col sticky top-16 bg-[#f2f3ff] w-64 h-[calc(100vh-64px)] border-r border-[#c0c7d0]/50 shrink-0">
          <div className="p-6 border-b border-[#c0c7d0]/40">
            <h2 className="text-sm font-bold text-[#005985] mb-0.5">
              {isAm ? "የህግ ማዕከል" : "Legal Center"}
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

        {/* Main Content Canvas */}
        <main className="flex-1 bg-white p-6 md:p-10 lg:p-12 flex justify-center w-full">
          <div className="max-w-[720px] w-full flex flex-col gap-8">
            <header className="border-b border-[#c0c7d0]/40 pb-6">
              <h1 className="text-2xl md:text-4xl font-bold text-[#005985] mb-2 tracking-tight">
                {isAm ? "የአገልግሎት ውሎች እና ሁኔታዎች" : "Terms & Conditions"}
              </h1>
              <p className="text-xs md:text-sm text-[#50616b]">
                {isAm
                  ? "እባክዎ የኢቶስክ መድረክን ከመጠቀምዎ በፊት እነዚህን ውሎች በጥንቃቄ ያንብቡ። ለመጨረሻ ጊዜ የተሻሻለው፡ ጥቅምት 2023."
                  : "Please read these terms carefully before using the Ethosk platform. Last Updated: October 2023."}
              </p>
            </header>

            <article className="flex flex-col gap-10 text-xs md:text-sm text-[#131b2e] leading-relaxed">
              {/* Section 1: Introduction */}
              <section id="intro" className="scroll-mt-28 space-y-3">
                <h2 className="text-base md:text-lg font-bold text-[#005985] flex items-center gap-2">
                  <span className="bg-[#eff4ff] text-[#005985] rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <span>{isAm ? "መግቢያ" : "Introduction"}</span>
                </h2>
                <p>
                  {isAm
                    ? "ወደ ኢቶስክ እንኳን በደህና መጡ። እነዚህ የአገልግሎት ውሎች እና ሁኔታዎች በኢትዮጵያ ገበያ ውስጥ ለምርምርና መረጃ አሰባሰብ መድረካችንን፣ አገልግሎቶቻችንን እና መሣሪያዎቻችንን የመጠቀም መብትዎን ይገዛሉ። በመመዝገብ ወይም በመጠቀም ለእነዚህ ውሎች ተገዢ ለመሆን ተስማምተዋል።"
                    : "Welcome to Ethosk. These Terms & Conditions govern your access to and use of our platform, services, and tools for data collection and research within the Ethiopian market. By registering for, accessing, or using Ethosk, you agree to be bound by these Terms."}
                </p>
                <p>
                  {isAm
                    ? "ኢቶስክን ለአንድ ድርጅት ወይም ዩኒቨርሲቲ በመወከል የሚጠቀሙ ከሆነ፣ በዚያ ድርጅት ስም ለእነዚህ ውሎች ተስማምተዋል እናም ይህን ለማድረግ ሙሉ ስልጣን እንዳለዎት ያረጋግጣሉ።"
                    : "If you are using Ethosk on behalf of an organization or university, you agree to these Terms on behalf of that organization and represent that you have the authority to do so."}
                </p>
              </section>

              {/* Section 2: Data Privacy */}
              <section id="privacy" className="scroll-mt-28 space-y-3">
                <h2 className="text-base md:text-lg font-bold text-[#005985] flex items-center gap-2">
                  <span className="bg-[#eff4ff] text-[#005985] rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <span>{isAm ? "የመረጃ ግላዊነት" : "Data Privacy"}</span>
                </h2>
                <p>
                  {isAm
                    ? "ኢቶስክ ለመረጃ ግላዊነት ቅድሚያ ይሰጣል እንዲሁም ተፈፃሚ የሆኑ የውሂብ ጥበቃ ህጎችን ያከብራል። የእኛ የግላዊነት መመሪያ የግል መረጃዎን እንዴት እንደምንሰበስብ እና እንደምንጠብቅ በዝርዝር ያብራራል።"
                    : "Ethosk prioritizes data privacy and adheres to applicable data protection laws. Our Privacy Policy explains how we collect, use, and protect your personal data when you interact with our platform."}
                </p>
                <div className="bg-[#faf8ff] p-5 rounded-xl border border-[#c0c7d0]/60 space-y-1">
                  <h3 className="text-xs font-bold text-[#131b2e]">
                    {isAm ? "የውሂብ ማቀናበሪያ ስምምነት (DPA)" : "Data Processing Agreement"}
                  </h3>
                  <p className="text-xs text-[#50616b]">
                    {isAm
                      ? "የተወሰኑ የውሂብ አያያዝ ፕሮቶኮሎችን ለሚፈልጉ የኢንተርፕራይዝ ደንበኞች፣ ከእነዚህ መደበኛ ውሎች ጎን ለጎን የተለየ የውሂብ ማቀናበሪያ ስምምነት (DPA) ሊዘጋጅ ይችላል።"
                      : "For enterprise clients requiring specific data handling protocols, a separate Data Processing Agreement (DPA) may be required alongside these standard terms."}
                  </p>
                </div>
              </section>

              {/* Section 3: User Conduct */}
              <section id="conduct" className="scroll-mt-28 space-y-3">
                <h2 className="text-base md:text-lg font-bold text-[#005985] flex items-center gap-2">
                  <span className="bg-[#eff4ff] text-[#005985] rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <span>{isAm ? "የተጠቃሚ ስነ-ምግባር" : "User Conduct"}</span>
                </h2>
                <p>
                  {isAm
                    ? "ተጠቃሚዎች ኢቶስክን ለህጋዊ የምርምር እና የመረጃ አሰባሰብ ዓላማዎች ብቻ መጠቀም አለባቸው። የሚከተሉትን ላለማድረግ ተስማምተዋል፡"
                    : "Users must employ Ethosk strictly for lawful research and data collection purposes. You agree not to use the platform to:"}
                </p>
                <ul className="list-disc pl-5 space-y-2 text-[#50616b]">
                  <li>
                    {isAm
                      ? "ከተሳታፊዎች ግልጽ ስምምነት ሳያገኙ ሚስጥራዊ የግል መረጃዎችን መሰብሰብ።"
                      : "Collect sensitive personal information without explicit, informed consent from respondents."}
                  </li>
                  <li>
                    {isAm
                      ? "በጥናት አገናኞች አማካኝነት አደገኛ ኮዶችን ወይም ስፓም ማሰራጨት።"
                      : "Distribute malware, spam, or any malicious code through survey links."}
                  </li>
                  <li>
                    {isAm
                      ? "የመድረኩን የደህንነት ስርዓት ለማበላሸት ወይም ለመቀልበስ መሞከር።"
                      : "Attempt to reverse engineer, decompile, or otherwise compromise the platform's security architecture."}
                  </li>
                  <li>
                    {isAm
                      ? "በምርምር ሂደቱ ወቅት ሌላ ሰውን ወይም አካልን መምሰል ወይም ግንኙነትዎን በሐሰት መግለጽ።"
                      : "Impersonate any person or entity, or misrepresent your affiliation during the research process."}
                  </li>
                </ul>
              </section>

              {/* Section 4: Intellectual Property */}
              <section id="ip" className="scroll-mt-28 space-y-3">
                <h2 className="text-base md:text-lg font-bold text-[#005985] flex items-center gap-2">
                  <span className="bg-[#eff4ff] text-[#005985] rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <span>{isAm ? "አእምሯዊ ንብረት" : "Intellectual Property"}</span>
                </h2>
                <p>
                  {isAm
                    ? "የዲዛይን ስርዓትን፣ ስልተ-ቀመሮችን፣ የኮድ ቤዝ እና ብራንዲንግን ጨምሮ በኢቶስክ መድረክ ውስጥ ያሉ ሁሉም የአእምሯዊ ንብረት መብቶች የኢቶስክ ብቸኛ ንብረት ሆነው ይቀጥላሉ።"
                    : "All intellectual property rights in the Ethosk platform, including its design system, algorithms, codebase, and branding, remain the exclusive property of Ethosk."}
                </p>
                <p>
                  {isAm
                    ? "በተለዩ ጥናቶችዎ እና በምርምር ዘመቻዎችዎ የተገኘው መረጃ (Output Data) የእርስዎ ንብረት ነው፣ ይህም ለእነዚህ ውሎች ተገዢ ነው።"
                    : "Data generated through your specific surveys and research campaigns (the 'Output Data') belongs to you, subject to compliance with these terms."}
                </p>
              </section>

              {/* Section 5: Liability */}
              <section id="liability" className="scroll-mt-28 space-y-3">
                <h2 className="text-base md:text-lg font-bold text-[#005985] flex items-center gap-2">
                  <span className="bg-[#eff4ff] text-[#005985] rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
                    5
                  </span>
                  <span>{isAm ? "ተጠያቂነት እና ዋስትና" : "Liability & Warranties"}</span>
                </h2>
                <p>
                  {isAm
                    ? "ኢቶስክ አስተማማኝ እና የተረጋገጠ የመረጃ መሠረተ ልማት ያቀርባል፤ ይሁን እንጂ አገልግሎቶቹ 'እንደነበሩ' የቀረቡ ናቸው። በህግ እስከሚፈቀደው ድረስ፣ ኢቶስክ ለተዘዋዋሪ ወይም ለአጋጣሚ ጉዳቶች ተጠያቂ አይሆንም።"
                    : "Ethosk provides verified research infrastructure on an 'as-is' and 'as-available' basis. To the maximum extent permitted by law, Ethosk shall not be liable for indirect or consequential damages."}
                </p>
              </section>
            </article>

            {/* Bottom Support CTA */}
            <div className="mt-8 pt-6 border-t border-[#c0c7d0]/40 text-center">
              <p className="text-xs text-[#50616b] mb-3">
                {isAm ? "ስለ እነዚህ ውሎች ጥያቄዎች አሉዎት?" : "Have questions about these terms?"}
              </p>
              <Link
                to="/contact"
                className="inline-block bg-white border border-[#c0c7d0] hover:border-[#005985] hover:text-[#005985] text-[#131b2e] px-6 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                {isAm ? "የድጋፍ ቡድንን ያነጋግሩ" : "Contact Support"}
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
            <Link to="/privacy" className="hover:text-[#005985] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="font-bold text-[#005985]">
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
