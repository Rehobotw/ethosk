import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

// ── 1. No Search Results Page (Stitch Screen e048f93bddff46a984fb0bf010bd1963) ──
export function NoSearchResultsPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 py-16">
        <div className="max-w-[680px] w-full flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-[#eaedff] flex items-center justify-center mb-6 text-[#50616b]">
            <span className="material-symbols-outlined text-[48px]">search_off</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-2 tracking-tight">
            {isAm ? "ምንም የተዛመዱ ውጤቶች አልተገኙም" : "No matching results"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] max-w-md mx-auto mb-8 leading-relaxed">
            {isAm
              ? "ከፍለጋዎ ጋር የሚዛመድ ምንም ነገር ማግኘት አልቻልንም። የሚፈልጉትን ለማግኘት ማጣሪያዎችዎን ወይም የፍለጋ ቃላቶችዎን ለማስተካከል ይሞክሩ።"
              : "We couldn't find anything matching your search. Try adjusting your filters or search terms to find what you're looking for."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/inbox"
              className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs md:text-sm font-bold transition-opacity hover:opacity-90 shadow-xs"
            >
              {isAm ? "ማጣሪያዎችን አፅዳ" : "Clear Filters"}
            </Link>
            <Link
              to="/inbox"
              className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-white text-[#131b2e] border border-[#c0c7d0] text-xs md:text-sm font-bold transition-colors hover:bg-slate-50"
            >
              {isAm ? "ሌላ ፍለጋ ይሞክሩ" : "Try Another Search"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── 2. Survey Not Found Page (Stitch Screen 44afc24e91cc474e8b0663e672386f34) ──
export function SurveyNotFoundPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">
            Ethosk
          </Link>
          <Link to="/inbox" className="text-xs font-semibold text-[#50616b] hover:text-[#005985]">
            {isAm ? "ወደ ጥናቶች" : "Surveys"}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[680px] bg-white rounded-2xl border border-[#c0c7d0]/60 p-8 md:p-12 flex flex-col items-center text-center shadow-xs">
          <div className="w-24 h-24 rounded-full bg-[#eaedff] flex items-center justify-center mb-6 text-[#005985]">
            <span className="material-symbols-outlined text-[48px]">find_in_page</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ጥናቱ አይገኝም" : "Survey Unavailable"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-[480px] leading-relaxed">
            {isAm
              ? "እየፈለጉት ያለው ጥናት ማግኘት አልተቻለም። ጊዜው አልፎበት፣ ተሰርዞ ወይም አገናኙ የተሳሳተ ሊሆን ይችላል።"
              : "We couldn't find the survey you're looking for. It may have expired, been removed, or the link might be incorrect."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/inbox"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs md:text-sm font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity shadow-xs text-center"
            >
              {isAm ? "የሚገኙ ጥናቶችን ይመልከቱ" : "Browse Available Surveys"}
            </Link>
            <Link
              to="/dashboard"
              className="bg-white border border-[#c0c7d0] text-[#131b2e] text-xs md:text-sm font-bold py-3 px-6 rounded-lg hover:border-[#005985] hover:text-[#005985] transition-colors text-center"
            >
              {isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk. High-Trust Data Infrastructure.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#005985]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#005985]">Terms of Service</Link>
            <Link to="/help" className="hover:text-[#005985]">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 3. Survey Closed Page (Stitch Screen e5326e0d9f8a4b7ba1ba1c813e8ce9ea) ──
export function SurveyClosedPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const alternativeSurveys = [
    {
      id: "s1",
      title: isAm ? "የአዲስ አበባ የከተማ ተบริካቾች ልምድ፡ Q3 ትንተና" : "Consumer Habits in Urban Addis Ababa: Q3 Analysis",
      reward: "45 ETB",
      duration: "5 mins",
    },
    {
      id: "s2",
      title: isAm ? "የሞባይል ባንክ አጠቃቀም እና የተጠቃሚዎች ልምድ" : "Mobile Banking Adoption Rates and User Experience",
      reward: "60 ETB",
      duration: "8 mins",
    },
  ];

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">Ethosk</Link>
          <Link to="/inbox" className="text-xs font-semibold text-[#50616b] hover:text-[#005985]">
            {isAm ? "ወደ ጥናቶች" : "Surveys"}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 md:px-8 w-full max-w-[680px] mx-auto">
        <div className="bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-10 flex flex-col items-center text-center w-full mb-10 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#eff4ff] flex items-center justify-center mb-5 text-[#50616b]">
            <span className="material-symbols-outlined text-[32px]">lock_clock</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-2 tracking-tight">
            {isAm ? "ጥናቱ ተዘጋቷል" : "Survey Closed"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-md leading-relaxed">
            {isAm
              ? "ይህ ጥናት ምላሾችን መቀበል አቁሟል። የተፈለገውን የተሳታፊዎች ቁጥር አጠናቆ ወይም የጊዜ ገደቡ አልፎ ሊሆን ይችላል።"
              : "This survey is no longer accepting responses. It may have reached its target number of participants or the deadline has passed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link
              to="/inbox"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs md:text-sm font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-xs flex items-center justify-center gap-2 min-w-[160px]"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{isAm ? "ሌሎች ጥናቶችን ይመልከቱ" : "Browse Other Surveys"}</span>
            </Link>
            <Link
              to="/dashboard"
              className="bg-white text-[#131b2e] text-xs md:text-sm font-bold px-6 py-3 rounded-lg border border-[#c0c7d0] hover:bg-slate-50 transition-colors flex items-center justify-center min-w-[160px]"
            >
              {isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}
            </Link>
          </div>
        </div>

        {/* Recommended Alternatives Section */}
        <div className="w-full">
          <h2 className="text-sm font-bold text-[#131b2e] mb-4">
            {isAm ? "ሊወዱዋቸው የሚችሉ ሌሎች ጥናቶች" : "Other surveys you might be interested in"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {alternativeSurveys.map((alt) => (
              <Link
                key={alt.id}
                to="/inbox"
                className="block bg-white border border-[#c0c7d0]/60 rounded-xl p-4 hover:border-[#005985] transition-colors group shadow-xs"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs md:text-sm font-bold text-[#131b2e] group-hover:text-[#005985] transition-colors line-clamp-2">
                    {alt.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-[#eff4ff] px-2.5 py-1 rounded text-[11px] font-bold text-[#005985]">
                      <span className="material-symbols-outlined text-[14px]">payments</span>
                      <span>{alt.reward}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded text-[11px] text-[#50616b]">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{alt.duration}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk. High-Trust Data Infrastructure.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#005985]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#005985]">Terms of Service</Link>
            <Link to="/help" className="hover:text-[#005985]">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 4. Survey Paused Page (Stitch Screen 5d1fd75a424c4841858141cd7abf75a8) ──
export function SurveyPausedPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">Ethosk</Link>
          <Link to="/inbox" className="text-xs font-semibold text-[#50616b] hover:text-[#005985]">
            {isAm ? "ወደ ጥናቶች" : "Surveys"}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[680px] bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#eaedff] mx-auto flex items-center justify-center mb-6 text-[#50616b]">
            <span className="material-symbols-outlined text-[32px]">pause_circle</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ጥናቱ በጊዜያዊነት ቆሟል" : "Survey Temporarily Paused"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-lg mx-auto leading-relaxed">
            {isAm
              ? "በዚህ ጥናት ላይ ተሳትፎ በጊዜያዊነት አይገኝም። ይህም በተመራማሪው በኩል በተደረገ ጊዜያዊ ግምገማ ወይም እረፍት ምክንያት ነው። እባክዎ ቆየት ብለው ይፈትሹ።"
              : "Participation in this survey is currently unavailable. This is usually due to a temporary review or a scheduled pause by the researcher. Please check back later or explore other active opportunities."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/inbox"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-bold text-xs md:text-sm py-3 px-6 rounded-lg w-full sm:w-auto hover:opacity-90 transition-opacity text-center shadow-xs"
            >
              {isAm ? "የሚገኙ ጥናቶችን ይመልከቱ" : "Browse Available Surveys"}
            </Link>
            <Link
              to="/dashboard"
              className="bg-white border border-[#c0c7d0] text-[#131b2e] font-bold text-xs md:text-sm py-3 px-6 rounded-lg w-full sm:w-auto hover:bg-slate-50 transition-colors text-center"
            >
              {isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk. High-Trust Data Infrastructure.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#005985]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#005985]">Terms of Service</Link>
            <Link to="/help" className="hover:text-[#005985]">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 5. Survey Not Eligible Page (Stitch Screen db1a52de570a41f19b5455dba6478306) ──
export function SurveyNotEligiblePage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">Ethosk</Link>
          <Link to="/inbox" className="text-xs font-semibold text-[#50616b] hover:text-[#005985]">
            {isAm ? "ወደ ጥናቶች" : "Surveys"}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 max-w-[680px] w-full flex flex-col items-center text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#eaedff] flex items-center justify-center mb-6 text-[#50616b]">
            <span className="material-symbols-outlined text-4xl">person_search</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ለዚህ ጥናት ብቁ አይደሉም" : "Not Eligible for This Survey"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-md mx-auto leading-relaxed">
            {isAm
              ? "በጥናቱ መስፈርቶች መሰረት፣ በዚህ ጊዜ ለመሳተፍ ብቁ አይደሉም። ተመራማሪዎች የመረጃውን ተወካይነት ለማረጋገጥ የተወሰኑ የስነ-ህዝብ ቡድኖችን ይፈልጋሉ።"
              : "Based on the current requirements for this study, you aren't eligible to participate at this time. Researchers often look for specific demographic groups or professional backgrounds to ensure data representativeness."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/inbox"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white rounded-lg px-6 py-3 font-bold text-xs md:text-sm hover:opacity-90 transition-opacity w-full sm:w-auto text-center shadow-xs"
            >
              {isAm ? "ሌሎች ጥናቶችን ይመልከቱ" : "Browse Other Surveys"}
            </Link>
            <Link
              to="/dashboard"
              className="bg-white border border-[#c0c7d0] text-[#131b2e] rounded-lg px-6 py-3 font-bold text-xs md:text-sm hover:bg-slate-50 transition-all w-full sm:w-auto text-center"
            >
              {isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk. High-Trust Data Infrastructure.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#005985]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#005985]">Terms of Service</Link>
            <Link to="/help" className="hover:text-[#005985]">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 6. Survey Already Completed Page (Stitch Screen 5f15e3afaf074feb89afa1f77ac1b6f3) ──
export function SurveyCompletedPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">Ethosk</Link>
          <Link to="/wallet" className="text-xs font-semibold text-[#005985] hover:underline">
            {isAm ? "ዋሌት" : "Wallet"}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[480px] bg-white border border-[#c0c7d0]/60 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center shadow-xs">
          <div className="mb-6">
            <span
              className="material-symbols-outlined text-[#005985] text-5xl md:text-6xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#131b2e] mb-2 tracking-tight">
            {isAm ? "ጥናቱ ቀደም ብሎ ተጠናቋል" : "Survey Already Completed"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-6 leading-relaxed">
            {isAm
              ? "በዚህ ጥናት ላይ ቀደም ብለው ተሳታፊ ሆነዋል። የመረጃ ታማኝነትን ለመጠበቅ ድጋሜ መልስ መስጠት አይፈቀድም።"
              : "You have already participated in this study. To ensure data integrity, duplicate submissions are not allowed."}
          </p>

          <div className="w-full bg-[#faf8ff] border border-[#c0c7d0]/60 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs text-[#50616b]">
                {isAm ? "የተጠናቀቀበት ቀን፡" : "Completion Date:"}
              </span>
              <span className="text-xs font-bold text-[#131b2e]">October 24, 2023</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-[#50616b]">
                {isAm ? "የክፍያ ሁኔታ፡" : "Reward Status:"}
              </span>
              <span className="text-xs font-bold text-[#005985]">50 ETB — Credited to Wallet</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <Link
              to="/inbox"
              className="w-full py-3 px-4 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs md:text-sm font-bold rounded-lg hover:opacity-90 transition-opacity text-center shadow-xs"
            >
              {isAm ? "ሌሎች ጥናቶችን ይመልከቱ" : "Browse Other Surveys"}
            </Link>
            <Link
              to="/wallet"
              className="w-full py-3 px-4 bg-white border border-[#c0c7d0] text-[#131b2e] text-xs md:text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors text-center"
            >
              {isAm ? "ገቢዎችን ይመልከቱ" : "View Earnings"}
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk Ethiopia. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#005985]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#005985]">Terms of Service</Link>
            <Link to="/help" className="hover:text-[#005985]">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 7. Survey Submission Error / Recovery Page (Stitch Screen 888f7aa703b54027acd7dcde112933af) ──
export function SurveySubmissionErrorPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">Ethosk</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 py-12">
        <div className="w-full max-w-[680px] bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 text-center shadow-xs">
          <div className="w-20 h-20 mx-auto bg-[#eff4ff] rounded-full flex items-center justify-center mb-4 text-[#005985]">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cloud_off
            </span>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#cbe6ff] text-[#004b71] text-xs font-bold px-3 py-1 rounded.full mb-6">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{isAm ? "የሂደት ሁኔታ፡ በስልክዎ/ኮምፒተርዎ ተቀምጧል" : "Progress Status: Saved Locally"}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ምላሽ ማቅረብ ተቋርጧል" : "Submission Interrupted"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-3 max-w-md mx-auto leading-relaxed">
            {isAm
              ? "ምላሾችዎን በማስገባት ላይ ሳለን ችግር አጋጥሟል። ሂደቱን ለመጠበቅ ሲባል መልሶችዎ በደህንነት ተቀምጠዋል።"
              : "We encountered a problem while submitting your responses. To protect your progress, we've saved your answers locally."}
          </p>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-md mx-auto leading-relaxed">
            {isAm
              ? "አሁን እንደገና ማስገባት ወይም ምላሾችዎን በማስመለስ ወደ ጥናቱ መመለስ ይችላሉ።"
              : "You can try to resubmit now or recover your progress to continue the survey."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs md:text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>{isAm ? "እንደገና ሞክር" : "Try Again"}</span>
            </button>
            <Link
              to="/inbox"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-[#c0c7d0] text-[#131b2e] text-xs md:text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">restore</span>
              <span>{isAm ? "መልሶችን አስመልስ እና ተመለስ" : "Recover & Return to Survey"}</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[#c0c7d0]/40">
            <Link
              to="/contact"
              className="text-[#005985] hover:underline text-xs font-bold inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
              <span>{isAm ? "ድጋፍ ያግኙ" : "Contact Support"}</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#50616b] gap-4">
          <div>© {new Date().getFullYear()} Ethosk Panel. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#005985]">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#005985]">Terms of Service</Link>
            <Link to="/help" className="hover:text-[#005985]">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── 8. Survey Submission Success Page (Stitch Screen e35d518b98814def84e33b99ffccf307) ──
export function SurveySubmissionSuccessPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link to="/" className="font-bold text-xl text-[#005985]">Ethosk</Link>
          <Link to="/wallet" className="text-xs font-semibold text-[#005985] hover:underline">
            {isAm ? "ዋሌት" : "Wallet"}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 py-12">
        <div className="w-full max-w-[680px] bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 text-center shadow-xs">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-[#eff4ff] rounded-full flex items-center justify-center mb-6 text-[#005985]">
            <span
              className="material-symbols-outlined text-[48px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-3 tracking-tight">
            {isAm ? "ጥናቱ በተሳካ ሁኔታ ተጠናቋል" : "Survey Completed Successfully"}
          </h1>
          <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-[480px] mx-auto leading-relaxed">
            {isAm
              ? "ስለሰጡን ጠቃሚ አስተያየት እናመሰግናለን። ምላሾችዎ በደህንነት ተመዝግበዋል።"
              : "Thank you for your valuable feedback. Your responses have been securely recorded."}
          </p>

          {/* Summary Bento Block */}
          <div className="bg-[#faf8ff] border border-[#c0c7d0]/60 rounded-xl p-5 mb-6 text-left grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#50616b] uppercase tracking-wider">
                {isAm ? "የተጠናቀቀበት ቀን" : "Completion Date"}
              </span>
              <span className="text-sm font-bold text-[#131b2e]">October 24, 2023</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#50616b] uppercase tracking-wider">
                {isAm ? "የተገኘ ክፍያ" : "Reward Earned"}
              </span>
              <span className="text-sm font-bold text-[#005985] flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                <span>50 ETB</span>
              </span>
            </div>
          </div>

          {/* What Happens Next Block */}
          <div className="bg-[#eff4ff] rounded-xl p-5 mb-8 text-left flex items-start gap-3 border border-[#c0c7d0]/40">
            <span className="material-symbols-outlined text-[#005985] text-xl shrink-0 mt-0.5">
              info
            </span>
            <div>
              <h3 className="text-xs font-bold text-[#131b2e] mb-1">
                {isAm ? "ቀጥሎ ምን ይሆናል?" : "What happens next?"}
              </h3>
              <p className="text-xs text-[#50616b] leading-relaxed">
                {isAm
                  ? "ክፍያው በዋሌትዎ ውስጥ ታክሏል። ገንዘቡ ወደ መለያዎ ገቢ ከመደረጉ በፊት ተመራማሪው በ48 ሰዓታት ውስጥ የመረጃ ጥራቱን ያረጋግጣል።"
                  : "The reward has been added to your pending wallet. The researcher will review the data quality within 48 hours before funds are cleared for withdrawal."}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
            <Link
              to="/inbox"
              className="w-full md:w-auto bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-bold text-xs md:text-sm px-6 py-3 rounded-lg shadow-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            >
              <span>{isAm ? "ሌሎች ጥናቶችን ይመልከቱ" : "Browse Available Surveys"}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              to="/wallet"
              className="w-full md:w-auto bg-white border border-[#c0c7d0] text-[#131b2e] font-bold text-xs md:text-sm px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">wallet</span>
              <span>{isAm ? "ገቢዎችን ይመልከቱ" : "View Earnings"}</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full md:w-auto text-[#50616b] font-semibold text-xs md:text-sm hover:text-[#005985] transition-colors hover:underline flex items-center justify-center"
            >
              {isAm ? "ወደ ዳሽቦርድ ተመለስ" : "Return to Dashboard"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── 9. Empty State Components Showcase (Stitch Screen 362d40f98b5d4825b5921b01903664e7) ──
export function EmptyStateShowcasePage() {
  return (
    <div className="bg-[#faf8ff] p-6 md:p-12 space-y-16 max-w-5xl mx-auto">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-[#005985]">Empty State Components Showcase</h1>
        <p className="text-xs text-[#50616b]">Stitch Screen 362d40f98b5d4825b5921b01903664e7</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-[#131b2e]">1. No Search Results State</h2>
        <div className="border rounded-2xl overflow-hidden bg-white">
          <NoSearchResultsPage />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-[#131b2e]">2. Survey Submission Success State</h2>
        <div className="border rounded-2xl overflow-hidden bg-white">
          <SurveySubmissionSuccessPage />
        </div>
      </section>
    </div>
  );
}
