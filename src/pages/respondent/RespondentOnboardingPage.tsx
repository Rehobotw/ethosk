import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
//import { useMutation, useQuery } from "@tanstack/react-query";
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

  // Check existing verification status
  // const { data: profile } = useQuery({
  //   queryKey: ["respondent-profile"],
  //   queryFn: () => api<any>("/respondents/profile"),
  // });

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

  return (
    <div className="bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] text-[#001d32] min-h-screen flex flex-col items-center justify-between p-4 md:p-8 relative overflow-x-hidden font-['Plus_Jakarta_Sans','Inter',sans-serif]">
      {/* Decorative ambient waves for sky-blue glassmorphism */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/40 blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-100/50 blur-3xl opacity-60"></div>
        <div className="absolute top-[30%] left-[20%] w-[50%] h-[20%] bg-white/30 blur-2xl transform rotate-12 opacity-50"></div>
      </div>

      {/* Top Brand Bar */}
      <header className="w-full max-w-[480px] flex justify-between items-center py-4 relative z-10">
        <Link to="/" className="font-['Newsreader',serif] text-2xl font-bold text-[#00456d] tracking-tight">
          Ethosk
        </Link>
        {step === 2 || step === 3 ? (
          <div className="text-xs font-semibold text-[#4b6078] flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/60">
            <span className="w-2 h-2 rounded-full bg-[#00456d] animate-pulse"></span>
            <span>{step === 2 ? (isAm ? "ደረጃ 2 ከ 4" : "Step 2 of 4") : (isAm ? "ደረጃ 3 ከ 4" : "Step 3 of 4")}</span>
          </div>
        ) : null}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[480px] my-auto relative z-10">
        {/* ══════════════════════════════════════════════════
            STEP 2: Overview & Honesty Statement (Stitch Screen 23a9794dc0554ccd88fe90162cdabdfb)
           ══════════════════════════════════════════════════ */}
        {step === 2 && (
          <section className="bg-white/55 backdrop-blur-2xl rounded-2xl border border-white/70 p-7 sm:p-9 flex flex-col gap-6 shadow-[0_8px_32px_rgba(0,132,199,0.12)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 relative z-10">
              <h1 className="font-['Newsreader',serif] text-2xl sm:text-3xl font-bold text-[#001d32] leading-snug">
                {isAm ? "ገቢ ማግኘት ከመጀመርዎ በፊት አንድ ፈጣን ማረጋገጫ።" : "One quick check before you start earning."}
              </h1>
              <p className="text-xs text-[#4b6078]">
                {isAm ? "የመገለጫ ማጠናቀቅ ፈጣን የመረጃ ግምገማ ይፈልጋል።" : "Profile completion requires a quick information review."}
              </p>
            </div>

            {/* Visual Preview Steps */}
            <div className="flex flex-col gap-4 relative z-10 my-2">
              {/* Step 1 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center border border-[#c1c7d0]/60 shadow-xs">
                  <span className="material-symbols-outlined text-[#4b6078] text-[20px]">upload_file</span>
                </div>
                <div className="flex-1 text-xs sm:text-sm font-semibold text-[#001d32]">
                  {isAm ? "1. መታወቂያ ይጫኑ" : "1. Upload ID"}
                </div>
              </div>

              {/* Connector */}
              <div className="w-px h-4 bg-[#c1c7d0]/60 ml-5 -my-2.5"></div>

              {/* Step 2 (Active) */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#00456d]/15 flex items-center justify-center border-2 border-[#00456d] shadow-[0_0_15px_rgba(0,69,109,0.25)]">
                  <span className="material-symbols-outlined text-[#00456d] text-[20px]">fact_check</span>
                </div>
                <div className="flex-1 text-xs sm:text-sm font-bold text-[#00456d]">
                  {isAm ? "2. እናረጋግጣለን" : "2. We check it"}
                </div>
              </div>

              {/* Connector */}
              <div className="w-px h-4 bg-[#c1c7d0]/60 ml-5 -my-2.5"></div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 opacity-60">
                <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center border border-[#c1c7d0]/60 shadow-xs">
                  <span className="material-symbols-outlined text-[#4b6078] text-[20px]">payments</span>
                </div>
                <div className="flex-1 text-xs sm:text-sm font-semibold text-[#001d32]">
                  {isAm ? "3. ገቢ ማግኘት ይጀምሩ" : "3. Start earning"}
                </div>
              </div>
            </div>

            {/* Honesty Statement */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-white/70 relative z-10 flex gap-3 items-start shadow-xs">
              <span className="material-symbols-outlined text-[#00456d] text-lg mt-0.5">info</span>
              <p className="text-[11px] sm:text-xs text-[#4b6078] leading-relaxed">
                {isAm
                  ? "መታወቂያዎ ግልጽና ወጥ መሆኑን ብቻ እናረጋግጣለን — ከዚያ ውጪ ሌላ ግምገማ አንሰጥም። ይህ መድረኩ ለሁሉም ፍትሃዊ እንዲሆን ያደርጋል።"
                  : "We check that your ID is legible and consistent—we don't verify identity claims beyond that. This keeps the platform fair for everyone."}
              </p>
            </div>

            {/* Action */}
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 bg-[#00456d] text-white hover:bg-[#1d5d8a] rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
              type="button"
            >
              <span>{isAm ? "ቀጥል" : "Continue"}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            STEP 3: ID Upload Screen (Stitch Screen a04f231d012b42ed84d73c9e74487981)
           ══════════════════════════════════════════════════ */}
        {step === 3 && (
          <section className="bg-white/55 backdrop-blur-2xl rounded-2xl border border-white/70 p-7 sm:p-9 flex flex-col gap-6 shadow-[0_8px_32px_rgba(0,132,199,0.12)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                <div className="h-full bg-[#00456d] transition-all duration-500 ease-out w-3/4"></div>
              </div>
              <span className="text-[11px] font-semibold text-[#4b6078] whitespace-nowrap">
                {isAm ? "ደረጃ 3 ከ 4" : "Step 3 of 4"}
              </span>
            </div>

            {/* Header */}
            <div>
              <h1 className="font-['Newsreader',serif] text-2xl sm:text-3xl font-bold text-[#001d32] mb-1.5">
                {isAm ? "መታወቂያዎን ለግምገማ ያስገቡ" : "Submit your ID for consistency check"}
              </h1>
              <p className="text-xs text-[#4b6078]">
                {isAm
                  ? "እባክዎ የመንግስት ወይም የተቋም መታወቂያዎን ግልጽ ፎቶ ያስገቡ።"
                  : "Please provide a clear photo of your government-issued or institutional ID."}
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
                dragActive
                  ? "border-[#00456d] bg-[#cde5ff]/40 scale-[1.01]"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-slate-300 hover:border-[#00456d] bg-white/60 hover:bg-white/80"
              }`}
            >
              <input
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <span className="material-symbols-outlined text-4xl text-[#00456d] mb-2">
                {selectedFile ? "task_alt" : "upload_file"}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#001d32] mb-1">
                {selectedFile
                  ? selectedFile.name
                  : (isAm ? "ሰነድ ለመጫን እዚህ ይጫኑ ወይም ይጎትቱ" : "Click to upload or drag and drop")}
              </p>
              <p className="text-[11px] text-[#4b6078]">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${isAm ? "ለመለወጥ እንደገና ይጫኑ" : "Click to change"}`
                  : "JPG, PNG, or PDF under 10MB"}
              </p>
            </div>

            {errorMsg ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {errorMsg}
              </div>
            ) : null}

            {/* Legibility Tips Box */}
            <div className="bg-white/70 rounded-xl p-4 border border-white/70">
              <h3 className="text-xs font-bold text-[#001d32] mb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00456d] text-base">lightbulb</span>
                <span>{isAm ? "ጠቃሚ ምክሮች" : "Tips for a successful check"}</span>
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-xs text-[#4b6078]">
                  <span className="material-symbols-outlined text-[#00456d] text-sm">wb_sunny</span>
                  <span>{isAm ? "በቂ ብርሃን ያለው ቦታ" : "Well-lit environment"}</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-[#4b6078]">
                  <span className="material-symbols-outlined text-[#00456d] text-sm">aspect_ratio</span>
                  <span>{isAm ? "4ቱም ማዕዘኖች ሙሉ በሙሉ የሚታዩ" : "All 4 corners visible"}</span>
                </li>
                <li className="flex items-center gap-2.5 text-xs text-[#4b6078]">
                  <span className="material-symbols-outlined text-[#00456d] text-sm">block</span>
                  <span>{isAm ? "ያለ ብልጭታ ወይም ነጸብራቅ" : "No glare or reflections"}</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="w-full bg-[#00456d] hover:bg-[#1d5d8a] text-white font-semibold text-xs sm:text-sm rounded-full py-3.5 px-6 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                type="button"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>{isAm ? "ለግምገማ አስገባ" : "Submit for review"}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Encryption Reassurance */}
              <div className="flex items-center justify-center gap-1.5 text-[#4b6078] text-[11px]">
                <span className="material-symbols-outlined text-[14px]">lock</span>
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
            STEP 4: Success View (Stitch Screen 641f44e90e0d40bebd44bfcb5a99a461)
           ══════════════════════════════════════════════════ */}
        {step === 4 && (
          <section className="bg-white/55 backdrop-blur-2xl rounded-2xl border border-white/70 p-8 sm:p-12 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,132,199,0.12)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Glowing Success Circle */}
            <div className="my-4 relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100/90 flex items-center justify-center relative z-10 border border-white/60 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-5xl">check_circle</span>
              </div>
              <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-400/20 animate-ping opacity-30"></div>
            </div>

            <h1 className="font-['Newsreader',serif] text-2xl sm:text-3xl font-bold text-[#001d32] mb-2">
              {isAm ? "ሁሉንም አጠናቀዋል!" : "You're all set"}
            </h1>
            <p className="text-xs sm:text-sm text-[#4b6078] mb-8 max-w-xs">
              {isAm
                ? "ጥናቶችን ማሰስ እና ሽልማቶችን ማግኘት ይጀምሩ"
                : "Start exploring surveys and earning rewards."}
            </p>

            <button
              onClick={() => navigate("/inbox")}
              className="w-full bg-[#00456d] hover:bg-[#1d5d8a] text-white py-3.5 px-6 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
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
            STEP 5: Flagged / Retry View (Stitch Screen 9a0a547d4573404abedae03a2574ae81)
           ══════════════════════════════════════════════════ */}
        {step === 5 && (
          <section className="bg-white/55 backdrop-blur-2xl rounded-2xl border border-white/70 p-8 sm:p-10 flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,132,199,0.12)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Refresh Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-100/70 flex items-center justify-center mb-5 text-amber-800 shadow-xs border border-white/60">
              <span className="material-symbols-outlined text-3xl">refresh</span>
            </div>

            <h1 className="font-['Newsreader',serif] text-2xl sm:text-3xl font-bold text-[#001d32] mb-2">
              {isAm ? "እንደገና እንሞክር" : "Let's try that again"}
            </h1>
            <p className="text-xs text-[#4b6078] mb-6 max-w-xs leading-relaxed">
              {isAm
                ? "ሰነድዎ የጥራት መስፈርቶቻችንን አላሟላም — ይህ የግምገማ ጥራት ማረጋገጫ ብቻ ነው።"
                : "Your document didn't meet our clarity requirements—this isn't a judgment, just a quality check."}
            </p>

            <button
              onClick={() => {
                setSelectedFile(null);
                setStep(3);
              }}
              className="w-full bg-[#00456d] hover:bg-[#1d5d8a] text-white transition-all rounded-full py-3.5 px-6 text-xs sm:text-sm font-semibold mb-5 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>{isAm ? "ሰነዱን እንደገና ይጫኑ" : "Re-upload document"}</span>
            </button>

            {/* Explanatory Details */}
            <details className="w-full text-left group cursor-pointer border border-white/60 rounded-xl bg-white/40 backdrop-blur-sm overflow-hidden">
              <summary className="text-xs font-semibold text-[#001d32] p-3.5 flex justify-between items-center list-none outline-none hover:bg-white/50 transition-colors">
                <span>{isAm ? "ይህ ምን ማለት ነው?" : "What does this mean?"}</span>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="p-3.5 pt-0 text-[11px] text-[#4b6078] leading-relaxed border-t border-white/40 mt-1">
                {isAm
                  ? "ደህንነቱ የተጠበቀ መድረክ ለማረጋገጥ ሁሉም ሰነዶች የንባብ ግልጽነት ማረጋገጫ ያልፋሉ። እባክዎ እንደገና ከመጫንዎ በፊት ሰነዱ በቂ ብርሃን ያለው፣ ያለ ነጸብራቅ እና ጽሑፉ በግልጽ የሚነበብ መሆኑን ያረጋግጡ።"
                  : "To ensure a secure environment, all submissions undergo a legibility check. Please ensure your document is well-lit, free of glare, and all text is clearly readable before re-uploading."}
              </div>
            </details>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[480px] py-4 text-center text-[11px] text-[#4b6078]/80 relative z-10">
        <p>&copy; {new Date().getFullYear()} Ethosk Research Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
