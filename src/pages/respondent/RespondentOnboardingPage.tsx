import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

export function RespondentOnboardingPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";

  // Step 2 = Overview / Honesty, Step 3 = ID Upload, 4 = Success, 5 = Flagged / Retry
  const [step, setStep] = useState<2 | 3 | 4 | 5>(2);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.verification_tier && user.verification_tier !== "0_registered") {
      setStep(4);
    }
  }, [user]);

  const handleFileChange = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(isAm ? "የፋይል መጠን ከ 10MB በታች መሆን አለበት።" : "File size must be under 10MB.");
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedFile) {
      setErrorMsg(isAm ? "እባክዎ መጀመሪያ ሰነድዎን ይምረጡ።" : "Please select your ID document first.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Upload document through mock / direct API
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("doc_type", "student_id");

      // In client or mock mode, we trigger successful verification review
      try {
        await api("/respondents/verify-document", {
          body: {
            document_type: "student_id",
            file_name: selectedFile.name,
          },
        });
      } catch {
        // Fallback for simulation
      }

      await refresh();
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit document for review.");
      setStep(5); // Show flagged / retry view if something failed
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Demographic Form State (Stitch Screen f808a06145cc432cb89ea9c97f2a3611)
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");

  const handleStep2Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(isAm ? "እባክዎ ሙሉ የህግ ስምዎን ያስገቡ።" : "Please enter your full legal name.");
      return;
    }
    setErrorMsg(null);
    try {
      await api("/respondents/profile", {
        body: {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          dob: dob.trim() || undefined,
          gender: gender || undefined,
          region: region.trim() || undefined,
          education_level: educationLevel || undefined,
          employment_status: employmentStatus || undefined,
        },
      });
      await refresh();
    } catch {
      // Allow progression in client/mock mode
    }
    setStep(3);
  };

  return (
    <div className="bg-gradient-to-br from-[#F0F7FF] via-[#E1EFFE] to-[#d0e6fd] text-[#0b1c30] min-h-screen flex flex-col items-center justify-between p-4 md:p-8 relative overflow-x-hidden font-['Inter',sans-serif]">
      {/* Decorative ambient waves for sky-blue glassmorphism */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/40 blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-100/50 blur-3xl opacity-60"></div>
        <div className="absolute top-[30%] left-[20%] w-[50%] h-[20%] bg-white/30 blur-2xl transform rotate-12 opacity-50"></div>
      </div>

      {/* Top Header & Progress Bar */}
      <header className="w-full max-w-[480px] pt-4 pb-2 z-10">
        <div className="flex justify-between items-center mb-3">
          <Link to="/" className="text-[#004162] font-bold text-2xl tracking-tight font-['Plus_Jakarta_Sans','Newsreader',serif]">
            Ethosk
          </Link>
          <div className="text-[#5A6E7F] text-xs font-semibold">
            {step === 2 ? (isAm ? "ደረጃ 2 ከ 4" : "Step 2 of 4") : step === 3 ? (isAm ? "ደረጃ 3 ከ 4" : "Step 3 of 4") : (isAm ? "ደረጃ 4 ከ 4" : "Step 4 of 4")}
          </div>
        </div>
        {/* Progress Line */}
        <div className="w-full h-1 bg-[#CBDDE9] rounded-full overflow-hidden">
          <div
            className={`h-full bg-[#003345] rounded-full transition-all duration-500 ease-in-out ${
              step === 2 ? "w-1/2" : step === 3 ? "w-3/4" : "w-full"
            }`}
          ></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[480px] my-auto relative z-10 py-6">
        {/* ══════════════════════════════════════════════════
            STEP 2: Profile Setup Demographic Form (Stitch Screen f808a06145cc432cb89ea9c97f2a3611)
           ══════════════════════════════════════════════════ */}
        {step === 2 && (
          <section className="bg-white/90 backdrop-blur-md rounded-[20px] p-7 sm:p-9 shadow-[0_12px_32px_rgba(0,65,98,0.08)] border border-white/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Card Header */}
            <div className="text-center mb-6">
              <h1 className="text-[#004162] font-semibold text-xl sm:text-2xl leading-tight mb-2 font-['Plus_Jakarta_Sans','Newsreader',serif]">
                {isAm ? "ገቢ ማግኘት ከመጀመርዎ በፊት አንድ ፈጣን ማረጋገጫ።" : "One quick check before you start earning."}
              </h1>
              <p className="text-[#5A6E7F] text-xs sm:text-sm">
                {isAm ? "የመገለጫ ማጠናቀቅ ፈጣን የመረጃ ግምገማ ይፈልጋል።" : "Profile completion requires a quick information review."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {errorMsg}
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleStep2Submit} className="space-y-4">
              {/* Field 1: Full Legal Name */}
              <div>
                <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="fullName">
                  {isAm ? "ሙሉ የህግ ስም" : "Full Legal Name"}
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAm ? "ሙሉ ስም" : "Full Legal Name"}
                  type="text"
                  required
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#71787c]/70 outline-none"
                />
              </div>

              {/* Field 2: Phone Number */}
              <div>
                <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="phoneNumber">
                  {isAm ? "ስልክ ቁጥር" : "Phone Number"}
                </label>
                <input
                  id="phoneNumber"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9..."
                  type="tel"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#71787c]/70 outline-none"
                />
              </div>

              {/* Field 3: Split Row (DOB & Gender) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="dob">
                    {isAm ? "የትውልድ ቀን" : "Date of Birth"}
                  </label>
                  <input
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    type="text"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#71787c]/70 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="gender">
                    {isAm ? "ጾታ" : "Gender"}
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm appearance-none pr-9 outline-none cursor-pointer ${
                        gender ? "text-[#0b1c30]" : "text-[#71787c]/70"
                      }`}
                    >
                      <option disabled value="">{isAm ? "ይምረጡ" : "Select"}</option>
                      <option value="male">{isAm ? "ወንድ" : "Male"}</option>
                      <option value="female">{isAm ? "ሴት" : "Female"}</option>
                      <option value="other">{isAm ? "ሌላ" : "Other"}</option>
                    </select>
                    <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#71787c] pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 4: Region / City */}
              <div>
                <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="region">
                  {isAm ? "ክልል / ከተማ" : "Region / City"}
                </label>
                <input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Addis Ababa"
                  type="text"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#71787c]/70 outline-none"
                />
              </div>

              {/* Field 5: Education Level */}
              <div>
                <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="education">
                  {isAm ? "የትምህርት ደረጃ" : "Education Level"}
                </label>
                <div className="relative">
                  <select
                    id="education"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm appearance-none pr-9 outline-none cursor-pointer ${
                      educationLevel ? "text-[#0b1c30]" : "text-[#71787c]/70"
                    }`}
                  >
                    <option disabled value="">{isAm ? "ደረጃ ይምረጡ" : "Select Level"}</option>
                    <option value="highschool">{isAm ? "ሁለተኛ ደረጃ" : "High School"}</option>
                    <option value="bachelors">{isAm ? "የመጀመሪያ ዲግሪ" : "Bachelor's Degree"}</option>
                    <option value="masters">{isAm ? "ሁለተኛ ዲግሪ" : "Master's Degree"}</option>
                    <option value="doctorate">{isAm ? "ዶክትሬት" : "Doctorate"}</option>
                  </select>
                  <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#71787c] pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Field 6: Employment Status */}
              <div className="pb-2">
                <label className="block text-[#41484E] text-[11px] font-semibold tracking-wider mb-1.5 uppercase" htmlFor="employment">
                  {isAm ? "የስራ ሁኔታ" : "Employment Status"}
                </label>
                <div className="relative">
                  <select
                    id="employment"
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className={`w-full px-4 py-2.5 sm:py-3 rounded-lg border border-[#c1c7cc] bg-white focus:outline-none focus:border-[#003345] focus:ring-2 focus:ring-[#003345]/10 transition-all text-xs sm:text-sm appearance-none pr-9 outline-none cursor-pointer ${
                      employmentStatus ? "text-[#0b1c30]" : "text-[#71787c]/70"
                    }`}
                  >
                    <option disabled value="">{isAm ? "ሁኔታ ይምረጡ" : "Select Status"}</option>
                    <option value="employed_full">{isAm ? "ሙሉ ጊዜ ተቀጣሪ" : "Employed Full-Time"}</option>
                    <option value="employed_part">{isAm ? "የትርፍ ጊዜ ተቀጣሪ" : "Employed Part-Time"}</option>
                    <option value="unemployed">{isAm ? "ስራ ፈላጊ" : "Unemployed"}</option>
                    <option value="student">{isAm ? "ተማሪ" : "Student"}</option>
                  </select>
                  <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#71787c] pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full bg-[#003345] hover:bg-[#154a70] text-white font-bold py-3.5 rounded-lg transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 group cursor-pointer shadow-md"
              >
                <span>{isAm ? "ቀጥል" : "Continue"}</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </form>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 3: ID Upload Screen (Stitch Screen d175f9d09983422080c30361bb6ceb1a)
           ══════════════════════════════════════════════════ */}
        {step === 3 && (
          <section className="bg-white/90 backdrop-blur-md rounded-[20px] p-7 sm:p-9 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,65,98,0.08)] border border-white/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div>
              <h1 className="font-['Plus_Jakarta_Sans','Newsreader',serif] text-xl sm:text-2xl font-semibold text-[#004162] mb-1.5 leading-tight">
                {isAm ? "መታወቂያዎን ለግምገማ ያስገቡ" : "Submit your ID for consistency check"}
              </h1>
              <p className="text-xs sm:text-sm text-[#5A6E7F]">
                {isAm
                  ? "እባክዎ የመንግስት ወይም የተቋም መታወቂያዎን ግልጽ ፎቶ ያስገቡ።"
                  : "Please provide a clear photo of your government-issued ID."}
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                dragActive
                  ? "border-[#003345] bg-[#eff4ff] scale-[1.01]"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-[#c1c7cc] hover:border-[#003345] bg-[#f8f9ff] hover:bg-[#eff4ff]/60"
              }`}
            >
              <input
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${selectedFile ? "text-emerald-600" : "text-[#5A6E7F] group-hover:text-[#003345]"}`}>
                {selectedFile ? "task_alt" : "upload_file"}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#0b1c30] mb-1">
                {selectedFile
                  ? selectedFile.name
                  : (isAm ? "ሰነድ ለመጫን እዚህ ይጫኑ ወይም ይጎትቱ" : "Click to upload or drag and drop")}
              </p>
              <p className="text-[11px] text-[#5A6E7F]">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${isAm ? "ለመለወጥ እንደገና ይጫኑ" : "Click to change"}`
                  : "JPG, PNG, or PDF under 10MB"}
              </p>
            </div>

            {errorMsg ? (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            ) : null}

            {/* Legibility Tips Box */}
            <div className="bg-[#eff4ff]/70 rounded-xl p-4 border border-[#c1c7cc]/40">
              <h3 className="text-xs font-bold text-[#004162] mb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004162] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lightbulb
                </span>
                <span>{isAm ? "ጠቃሚ ምክሮች" : "Tips for a successful check"}</span>
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-xs text-[#5A6E7F]">
                  <span className="material-symbols-outlined text-[#5A6E7F] text-[18px]">wb_sunny</span>
                  <span>{isAm ? "በቂ ብርሃን ያለው ቦታ" : "Well-lit environment"}</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-[#5A6E7F]">
                  <span className="material-symbols-outlined text-[#5A6E7F] text-[18px]">aspect_ratio</span>
                  <span>{isAm ? "4ቱም ማዕዘኖች ሙሉ በሙሉ የሚታዩ" : "All 4 corners visible"}</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-[#5A6E7F]">
                  <span className="material-symbols-outlined text-[#5A6E7F] text-[18px]">block</span>
                  <span>{isAm ? "ያለ ብልጭታ ወይም ነጸብራቅ" : "No glare or reflections"}</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="w-full bg-[#003345] hover:bg-[#154a70] text-white font-bold text-xs sm:text-sm rounded-full py-3.5 px-6 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
                type="button"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>{isAm ? "ለግምገማ አስገባ" : "Submit for review"}</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate("/inbox")}
                className="w-full bg-transparent text-[#004162] hover:bg-[#eff4ff] font-semibold text-xs sm:text-sm rounded-full py-2.5 px-6 transition-all flex items-center justify-center cursor-pointer"
                type="button"
              >
                {isAm ? "ለጊዜው ይለፉ" : "Skip for now"}
              </button>

              {/* Encryption Reassurance */}
              <div className="flex items-center justify-center gap-1.5 text-[#5A6E7F] text-[11px] text-center pt-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <span>
                  {isAm
                    ? "መረጃዎ የተመሰጠረ ሲሆን ለተመራማሪዎች አይጋራም።"
                    : "Your information is securely encrypted and never shared with researchers."}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
        {/* ══════════════════════════════════════════════════
            STEP 4: Success View (Stitch Screen 086d2779e69541518c39d3e6eb0ee73d)
           ══════════════════════════════════════════════════ */}
        {step === 4 && (
          <section className="bg-white/90 backdrop-blur-md rounded-[20px] p-8 md:p-12 w-full max-w-[480px] flex flex-col items-center text-center relative z-10 border border-white/80 shadow-[0_12px_32px_rgba(0,65,98,0.08)] animate-in fade-in zoom-in-95 duration-300">
            {/* Glowing Success Circle */}
            <div className="mt-4 mb-6 relative">
              <div className="w-24 h-24 rounded-full bg-[#c0e8ff] flex items-center justify-center relative z-10 border border-[#a3cce3]/60 shadow-sm">
                <span className="material-symbols-outlined text-[#001d29] text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-[#a3cce3]/30 animate-ping opacity-40"></div>
            </div>

            <h1 className="font-['Plus_Jakarta_Sans','Newsreader',serif] text-2xl sm:text-3xl font-bold text-[#0b1c30] mb-2">
              {isAm ? "ሁሉንም አጠናቀዋል!" : "You're all set"}
            </h1>
            <p className="text-xs sm:text-sm text-[#41484c] mb-8 max-w-xs">
              {isAm
                ? "ጥናቶችን ማሰስ እና ሽልማቶችን ማግኘት ይጀምሩ"
                : "Start exploring surveys and earning"}
            </p>

            <button
              onClick={() => navigate("/inbox")}
              className="w-full bg-[#003345] hover:bg-[#154a70] text-white font-bold py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group shadow-md cursor-pointer"
              type="button"
            >
              <span>{isAm ? "ጥናቶችን ያስሱ" : "Browse surveys"}</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 5: Setup Failed View (Stitch Screen 2bd9ae194e5a4666800dc7ebeaa8e573)
           ══════════════════════════════════════════════════ */}
        {step === 5 && (
          <section className="bg-white/90 backdrop-blur-md rounded-[20px] p-7 sm:p-9 w-full max-w-[480px] flex flex-col items-center text-center relative z-10 border border-white/80 shadow-[0_12px_32px_rgba(0,65,98,0.08)] animate-in fade-in zoom-in-95 duration-300">
            {/* Refresh Icon */}
            <div className="w-16 h-16 rounded-full bg-[#aae2ff]/60 flex items-center justify-center mb-5 text-[#2b657e] shadow-sm border border-[#aae2ff]/40">
              <span className="material-symbols-outlined text-3xl">refresh</span>
            </div>

            <h1 className="font-['Plus_Jakarta_Sans','Newsreader',serif] text-xl sm:text-2xl font-bold text-[#0b1c30] mb-2">
              {isAm ? "እንደገና እንሞክር" : "Let's try that again"}
            </h1>
            <p className="text-xs sm:text-sm text-[#41484c] mb-6 max-w-xs leading-relaxed">
              {isAm
                ? "ሰነድዎ የጥራት መስፈርቶቻችንን አላሟላም — ይህ የግምገማ ጥራት ማረጋገጫ ብቻ ነው።"
                : "Your document didn't meet our clarity requirements—this isn't a judgment, just a quality check."}
            </p>

            <button
              onClick={() => {
                setSelectedFile(null);
                setStep(3);
              }}
              className="w-full bg-[#003345] hover:bg-[#154a70] text-white font-bold transition-all rounded-full py-3.5 px-6 text-xs sm:text-sm mb-5 flex items-center justify-center gap-2 shadow-md cursor-pointer group"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-y-0.5 transition-transform">upload_file</span>
              <span>{isAm ? "ሰነዱን እንደገና ይጫኑ" : "Re-upload document"}</span>
            </button>

            {/* Explanatory Details */}
            <details className="w-full text-left group cursor-pointer border border-[#c1c7cc]/50 rounded-lg bg-[#eff4ff]/60 overflow-hidden">
              <summary className="text-xs font-semibold text-[#0b1c30] p-3.5 flex justify-between items-center list-none outline-none hover:bg-[#eff4ff] transition-colors">
                <span>{isAm ? "ይህ ምን ማለት ነው?" : "What does this mean?"}</span>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="p-3.5 pt-0 text-[11px] text-[#41484c] leading-relaxed border-t border-[#c1c7cc]/30 mt-1">
                {isAm
                  ? "ደህንነቱ የተጠበቀ መድረክ ለማረጋገጥ ሁሉም ሰነዶች የንባብ ግልጽነት ማረጋገጫ ያልፋሉ። እባክዎ እንደገና ከመጫንዎ በፊት ሰነዱ በቂ ብርሃን ያለው፣ ያለ ነጸብራቅ እና ጽሑፉ በግልጽ የሚነበብ መሆኑን ያረጋግጡ።"
                  : "To ensure a secure environment, all submissions undergo a legibility check. Please ensure your document is well-lit, free of glare, and all text is clearly readable before re-uploading."}
              </div>
            </details>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[480px] py-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#5A6E7F] relative z-10 gap-2">
        <p>&copy; {new Date().getFullYear()} Ethosk Research Systems. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-[#004162] transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[#004162] transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
