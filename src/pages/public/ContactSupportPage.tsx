import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";

type IssueCategory = "general" | "account" | "billing" | "survey" | "verification" | "other";

export function ContactSupportPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<IssueCategory>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSelectCardCategory = (cat: IssueCategory) => {
    setCategory(cat);
    const formElement = document.getElementById("support-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `ETH-${Math.floor(1000 + Math.random() * 9000)}`;
    navigate(`/contact/success?ticket=${ticketId}&category=${category}`);
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen antialiased selection:bg-[#cbe6ff] selection:text-[#001e30] flex flex-col">
      {/* ── Top Navigation Bar (Exact Stitch Screen 8de8c52b67df4957a5ff049e6d880e86) ── */}
      <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#c0c7d0]/40 transition-all duration-300">
        <div className="flex justify-between items-center h-16 md:h-20 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <Link
            to="/"
            className="text-xl md:text-2xl font-bold text-[#005985] tracking-tight hover:opacity-90 transition-opacity"
          >
            Ethosk
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-[#50616b]">
            <Link to="/#solutions" className="hover:text-[#005985] transition-colors">
              {isAm ? "መፍትሄዎች" : "Solutions"}
            </Link>
            <Link to="/researcher/surveys" className="hover:text-[#005985] transition-colors">
              {isAm ? "ምርምር" : "Research"}
            </Link>
            <Link to="/respondent/onboarding" className="hover:text-[#005985] transition-colors">
              {isAm ? "ማረጋገጫ" : "Verification"}
            </Link>
            <Link to="/help" className="hover:text-[#005985] transition-colors">
              {isAm ? "የእርዳታ ማዕከል" : "Help Center"}
            </Link>
            <Link to="/subscription/plans" className="hover:text-[#005985] transition-colors">
              {isAm ? "ዋጋ" : "Pricing"}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/signup"
              className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-xs"
            >
              {isAm ? "ይጀምሩ" : "Get Started"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 pt-6 md:pt-10 pb-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
        {/* Hero Section */}
        <section className="max-w-[800px] mx-auto text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-5xl font-bold text-[#131b2e] tracking-tight mb-3">
            {isAm ? "እንዴት ልንረዳዎ እንችላለን?" : "How can we help?"}
          </h1>
          <p className="text-sm md:text-base text-[#50616b] max-w-xl mx-auto leading-relaxed">
            {isAm
              ? "የእኛ የድጋፍ ቡድን የምርምር ወይም የምላሽ ተሞክሮዎ የተሳካ እንዲሆን ለመርዳት ዝግጁ ነው።"
              : "Our support team is here to ensure your research or response experience is seamless."}
          </p>
        </section>

        {/* Support Options Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: General Inquiry */}
          <div
            onClick={() => handleSelectCardCategory("general")}
            className={`bg-white border rounded-xl p-6 transition-all cursor-pointer group shadow-xs ${
              category === "general"
                ? "border-[#005985] ring-2 ring-[#005985]/20"
                : "border-[#c0c7d0]/60 hover:border-[#005985]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#eaedff] flex items-center justify-center mb-4 group-hover:bg-[#005985] group-hover:text-white transition-colors text-[#50616b]">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <h3 className="text-base font-bold text-[#131b2e] mb-1.5">
              {isAm ? "አጠቃላይ ጥያቄ" : "General Inquiry"}
            </h3>
            <p className="text-xs text-[#50616b] leading-relaxed">
              {isAm
                ? "ስለ መድረካችን፣ ባህሪያት ወይም እንዴት መጀመር እንደሚቻል ጥያቄዎች።"
                : "Questions about our platform, features, or getting started."}
            </p>
          </div>

          {/* Card 2: Technical Support */}
          <div
            onClick={() => handleSelectCardCategory("survey")}
            className={`bg-white border rounded-xl p-6 transition-all cursor-pointer group shadow-xs ${
              category === "survey"
                ? "border-[#005985] ring-2 ring-[#005985]/20"
                : "border-[#c0c7d0]/60 hover:border-[#005985]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#eaedff] flex items-center justify-center mb-4 group-hover:bg-[#005985] group-hover:text-white transition-colors text-[#50616b]">
              <span className="material-symbols-outlined text-[24px]">build</span>
            </div>
            <h3 className="text-base font-bold text-[#131b2e] mb-1.5">
              {isAm ? "የቴክኒክ ድጋፍ" : "Technical Support"}
            </h3>
            <p className="text-xs text-[#50616b] leading-relaxed">
              {isAm
                ? "ችግር ገጥሞዎታል? ችግሩን ለመፍታት እንርዳዎታለን።"
                : "Encountering an issue? Let us help you troubleshoot."}
            </p>
          </div>

          {/* Card 3: Verification Help */}
          <div
            onClick={() => handleSelectCardCategory("verification")}
            className={`bg-white border rounded-xl p-6 transition-all cursor-pointer group shadow-xs ${
              category === "verification"
                ? "border-[#005985] ring-2 ring-[#005985]/20"
                : "border-[#c0c7d0]/60 hover:border-[#005985]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#eaedff] flex items-center justify-center mb-4 group-hover:bg-[#005985] group-hover:text-white transition-colors text-[#50616b]">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <h3 className="text-base font-bold text-[#131b2e] mb-1.5">
              {isAm ? "የማረጋገጫ እገዛ" : "Verification Help"}
            </h3>
            <p className="text-xs text-[#50616b] leading-relaxed">
              {isAm
                ? "የማንነት ማረጋገጫ (ፋይዳ) እና የመረጃ ተገዢነት እገዛ።"
                : "Assistance with Fayda identity verification and data compliance."}
            </p>
          </div>
        </section>

        {/* Split Layout: Form & Sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form (Left) */}
          <div
            id="support-form"
            className="lg:col-span-8 bg-white border border-[#c0c7d0]/60 rounded-xl p-6 md:p-8 shadow-xs"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-[#131b2e] mb-1.5">
                    {isAm ? "ስም" : "Name"}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAm ? "ሙሉ ስምዎን ያስገቡ" : "Enter your full name"}
                    className="w-full h-11 px-3.5 border border-[#c0c7d0] rounded-lg bg-white text-[#131b2e] text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#005985] focus:ring-2 focus:ring-[#005985]/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[#131b2e] mb-1.5">
                    {isAm ? "ኢሜይል" : "Email"}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 border border-[#c0c7d0] rounded-lg bg-white text-[#131b2e] text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#005985] focus:ring-2 focus:ring-[#005985]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-[#131b2e] mb-1.5">
                  {isAm ? "የጉዳዩ ምድብ" : "Issue Category"}
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full h-11 px-3.5 border border-[#c0c7d0] rounded-lg bg-white text-[#131b2e] text-xs md:text-sm appearance-none focus:outline-none focus:border-[#005985] focus:ring-2 focus:ring-[#005985]/20 transition-all cursor-pointer"
                  >
                    <option value="general">{isAm ? "አጠቃላይ ጥያቄ" : "General Inquiry"}</option>
                    <option value="account">{isAm ? "መለያ እና መግቢያ" : "Account & Login"}</option>
                    <option value="billing">{isAm ? "ክፍያ እና ምዝገባ" : "Billing & Subscription"}</option>
                    <option value="survey">{isAm ? "የጥናት ቴክኒካዊ ጉዳይ" : "Survey Technical Issue"}</option>
                    <option value="verification">{isAm ? "የማንነት ማረጋገጫ (ፋይዳ)" : "Verification (Fayda / verify.et)"}</option>
                    <option value="other">{isAm ? "ሌላ" : "Other"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-semibold text-[#131b2e] mb-1.5">
                  {isAm ? "ርዕሰ ጉዳይ" : "Subject"}
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={isAm ? "የጉዳይዎ አጭር መግለጫ" : "Brief description of your issue"}
                  className="w-full h-11 px-3.5 border border-[#c0c7d0] rounded-lg bg-white text-[#131b2e] text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#005985] focus:ring-2 focus:ring-[#005985]/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-[#131b2e] mb-1.5">
                  {isAm ? "መልእክት" : "Message"}
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isAm
                      ? "እባክዎ ስለ ጥያቄዎ ዝርዝር መረጃ ያቅርቡ..."
                      : "Please provide details about your request..."
                  }
                  className="w-full p-3.5 border border-[#c0c7d0] rounded-lg bg-white text-[#131b2e] text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#005985] focus:ring-2 focus:ring-[#005985]/20 transition-all resize-y"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-[#c0c7d0]/40 gap-4">
                <Link
                  to="/help"
                  className="text-xs font-semibold text-[#005985] hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">help_center</span>
                  <span>{isAm ? "መጀመሪያ የእርዳታ ማዕከላችንን ይመልከቱ" : "Check our Help Center first"}</span>
                </Link>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-br from-[#005985] to-[#2872a1] text-white text-xs font-bold px-6 py-3 rounded-lg hover:opacity-95 transition-opacity shadow-xs cursor-pointer"
                >
                  {isAm ? "የድጋፍ ጥያቄ ላክ" : "Send Support Request"}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info (Right) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Address Card */}
            <div className="bg-[#f2f3ff] border border-[#c0c7d0]/40 rounded-xl p-5 shadow-xs">
              <div className="flex items-start gap-3 mb-2">
                <span className="material-symbols-outlined text-[#005985] mt-0.5 text-[20px]">
                  location_on
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#131b2e] mb-1">
                    {isAm ? "ዋና መሥሪያ ቤት" : "Headquarters"}
                  </h4>
                  <p className="text-xs text-[#50616b] leading-relaxed">
                    Bole Medhanialem, Century Mall Bldg, 4th Floor<br />
                    Addis Ababa, Ethiopia
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="bg-[#f2f3ff] border border-[#c0c7d0]/40 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">mail</span>
                <div>
                  <h4 className="text-[10px] font-bold text-[#50616b] uppercase tracking-wider mb-0.5">
                    {isAm ? "የድጋፍ ኢሜይል" : "Support Email"}
                  </h4>
                  <a
                    href="mailto:support@ethosk.com"
                    className="text-xs font-semibold text-[#005985] hover:underline"
                  >
                    support@ethosk.com
                  </a>
                </div>
              </div>

              <div className="w-full h-px bg-[#c0c7d0]/40"></div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#005985] text-[20px]">phone</span>
                <div>
                  <h4 className="text-[10px] font-bold text-[#50616b] uppercase tracking-wider mb-0.5">
                    {isAm ? "ስልክ ቁጥር" : "Phone Number"}
                  </h4>
                  <a
                    href="tel:+251911234567"
                    className="text-xs font-semibold text-[#131b2e] hover:text-[#005985] transition-colors"
                  >
                    +251 911 234 567
                  </a>
                </div>
              </div>
            </div>

            {/* Map Preview Card */}
            <div className="rounded-xl overflow-hidden h-44 border border-[#c0c7d0]/40 bg-white relative group shadow-xs">
              <div className="w-full h-full bg-gradient-to-tr from-[#dae2fd] to-[#cbe6ff] flex items-center justify-center p-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#005985] text-[32px]">map</span>
                  <span className="text-xs font-bold text-[#131b2e]">Addis Ababa, Ethiopia</span>
                  <span className="text-[11px] text-[#50616b]">Bole Subcity, Woreda 03</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3 pointer-events-none">
                <span className="text-[10px] font-bold text-white bg-[#005985]/90 px-2 py-0.5 rounded backdrop-blur-xs">
                  {isAm ? "በካርታ ላይ ይመልከቱ" : "View on Map"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-[#c0c7d0]/40 bg-white mt-12 py-8 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#50616b]">
          <div className="font-bold text-[#005985] text-base">Ethosk</div>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-[#005985] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#005985] transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="hover:text-[#005985] transition-colors">
              Help Center
            </Link>
            <Link to="/contact" className="font-bold text-[#005985]">
              Contact Support
            </Link>
          </div>
          <div>© {new Date().getFullYear()} Ethosk. Empowering Ethiopian Research.</div>
        </div>
      </footer>
    </div>
  );
}
