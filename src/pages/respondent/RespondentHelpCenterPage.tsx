import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

type CategoryId = "all" | "surveys" | "verification" | "account" | "earnings";

export function RespondentHelpCenterPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const categories = [
    {
      id: "surveys" as CategoryId,
      title: isAm ? "የጥናት ተሳትፎ" : "Survey Participation",
      icon: "assignment",
      desc: isAm
        ? "የጥናት መጫን ችግሮች፣ የብቁነት ደንቦች እና የተለያዩ የጥናት ዓይነቶች ግንዛቤ።"
        : "Troubleshooting survey loading, disqualification rules, and understanding different survey types.",
    },
    {
      id: "verification" as CategoryId,
      title: isAm ? "የማንነት ማረጋገጫ" : "Verification",
      icon: "verified_user",
      desc: isAm
        ? "የደረጃ 1 እና 2 የፋይዳ/መታወቂያ ማረጋገጫ ሂደቶች፣ አስፈላጊ ሰነዶች እና የሁኔታ ክትትል።"
        : "Tier 1 and Tier 2 ID verification processes, required documents, and checking your status updates.",
    },
    {
      id: "account" as CategoryId,
      title: isAm ? "የመለያ አስተዳደር" : "Account Management",
      icon: "person",
      desc: isAm
        ? "የይለፍ ቃል መቀየር፣ የመገለጫ ቅንብሮች እና የመለያ ደህንነት ጥበቃ።"
        : "Password resets, profile settings adjustments, and managing your overall account security.",
    },
    {
      id: "earnings" as CategoryId,
      title: isAm ? "ገቢ እና ማውጣት" : "Earnings & Withdrawals",
      icon: "payments",
      desc: isAm
        ? "ሂሳብዎን መፈተሽ፣ የክፍያ መርሃ ግብሮች እና የቴሌብር/ሲቢኢ ገንዘብ ማውጫ ዘዴዎች።"
        : "Checking your balance, understanding payout schedules, and navigating Telebirr/CBE withdrawal methods.",
    },
  ];

  const popularTopics = [
    {
      q: isAm ? "ገቢዬን እንዴት ማውጣት እችላለሁ?" : "How do I withdraw my earnings?",
      a: isAm
        ? "ወደ 'ዋሌት' ገጽ ይሂዱ፣ የቴሌብር ወይም የሲቢኢ ብር ቁጥርዎን ያስገቡ እና 'ገንዘብ አውጣ' የሚለውን ይጫኑ። ዝቅተኛው ማውጣት 50 ብር ነው።"
        : "Navigate to your Wallet page, select Telebirr or CBE Birr, enter your registered number, and click 'Withdraw'. The minimum withdrawal threshold is 50 ETB.",
      category: "earnings",
    },
    {
      q: isAm ? "ለምን ከጥናት ውድቅ ሆንኩ?" : "Why was I disqualified from a survey?",
      a: isAm
        ? "ተመራማሪዎች የተወሰኑ የስነ-ህዝብ መመዘኛዎችን ያዘጋጃሉ። የመነሻ ጥያቄዎች እርስዎ ከተፈለገው ታዳሚ ጋር ካልተዛመዱ ጥናቱ በራስ-ሰር ይጠናቀቃል።"
        : "Researchers set target demographic criteria. If your screening answers don't match the specific study criteria, you will be disqualified early.",
      category: "surveys",
    },
    {
      q: isAm ? "የመታወቂያ ማረጋገጫ ምን ያህል ጊዜ ይወስዳል?" : "How long does ID verification take?",
      a: isAm
        ? "የደረጃ 1 የፋይዳ ብሄራዊ መታወቂያ በቅጽበት በኦንላይን ይረጋገጣል። የደረጃ 2 ሰነዶች በ24 ሰዓታት ውስጥ በአድሚን ይገመገማሉ።"
        : "Tier 1 Fayda verification is instant via automated check. Tier 2 document reviews are typically processed within 24 hours.",
      category: "verification",
    },
    {
      q: isAm ? "የይለፍ ቃሌን ረሳሁት፣ እንዴት እቀይራለሁ?" : "I forgot my password, how do I reset it?",
      a: isAm
        ? "በመግቢያ ገጹ ላይ 'የይለፍ ቃል ረሳሁ' የሚለውን ይጫኑ፣ የተመዘገበውን ስልክ/ኢሜይል ያስገቡ እና የዳግም ማስጀመሪያ ኮድ ይደርስዎታል።"
        : "Click 'Forgot Password' on the login screen, enter your phone or email, and follow the SMS/email verification OTP link.",
      category: "account",
    },
  ];

  const filteredTopics = popularTopics.filter((topic) => {
    const matchesCategory =
      selectedCategory === "all" || topic.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      topic.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen font-['Inter',sans-serif] flex flex-col antialiased">
      {/* ── Top Header Navigation ── */}
      <header className="bg-white border-b border-[#c0c7d0]/50 sticky top-0 z-30">
        <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-[1280px] mx-auto h-16">
          <div className="flex items-center gap-3">
            <Link to="/inbox" className="font-bold text-xl text-[#005985]">
              Ethosk
            </Link>
            <span className="text-xs text-[#50616b] font-medium pl-3 border-l border-[#c0c7d0]">
              {isAm ? "የተሳታፊዎች የእርዳታ ማዕከል" : "Respondent Help Center"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="text-xs font-semibold text-[#005985] hover:underline hidden sm:inline"
            >
              {isAm ? "ድጋፍ አግኝ" : "Contact Support"}
            </Link>
            <Link
              to="/inbox"
              className="text-xs font-bold bg-[#eff4ff] text-[#005985] px-3.5 py-2 rounded-lg hover:bg-[#dae2fd] transition-colors"
            >
              {isAm ? "ወደ ጥናቶች ተመለስ" : "Back to Surveys"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container with Left Sidebar & Content ── */}
      <div className="flex-1 flex max-w-[1280px] mx-auto w-full relative">
        {/* Left SideNav */}
        <aside className="bg-[#f2f3ff] w-64 hidden lg:flex flex-col border-r border-[#c0c7d0]/50 p-6 shrink-0">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-[#005985] mb-1">
              {isAm ? "የእርዳታ ምድቦች" : "Help Categories"}
            </h2>
            <p className="text-[11px] text-[#50616b]">
              {isAm ? "መልሶችን በምድብ ያግኙ" : "Find answers by topic"}
            </p>
          </div>

          <nav className="flex-1 flex flex-col gap-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                selectedCategory === "all"
                  ? "bg-[#005985] text-white font-bold"
                  : "text-[#40484f] hover:bg-[#e2e7ff]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span>{isAm ? "ሁሉም ርዕሶች" : "All Topics"}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                  selectedCategory === cat.id
                    ? "bg-[#005985] text-white font-bold"
                    : "text-[#40484f] hover:bg-[#e2e7ff]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                <span>{cat.title}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-[#c0c7d0]/50">
            <Link
              to="/contact"
              className="w-full bg-white border border-[#c0c7d0] text-[#131b2e] text-xs font-bold px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 mb-4 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              <span>{isAm ? "ድጋፍ ያግኙ" : "Contact Support"}</span>
            </Link>

            <div className="flex flex-col gap-1.5 text-[11px] text-[#50616b]">
              <Link to="/privacy" className="hover:text-[#005985] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#005985] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full p-4 md:p-8 lg:p-10 pb-20">
          {/* Hero Search Section */}
          <section className="bg-[#eff4ff] border border-[#c0c7d0]/40 rounded-2xl p-6 md:p-10 text-center mb-10 shadow-xs">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-3 tracking-tight">
                {isAm ? "እንዴት ልንረዳዎ እንችላለን?" : "How can we help?"}
              </h1>
              <p className="text-xs md:text-sm text-[#50616b] mb-6">
                {isAm
                  ? "የተሳታፊ መመሪያዎችን፣ የክፍያ ጥያቄዎችን እና የፋይዳ ማረጋገጫ መረጃዎችን ይፈልጉ።"
                  : "Search for participant guides, withdrawal questions, and Fayda ID verification FAQs."}
              </p>
              <div className="relative max-w-xl mx-auto">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAm
                      ? "ጽሑፎችን፣ መመሪያዎችን እና ተደጋጋሚ ጥያቄዎችን ይፈልጉ..."
                      : "Search for articles, guides, and FAQs..."
                  }
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#c0c7d0] rounded-xl text-xs md:text-sm text-[#131b2e] focus:outline-none focus:border-[#005985] focus:ring-2 focus:ring-[#005985]/20 shadow-xs transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </section>

          {/* Categories Bento Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`bg-white border rounded-xl p-6 transition-all cursor-pointer group shadow-xs relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === cat.id
                      ? "border-[#005985] ring-2 ring-[#005985]/20"
                      : "border-[#c0c7d0]/60 hover:border-[#005985]"
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <span className="material-symbols-outlined text-6xl text-[#005985]">
                      {cat.icon}
                    </span>
                  </div>

                  <div>
                    <div className="w-12 h-12 bg-[#eaedff] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#005985] group-hover:text-white transition-colors text-[#005985]">
                      <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#131b2e] mb-1.5 group-hover:text-[#005985] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#50616b] leading-relaxed mb-4">{cat.desc}</p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#005985] uppercase tracking-wider">
                    <span>{isAm ? "ጽሑፎችን ይመልከቱ" : "View Articles"}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Popular Topics & Still Need Help Split */}
          <section className="border-t border-[#c0c7d0]/40 pt-10">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Popular Topics List */}
              <div className="flex-1 w-full">
                <h2 className="text-lg font-bold text-[#131b2e] mb-4">
                  {isAm ? "ተወዳጅ ርዕሶች እና ጥያቄዎች" : "Popular Topics & FAQs"}
                </h2>

                {filteredTopics.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTopics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-[#c0c7d0]/60 rounded-xl overflow-hidden shadow-xs transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)
                          }
                          className="w-full flex items-center justify-between p-4 text-left font-medium text-xs md:text-sm text-[#131b2e] hover:text-[#005985] cursor-pointer gap-3"
                        >
                          <span>{topic.q}</span>
                          <span className="material-symbols-outlined text-[#50616b] text-[20px] shrink-0">
                            {expandedFaqIndex === idx ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                        {expandedFaqIndex === idx && (
                          <div className="px-4 pb-4 pt-1 text-xs text-[#50616b] leading-relaxed border-t border-slate-100 bg-[#faf8ff]">
                            {topic.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white border border-[#c0c7d0]/60 rounded-xl text-xs text-[#50616b]">
                    {isAm ? "ምንም ውጤት አልተገኘም።" : "No articles found matching your query."}
                  </div>
                )}
              </div>

              {/* Still Need Help Card */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="bg-[#f2f3ff] p-6 rounded-2xl border border-[#c0c7d0]/60 text-center sticky top-24 shadow-xs">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs text-[#005985]">
                    <span className="material-symbols-outlined text-[28px]">support_agent</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#131b2e] mb-1">
                    {isAm ? "አሁንም እርዳታ ይፈልጋሉ?" : "Still need help?"}
                  </h3>
                  <p className="text-xs text-[#50616b] mb-5 leading-relaxed">
                    {isAm
                      ? "የእኛ የድጋፍ ቡድን እዚህ ላልተሸፈኑ ማናቸውም ጥያቄዎች እርስዎን ለመርዳት ዝግጁ ነው።"
                      : "Our support team is ready to assist you with any questions not covered here."}
                  </p>
                  <Link
                    to="/contact"
                    className="w-full bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:opacity-95 transition-opacity shadow-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    <span>{isAm ? "የድጋፍ ቡድንን ያነጋግሩ" : "Contact Support"}</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
