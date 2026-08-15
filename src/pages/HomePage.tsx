import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function HomePage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="w-full text-primary">
      {/* ── 1 & 2: Hero & How It Works (Unified Continuous Sky Blue Flow) ── */}
      <div className="relative w-full overflow-visible">
        {/* Full Hero ambient blue glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[65%] w-full z-0"
          style={{
            background:
              "radial-gradient(ellipse 95% 75% at 50% 40%, rgba(175, 225, 255, 0.65) 0%, rgba(195, 235, 255, 0.45) 55%, transparent 100%)",
            filter: "blur(40px)",
          }}
        />

        {/* Seamless left-side stream flowing down strictly through the left of How It Works */}
        <div
          className="pointer-events-none absolute left-[-5%] top-[35%] w-[58vw] h-[70%] z-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(175, 225, 255, 0.65) 0%, rgba(160, 215, 255, 0.55) 45%, rgba(205, 238, 255, 0.3) 80%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, transparent 85%)",
            WebkitMaskImage:
              "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, transparent 85%)",
            filter: "blur(45px)",
          }}
        />

        {/* ── 1. Hero Section ── */}
        <section className="pt-40 pb-24 px-6 md:px-12 w-full relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            {/* Left Side */}
            <div className="flex-1 flex flex-col gap-6 reveal active">
              <h1 className="font-display-lg text-primary text-5xl md:text-6xl lg:text-7xl">
                {isAm ? "አስተማማኝ እና የተረጋገጠ የጥናት መድረክ" : "Trustworthy, Verified Survey Platform"}
              </h1>
              <p className="text-xl text-on-surface-variant max-w-xl mt-2 leading-relaxed font-body-lg">
                {isAm
                  ? "ከተረጋገጡ ኢትዮጵያውያን ተሳታፊዎች ጋር አስተማማኝ ምርምር ያካሂዱ"
                  : "Run trusted research with verified Ethiopian respondents"}
              </p>
              <div className="flex flex-wrap gap-4 pt-6">
                <Link to="/signup/researcher">
                  <button
                    className="flex items-center justify-between gap-6 px-8 py-4 bg-primary-container text-white font-semibold rounded-[4px] shadow-md hover:bg-primary transition-all min-w-[220px] active:scale-95 cursor-pointer"
                    type="button"
                  >
                    <span className="text-lg">{isAm ? "ጥናት ጀምር" : "Start Survey"}</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                </Link>
                <Link to="/signup/respondent">
                  <button
                    className="px-8 py-4 border-2 border-primary-container text-primary-container font-semibold rounded-[4px] hover:bg-primary-container/5 transition-all min-w-[220px] text-center active:scale-95 cursor-pointer"
                    type="button"
                  >
                    {isAm ? "ምላሽ መስጠት ጀምር" : "Start Response"}
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex-1 w-full max-w-2xl relative reveal delay-200 active">
              <div className="glass-silk rounded-2xl overflow-hidden w-full aspect-[4/3] flex items-center justify-center relative z-0 border-white/60">
                <img
                  alt="Premium abstract data flow visualization"
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700 mix-blend-multiply"
                  src="/hero_cards.png"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Three Steps Section ── */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center relative scroll-mt-28 z-10" id="how">
          <div className="text-center mb-16">
            <span className="text-[11px] font-normal text-[#004162] mb-4 inline-block bg-white/80 backdrop-blur-xl border border-slate-200/60 w-max mx-auto px-3.5 py-1 rounded-full shadow-2xs uppercase tracking-wider font-sans">
              {isAm ? "እንዴት እንደሚሰራ" : "HOW IT WORKS"}
            </span>
            <h2 className="text-4xl md:text-5xl font-headline-lg text-primary">
              {isAm
                ? "ከጥያቄ እስከ አስተማማኝ መረጃ በሶስት ደረጃዎች"
                : "Three steps from question to defensible data"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
            {/* Step 1 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                  <span className="material-symbols-outlined text-xl font-bold">tune</span>
                </div>
                <span className="text-primary/20 font-display-lg text-4xl">01</span>
              </div>
              <h3 className="font-title-md text-primary">
                {isAm ? "የጥናትዎን ተሳታፊዎች ያብራሩ" : "Describe your sample"}
              </h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {isAm
                  ? "ጥናትዎ የሚያስፈልገውን የስነ-ህዝብ መረጃ ይግለጹ። የተጣጣሙ ቁጥር በቀጥታ ይዘመናል፣ እና ዝቅተኛ ናሙና ከመላክዎ በፊት ያስጠነቅቀዎታል::"
                  : "Set the demographics your study needs. The matched count updates live, and warns you before you send into a sample too small to support a finding."}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                  <span className="material-symbols-outlined text-xl pl-0.5 font-bold">send</span>
                </div>
                <span className="text-primary/20 font-display-lg text-4xl">02</span>
              </div>
              <h3 className="font-title-md text-primary">
                {isAm ? "ከተጣጣሙ ተሳታፊዎች ጋር ያገናኙ" : "Send to matched respondents"}
              </h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {isAm
                  ? "መስፈርቶችዎን የሚያሟሉ ተሳታፊዎች ብቻ ይጋበዛሉ። በእንግሊዝኛ ይፃፉ እና በአንድ ክሊክ ወደ አማርኛ ወይም አፋን ኦሮሞ ይተርጉሙ::"
                : "Only respondents who actually meet your filters are invited. Write in English and localise to Amharic or Afan Oromo in a click."}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                  <span className="material-symbols-outlined text-xl font-bold">insights</span>
                </div>
                <span className="text-primary/20 font-display-lg text-4xl">03</span>
              </div>
              <h3 className="font-title-md text-primary">
                {isAm ? "አስተማማኝ ውጤቶችን ያግኙ" : "Read results you can defend"}
              </h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {isAm
                  ? "እያንዳንዱ ምላሽ አስቀድሞ ከተተገበሩ የጥራት ፍተሻዎች ጋር ይደርሳል፣ ስለዚህ ትንተና ከመጀመርዎ በፊት በየትኛው ማመን እንዳለቦት ያያሉ።"
                  : "Every response arrives with quality checks already applied, so you can see which ones to trust before you start analysing."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── 3. Features Section ── */}
      <section className="py-24 px-6 md:px-12 w-full relative scroll-mt-28" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[11px] font-normal text-[#004162] mb-4 inline-block bg-white/80 backdrop-blur-xl border border-slate-200/60 w-max mx-auto px-3.5 py-1 rounded-full shadow-2xs uppercase tracking-wider font-sans">
              {isAm ? "ባህሪያት" : "FEATURES"}
            </span>
            <h2 className="text-4xl md:text-5xl font-headline-lg text-primary mb-4">
              {isAm
                ? "ለተመራማሪዎች ዘመናዊ መሣሪያዎች። ለተሳታፊዎች ምቹ ተሞክሮ።"
                : "Smarter tools for researchers. Seamless experience for respondents."}
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto font-body-lg">
              {isAm
                ? "አስተማማኝ የምርምር ፓነሎችን በአንድ ወጥ መድረክ ለመገንባት፣ ለመጀመር እና ለመተንተን የሚያስፈልጉዎት ነገሮች በሙሉ::"
                : "Everything you need to build, launch, and analyze defensible research panels in one unified platform."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl font-bold text-primary-container">spa</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-title-md text-primary-container">
                    {isAm ? "ጥናቶችን በደቂቃዎች ውስጥ ያመንጩ" : "Generate studies in seconds"}
                  </h3>
                  <span className="bg-primary-fixed/20 text-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Pro
                  </span>
                </div>
                <p className="font-body-md text-on-surface-variant">
                  {isAm
                    ? "በእጅ መፃፍን ያስቀሩ። የጥናት ርዕስዎን ብቻ ይግለጹ እና AI ወዲያውኑ የተሟላ እና የተስተካከለ የጥያቄ መዋቅር ያዘጋጅልዎታል::"
                    : "Bypass manual entry. Simply describe your study topic and let the AI Survey Generator draft a complete, optimized question schema instantly."}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl font-bold text-primary-container">forum</span>
              </div>
              <div>
                <h3 className="font-title-md text-primary-container">
                  {isAm ? "በውይይት መልክ የሚቀርብ AI ጥናት" : "Conversational AI delivery"}
                </h3>
                <p className="font-body-md text-on-surface-variant">
                  {isAm
                    ? "ጥናቶችን በቀጥታ መረጃ በሚሰበስቡ በይነተገናኝ የቻት ጥናቶች ያካሂዱ። ተሳትፎን ለማሳደግ የአማርኛ፣ አፋን ኦሮሞ እና የእንግሊዝኛ ድጋፍን ያካትታል::"
                    : "Deploy studies as AI-driven chat surveys that extract structured data in real-time. Includes adaptive native language support for Amharic, Afaan Oromo, and English to maximize engagement."}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl font-bold text-primary-container">fingerprint</span>
              </div>
              <div>
                <h3 className="font-title-md text-primary-container">
                  {isAm ? "ጥብቅ የተረጋገጠ የተሳታፊዎች ስብስብ" : "A strictly verified respondent pool"}
                </h3>
                <p className="font-body-md text-on-surface-variant">
                  {isAm
                    ? "የመረጃዎን ጥራት ይጠብቁ። ያልተረጋገጡ ተጠቃሚዎች ከጥናት ተሳታፊዎች በነባሪ ይገለላሉ። ደረጃ 1 እና ደረጃ 2 በፋይዳ ብሔራዊ መታወቂያ እና በተቋም ማረጋገጫ የተገደቡ ናቸው::"
                    : "Protect your data integrity. Unverified users are completely excluded from matching pools by default. Tier 1 and Tier 2 access is strictly gated by Fayda National ID and institutional verification."}
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl font-bold text-primary-container">bar_chart_4_bars</span>
              </div>
              <div>
                <h3 className="font-title-md text-primary-container">
                  {isAm ? "ፈጣን ትንታኔዎች እና የአመራር ማጠቃለያዎች" : "Instant insights & executive summaries"}
                </h3>
                <p className="font-body-md text-on-surface-variant">
                  {isAm
                    ? "ከጥሬ መረጃ ወደ ዝግጁ ግኝቶች ይሸጋገሩ። የስሜት ትንተና፣ የአዝማሚያ ማጠቃለያዎች እና ዋና ዋና ግኝቶችን ከዳሽቦርድዎ በቀጥታ ያመንጩ::"
                    : "Move from raw data to ready-to-present findings. Automatically generate sentiment analysis, trend summaries, and 3-bullet executive findings directly from your dashboard."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 & 5: Verification & Pricing (Seamless Right-Side Ambient Blue Stream) ── */}
      <div className="relative w-full overflow-visible">
        {/* Soft, feathered ambient blue stream: Fades softly from top, stays bright at the bottom */}
        <div
          className="pointer-events-none absolute right-[-5%] top-[-8%] w-[62vw] lg:w-[55vw] h-[108%] z-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(220, 240, 255, 0.35) 8%, rgba(160, 215, 255, 0.75) 20%, rgba(135, 205, 255, 0.75) 50%, rgba(150, 215, 255, 0.7) 75%, rgba(170, 225, 255, 0.65) 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 18%, rgba(0,0,0,1) 48%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 18%, rgba(0,0,0,1) 48%)",
            filter: "blur(50px)",
          }}
        />

        {/* ── 4. Verification Tiers (Exact Stitch Screen) ── */}
        <section className="relative w-full py-24 scroll-mt-28 z-10" id="verification">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Header (On White Background) */}
            <div className="lg:col-span-5">
              <span className="text-[11px] font-normal text-[#004162] bg-white/80 backdrop-blur-xl border border-slate-200/60 px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-6 shadow-2xs font-sans">
                {isAm ? "ማረጋገጫ" : "VERIFICATION"}
              </span>
              <h2 className="text-4xl md:text-[46px] font-sans font-normal text-[#003450] mb-6 leading-[1.12] tracking-tight">
                {isAm ? (
                  "ለጥናትዎ የሚያስፈልገውን የማረጋገጫ ደረጃ ይምረጡ"
                ) : (
                  <>
                    You choose how
                    <br />
                    much proof your
                    <br />
                    study needs
                  </>
                )}
              </h2>
              <p className="text-[#506373] text-sm md:text-base leading-relaxed mb-8 max-w-md font-sans font-normal">
                {isAm
                  ? "የጥናት ናሙናዎን ሲገነቡ ዝቅተኛውን የተሳታፊ ማረጋገጫ ደረጃ ይወስኑ። እምነትዎን ያሳድጉ እና የተደጋገሙ ወይም የሀሰት ምላሾችን ያስወግዱ::"
                  : "Set minimum respondent verification tiers when building your study pool. Scale confidence and filter out duplicate or fraudulent responses instantly."}
              </p>
              <Link className="inline-flex items-center gap-1.5 text-[#00456d] font-semibold text-sm hover:gap-2.5 transition-all group font-sans" to="/signup/researcher">
                <span>{isAm ? "ማረጋገጫ እንዴት እንደሚሰራ ይወቁ" : "Learn how verification works"}</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Right Column: Connected Timeline Stack of Cards (On Blue Gradient) */}
            <div className="lg:col-span-7 flex flex-col gap-6 relative font-sans">
              {/* Continuous Vertical Timeline Line */}
              <div className="absolute left-[38px] top-6 bottom-6 w-[1.5px] bg-[#96c7f5] hidden md:block -z-0" />

              {/* Card 1: Tier 0 (Basic Registration - Completely Transparent, Showing Blue Background) */}
              <div className="bg-transparent border border-white/70 rounded-2xl p-6 flex items-start gap-5 relative transition-all hover:bg-white/10">
                <div className="w-11 h-11 rounded-xl bg-white/90 border border-white/80 text-slate-400 flex items-center justify-center font-normal text-sm shrink-0 shadow-2xs z-10">
                  0
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h4 className="font-normal text-sm text-[#253f52]">
                      {isAm ? "ደረጃ 0: መደበኛ ምዝገባ" : "Tier 0: Basic Registration"}
                    </h4>
                    <span className="text-[10px] font-normal bg-white/80 text-slate-500 px-2.5 py-0.5 rounded-full border border-white/80 shadow-2xs">
                      {isAm ? "ከተለመዱ ፓነሎች የተገለለ" : "Excluded from Standard Pools"}
                    </span>
                  </div>
                  <p className="text-xs text-[#4b6375] leading-[1.6] font-normal max-w-xl">
                    {isAm ? (
                      "በኢሜይል ማረጋገጫ የሚደረግ መለያ። ያልተረጋገጡ ተጠቃሚዎች ከሚከፈልባቸው የተመራማሪ ጥናቶች በነባሪ ይገለላሉ::"
                    ) : (
                      <>
                        Basic account setup via email confirmation. Used exclusively for
                        <br className="hidden md:inline" /> onboarding and initial profiling. Unverified users are excluded from
                        <br className="hidden md:inline" /> paid researcher matching pools by default.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Card 2: Tier 1 (Identity Guaranteed - Matches Left Side Page Color #f8f9ff) */}
              <div className="bg-[#f8f9ff] border border-[#cbe1f7] rounded-2xl p-7 flex items-start gap-5 relative shadow-[0_20px_50px_rgba(0,69,109,0.12)] ring-1 ring-slate-900/5 z-20 md:-mx-4 transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-[#004a75] text-white flex items-center justify-center shrink-0 shadow-xs z-10">
                  <span className="material-symbols-outlined text-[22px]">verified</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h4 className="font-normal text-base text-[#003450]">
                      {isAm ? "ደረጃ 1: ማንነት የተረጋገጠ" : "Tier 1: Identity Guaranteed"}
                    </h4>
                    <span className="text-[10px] font-semibold bg-[#004a75] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                      {isAm ? "በፋይዳ የተረጋገጠ" : "Fayda ID Verified"}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-[#506373] leading-[1.6] mt-1 font-normal max-w-xl">
                    {isAm ? (
                      "በብሔራዊ የፋይዳ መታወቂያ ስርዓት (eSignet) የተረጋገጠ። 100% ነጠላ መለያ ያላቸው እውነተኛ ሰዎችን ያረጋግጣል::"
                    ) : (
                      <>
                        Verified against the national Fayda ID system (eSignet). Guarantees
                        <br className="hidden md:inline" /> 100% unique, single-account real human respondents with zero
                        <br className="hidden md:inline" /> duplicate submission risk.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Card 3: Tier 2 (Attribute & Institution Verified - Completely Transparent, Showing Blue Background) */}
              <div className="bg-transparent border border-white/70 rounded-2xl p-6 flex items-start gap-5 relative transition-all hover:bg-white/10">
                <div className="w-11 h-11 rounded-xl bg-white/90 border border-white/80 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs z-10">
                  <span className="material-symbols-outlined text-[22px] text-slate-500">workspace_premium</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h4 className="font-normal text-sm text-[#253f52]">
                      {isAm ? "ደረጃ 2: ተቋማዊ ማረጋገጫ" : "Tier 2: Attribute & Institution Verified"}
                    </h4>
                    <span className="text-[10px] font-normal bg-white/80 text-[#4f606e] px-2.5 py-0.5 rounded-full border border-white/80 shadow-2xs">
                      {isAm ? "ከፍተኛ እምነት" : "Highest Trust"}
                    </span>
                  </div>
                  <p className="text-xs text-[#4b6375] leading-[1.6] font-normal max-w-xl">
                    {isAm ? (
                      "በተቋም ኢሜይል እና በማስረጃ ሰነዶች (የተማሪ ወይም የሰራተኛ መታወቂያ) የተረጋገጠ:: ለተለዩ አካዳሚክ እና ሙያዊ ፓነሎች የታለመ መዳረሻ::"
                    ) : (
                      <>
                        Secondary verification via institutional email OTP and verified
                        <br className="hidden md:inline" /> credentials (student IDs, employee badges). Targeted access to
                        <br className="hidden md:inline" /> specialized academic, corporate, and niche panels.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Pricing Section ── */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full scroll-mt-28 relative z-10" id="pricing">
          <div className="text-center mb-16 relative z-20">
            <span className="text-[11px] font-normal text-[#004162] bg-white/80 backdrop-blur-xl border border-slate-200/60 px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-4 shadow-2xs font-sans">
              {isAm ? "የዋጋ ዝርዝር" : "PRICING"}
            </span>
            <h2 className="text-4xl md:text-5xl font-sans font-normal text-[#003450] mb-4 tracking-tight">
              {isAm
                ? "ለአስተማማኝ ምርምር ግልጽ እና ቀላል የዋጋ እቅዶች"
                : "Simple, transparent plans for defensible research"}
            </h2>
            <p className="text-[#506373] max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-sans font-normal">
              {isAm
                ? "ጥናቶችን በነፃ ይገንቡ እና ይለጥፉ። በ AI የሚመራ የጥናትንድፍ፣ አውቶማቲክ ማሻሻያ እና የትንታኔ ማጠቃለያዎችን ለማግኘት ያሻሽሉ::"
                : "Build and post surveys for free. Upgrade to unlock AI-driven survey design, automated optimization, and executive insights."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-stretch relative z-20">
            {/* Free Plan */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 flex flex-col border border-white/80 shadow-xs">
              <div className="mb-8">
                <h3 className="font-title-md text-primary mb-2">{isAm ? "ነፃ" : "Free"}</h3>
                <p className="font-body-md text-on-surface-variant mb-4">
                  {isAm ? "ለግል ተመራማሪዎች" : "For individual researchers"}
                </p>
                <div className="text-3xl font-display-lg text-primary">
                  0 ETB<span className="text-sm font-body-md text-on-surface-variant/60">{isAm ? "/በወር" : "/mo"}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "በእጅ እና በሰነድ ጥያቄዎችን መጫን" : "Manual & Document Import"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "ሙሉ የስነ-ህዝብ ማጣሪያዎች" : "Full demographic targeting"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "የደረጃ 1 እና 2 ተሳታፊዎች መዳረሻ" : "Tier 1 & 2 pool access"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "ጥሬ መረጃን ኤክስፖርት ማድረግ" : "Raw data export"}
                </li>
              </ul>
              <Link to="/signup/researcher">
                <button
                  className="w-full py-3 rounded-[4px] bg-primary-container text-white font-bold hover:bg-primary transition-all shadow-md cursor-pointer"
                  type="button"
                >
                  {isAm ? "በነፃ ይጀምሩ" : "Get Started Free"}
                </button>
              </Link>
            </div>

            {/* Pro Plan (Recommended - Blue Flowing Inside Middle Card) */}
            <div
              className="bg-transparent rounded-2xl p-8 flex flex-col relative shadow-2xl transform lg:scale-105 z-10 backdrop-blur-xs transition-all hover:bg-white/10"
              style={{
                borderColor: "#004162",
                borderWidth: "2px",
                borderStyle: "solid",
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#004162] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ring-2 ring-white">
                {isAm ? "ተመራጭ" : "RECOMMENDED"}
              </div>
              <div className="mb-8">
                <h3 className="font-title-md text-primary mb-2">{isAm ? "ፕሮ" : "Pro"}</h3>
                <p className="font-body-md text-on-surface-variant mb-4">
                  {isAm ? "ለገበያ ተንታኞች" : "For market analysts"}
                </p>
                <div className="text-3xl font-display-lg text-primary">
                  2,500 ETB<span className="text-sm font-body-md text-on-surface-variant/60">{isAm ? "/በወር" : "/mo"}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "በነፃ ውስጥ ያሉ ሁሉ +" : "All in Free +"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "የ AI ጥናት አመንጪ" : "AI Survey Generator"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "የጥያቄዎች AI ማሻሻያ" : "AI Question Optimizer"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "አውቶማቲክ የአመራር ማጠቃለያዎች" : "Automated AI Executive Summaries"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "የስሜት ትንተና" : "AI Sentiment analysis"}
                </li>
              </ul>
              <Link to="/signup/researcher">
                <button
                  className="w-full py-3 rounded-[4px] bg-[#004162] text-white font-bold shadow-md hover:bg-primary transition-all cursor-pointer"
                  type="button"
                >
                  {isAm ? "ወደ ፕሮ ያሻሽሉ" : "Upgrade to Pro"}
                </button>
              </Link>
            </div>

            {/* Enterprise Plan (Filled with ambient blue inside the box) */}
            <div className="bg-transparent rounded-2xl p-8 flex flex-col border border-white/70 backdrop-blur-xs transition-all hover:bg-white/10">
              <div className="mb-8">
                <h3 className="font-title-md text-primary mb-2">{isAm ? "ኢንተርፕራይዝ" : "Enterprise"}</h3>
                <p className="font-body-md text-on-surface-variant mb-4">
                  {isAm ? "ለትላልቅ ተቋማት" : "For institutional teams"}
                </p>
                <div className="text-3xl font-display-lg text-primary">{isAm ? "በስምምነት" : "Custom"}</div>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "በፕሮ ውስጥ ያሉ ሁሉ +" : "All in Pro +"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "ባለብዙ መቀመጫ የስራ ቦታ" : "Multi-seat workspace"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "ብጁ የፓነል ምርጫ" : "Custom niche panel sourcing"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "ቀጥታ ደረሰኝ እና ክፍያ" : "Direct invoicing"}
                </li>
                <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-surface-tint text-lg">check_circle</span>
                  {isAm ? "የተሰጠ የድጋፍ አገልግሎት (SLA)" : "Dedicated support & SLA"}
                </li>
              </ul>
              <a href="mailto:contact@ethosk.org">
                <button
                  className="w-full py-3.5 rounded-[4px] bg-[#004a75] text-white font-bold hover:bg-primary transition-all shadow-md cursor-pointer"
                  type="button"
                >
                  {isAm ? "ያነጋግሩን" : "Contact Sales"}
                </button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
