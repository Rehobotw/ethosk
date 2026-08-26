import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TIER_RANK,
  type DocReviewStatus,
  type DocType,
  type RespondentProfileRecord,
} from "@shared/types";
import {
  validateDocumentFile,
  type InstitutionalDetailsInput,
} from "@shared/validation/schemas";
import {
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

interface DocumentRow {
  id: string;
  doc_type: DocType;
  status: DocReviewStatus;
  ai_notes: string | null;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  student_id: "Student ID Card",
  employer_id: "Employee Badge / Work ID",
  degree: "Degree Certificate / Transcript",
};

const STATUS_CONFIG: Record<
  DocReviewStatus,
  { label: string; className: string; icon: string; description: string }
> = {
  processing: {
    label: "Pending AI Verification",
    className: "bg-surface-container-high text-primary border border-primary/20 animate-pulse",
    icon: "hourglass_top",
    description: "Automated legibility and name-matching check in progress…",
  },
  passed: {
    label: "Verified",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold",
    icon: "verified",
    description: "Document confirmed and approved. Tier 2 unlocked.",
  },
  failed: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border border-rose-300 font-bold",
    icon: "cancel",
    description: "Document could not be verified. Please check notes and resubmit.",
  },
  needs_review: {
    label: "Pending Manual Review",
    className: "bg-amber-50 text-amber-800 border border-amber-300 font-medium",
    icon: "person_search",
    description: "Queued for administrator verification review.",
  },
};

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const { user, refresh } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  // Institutional form state
  const [institutionType, setInstitutionType] = useState<string>("university");
  const [institutionName, setInstitutionName] = useState("");
  const [department, setDepartment] = useState("");
  const [positionOrYear, setPositionOrYear] = useState("");
  const [instFormSuccess, setInstFormSuccess] = useState<string | null>(null);
  const [instFormError, setInstFormError] = useState<string | null>(null);

  // Email OTP state
  const [instEmail, setInstEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [docType, setDocType] = useState<DocType>("student_id");
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isTier1Completed = currentRank >= TIER_RANK["1_id_verified"];
  const isTier2Verified = currentRank >= TIER_RANK["2_attribute_verified"];

  const { data: profile } = useQuery({
    queryKey: ["respondent-profile"],
    queryFn: () => api<RespondentProfileRecord>("/respondents/profile"),
  });

  useEffect(() => {
    if (profile) {
      if (profile.university) {
        setInstitutionType("university");
        setInstitutionName(profile.university);
        setDepartment(profile.department ?? "");
        setPositionOrYear(profile.year ? profile.year.toString() : "");
      } else if (profile.employer) {
        setInstitutionType("corporate");
        setInstitutionName(profile.employer);
        setDepartment(profile.department ?? "");
        setPositionOrYear(profile.job_title ?? "");
      }
    }
  }, [profile]);

  const { data, isLoading } = useQuery<{ documents: DocumentRow[] }>({
    queryKey: ["documents"],
    queryFn: () => api("/respondents/documents"),
  });

  const saveDetailsMutation = useMutation({
    mutationFn: (payload: InstitutionalDetailsInput) =>
      api("/respondents/institutional-details", { body: payload }),
    onSuccess: () => {
      setInstFormSuccess(isAm ? "የተቋሙ መረጃ በተሳካ ሁኔታ ተቀምጧል።" : "Institutional details saved successfully.");
      setInstFormError(null);
      queryClient.invalidateQueries({ queryKey: ["respondent-profile"] });
      if (refresh) refresh();
    },
    onError: (err: any) => {
      setInstFormError(err?.message || (isAm ? "የተቋሙን መረጃ ማስቀመጥ አልተሳካም።" : "Failed to save institutional details."));
      setInstFormSuccess(null);
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: (email: string) =>
      api<{ success: boolean; dev_otp?: string }>("/respondents/email/send-otp", {
        body: { email },
      }),
    onSuccess: (res) => {
      setOtpSent(true);
      setOtpError(null);
      if (res.dev_otp) setOtpDevCode(res.dev_otp);
    },
    onError: (err: any) => {
      setOtpError(err?.message || (isAm ? "የማረጋገጫ ኮድ መላክ አልተሳካም።" : "Failed to send verification code."));
    },
  });

  const confirmOtpMutation = useMutation({
    mutationFn: (payload: { email: string; code: string }) =>
      api("/respondents/email/confirm-otp", { body: payload }),
    onSuccess: () => {
      setOtpSuccess(true);
      setOtpError(null);
      queryClient.invalidateQueries({ queryKey: ["respondent-profile"] });
      if (refresh) refresh();
    },
    onError: (err: any) => {
      setOtpError(err?.message || (isAm ? "የተሳሳተ የማረጋገጫ ኮድ።" : "Invalid OTP code. Please retry."));
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      return api("/respondents/verify-document", {
        body: {
          document_type: docType,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        },
      });
    },
    onSuccess: () => {
      setUploadSuccess(
        isAm
          ? "ሰነዱ በተሳካ ሁኔታ ገብቷል! የማረጋገጫ ግምገማ ተጀምሯል።"
          : "Document uploaded successfully! AI consistency check in progress."
      );
      setClientError(null);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        refresh ? refresh() : Promise.resolve(),
      ]);
    },
  });

  const handleFileChange = (file: File | undefined) => {
    setClientError(null);
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setClientError(validation.error || (isAm ? "ትክክለኛ ያልሆነ ፋይል" : "Invalid file."));
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setSelectedFile(file);
    upload.mutate(file);
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

  const handleOtpDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      nextInput?.focus();
    }

    // If all 6 digits filled, auto-confirm
    const fullCode = newDigits.join("");
    if (fullCode.length === 6) {
      confirmOtpMutation.mutate({
        email: instEmail.trim(),
        code: fullCode,
      });
    }
  };

  const handleSubmitAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (institutionName.trim() && department.trim() && positionOrYear.trim()) {
      saveDetailsMutation.mutate({
        institution_type: (institutionType === "corporate" ? "corporate" : "university"),
        institution_name: institutionName.trim(),
        department: department.trim(),
        position_or_year: positionOrYear.trim(),
      });
    }
    navigate("/inbox");
  };

  return (
    <div className="space-y-8 font-body text-on-surface pb-16 max-w-4xl mx-auto">
      {/* ── Main Gating: Tier 1 Must be Completed First ── */}
      {!isTier1Completed ? (
        <Card className="p-8 border-amber-300 bg-amber-50/60 rounded-2xl shadow-sm text-center">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                {isAm ? "የደረጃ 1 ማረጋገጫ ቀድሞ ያስፈልጋል" : "Tier 1 Verification Required First"}
              </h3>
              <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                {isAm
                  ? "የደረጃ 2 የተቋም ማረጋገጫ ከመጀመርዎ በፊት የደረጃ 1 ብሔራዊ መታወቂያ (ፋይዳ) ማረጋገጫ ማጠናቀቅ አለብዎት።"
                  : "You must complete Tier 1 Fayda National ID Verification before unlocking Tier 2 Institutional Verification."}
              </p>
            </div>
            <Link to="/verify">
              <Button className="shadow-md" icon="fingerprint">
                {isAm ? "ደረጃ 1ን አረጋግጥ" : "Complete Tier 1 Verification"}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* ── Verification Form Card (Stitch Screen e49cfbc0a0ae4106821581c42e8cec19) ── */}
          <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-[0_12px_24px_rgba(0,75,99,0.05)] p-6 md:p-8">
            {/* Header Section */}
            <div className="mb-8 text-center md:text-left border-b border-outline-variant/40 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <h1 className="font-headline font-bold text-2xl md:text-3xl text-primary">
                  {isAm ? "ደረጃ 2 ማረጋገጫ፡ የትምህርትና ተቋም" : "Tier 2 Verification: Academic & Institutional"}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eff4ff] border border-emerald-400/40 rounded-full self-start md:self-auto">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                  <span className="font-label text-[11px] font-bold text-emerald-700 tracking-wider uppercase">
                    {isTier2Verified ? (isAm ? "ደረጃ 2 ተረጋግጧል" : "Tier 2 Verified") : (isAm ? "ደረጃ 1 ተጠናቋል" : "Tier 1 Complete")}
                  </span>
                </div>
              </div>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-2xl">
                {isAm
                  ? "የትምህርት ወይም የስራ ተቋምዎን በማረጋገጥ ልዩ የምርምር ፓነሎችን፣ ከፍተኛ ሽልማት ያላቸው ጥናቶችን እና የተቋም መሳሪያዎችን ያግኙ።"
                  : "Unlock access to specialized research panels, premium surveys, and advanced institutional tools by verifying your academic or corporate affiliation."}
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmitAll} className="space-y-7">
              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Institution Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="instType">
                    {isAm ? "የተቋሙ አይነት" : "Institution Type"}
                  </label>
                  <div className="relative">
                    <select
                      id="instType"
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                      className="w-full appearance-none bg-surface-bright border border-outline-variant rounded-lg py-2.5 px-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none pr-9 cursor-pointer"
                    >
                      <option value="university">{isAm ? "ዩኒቨርሲቲ / ከፍተኛ ትምህርት" : "University / Academia"}</option>
                      <option value="corporate">{isAm ? "ድርጅት / ኩባንያ" : "Corporate"}</option>
                      <option value="ngo">{isAm ? "መንግስታዊ ያልሆነ ድርጅት (NGO)" : "NGO"}</option>
                      <option value="government">{isAm ? "የመንግስት ተቋም" : "Government"}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Institution Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="instName">
                    {isAm ? "የተቋሙ ስም" : "Institution Name"}
                  </label>
                  <input
                    id="instName"
                    type="text"
                    placeholder={isAm ? "ምሳሌ፡ አዲስ አበባ ዩኒቨርሲቲ" : "e.g., Addis Ababa University"}
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg py-2.5 px-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none"
                  />
                </div>

                {/* Department / Faculty */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="dept">
                    {isAm ? "ክፍል / ፋኩልቲ" : "Department / Faculty"}
                  </label>
                  <input
                    id="dept"
                    type="text"
                    placeholder={isAm ? "ምሳሌ፡ የኮምፒውተር ሳይንስ" : "e.g., Computer Science"}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg py-2.5 px-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none"
                  />
                </div>

                {/* Academic Year / Role */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="roleOrYear">
                    {isAm ? "የትምህርት ዘመን / የስራ ድርሻ" : "Academic Year / Role"}
                  </label>
                  <input
                    id="roleOrYear"
                    type="text"
                    placeholder={isAm ? "ምሳሌ፡ ከፍተኛ ተመራማሪ" : "e.g., Senior Researcher"}
                    value={positionOrYear}
                    onChange={(e) => setPositionOrYear(e.target.value)}
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg py-2.5 px-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Institutional Email & OTP Module ── */}
              <div className="bg-[#f0f5fb]/70 rounded-xl p-5 md:p-6 border border-outline-variant/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                    </div>
                    <h3 className="font-headline font-semibold text-base text-primary">
                      {isAm ? "የተቋም ኢሜይል ማረጋገጫ" : "Institutional Email Verification"}
                    </h3>
                  </div>
                  {otpSuccess && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {isAm ? "ኢሜይሉ ተረጋግጧል" : "Email Verified"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 flex flex-col gap-1.5 w-full">
                    <label className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="instEmail">
                      {isAm ? "የተቋሙ ኢሜይል አድራሻ" : "Email Address"}
                    </label>
                    <input
                      id="instEmail"
                      type="email"
                      placeholder="username@institution.edu"
                      value={instEmail}
                      disabled={otpSuccess}
                      onChange={(e) => setInstEmail(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3.5 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none"
                    />
                  </div>
                  {!otpSuccess && (
                    <button
                      type="button"
                      onClick={() => instEmail.trim() && sendOtpMutation.mutate(instEmail.trim())}
                      disabled={!instEmail.includes("@") || sendOtpMutation.isPending}
                      className="w-full md:w-auto px-6 py-2.5 bg-secondary-container text-on-secondary-container font-body font-bold text-xs sm:text-sm rounded-full hover:bg-secondary-fixed-dim transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
                    >
                      {sendOtpMutation.isPending ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                      ) : otpSent ? (
                        isAm ? "ኮድ በድጋሚ ላክ" : "Resend OTP"
                      ) : (
                        isAm ? "የ6-ዲጂት ኮድ ላክ" : "Send 6-Digit OTP"
                      )}
                    </button>
                  )}
                </div>

                {otpSent && !otpSuccess && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-3 animate-in fade-in duration-200">
                    <label className="font-body text-xs font-semibold text-on-surface-variant block">
                      {isAm ? "የማረጋገጫ ኮዱን ያስገቡ" : "Enter Verification Code"}
                    </label>
                    {otpDevCode && (
                      <div className="text-[11px] text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-lg inline-block">
                        Demo OTP Code: <strong>{otpDevCode}</strong>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            id={`otp-digit-${idx}`}
                            type="text"
                            maxLength={1}
                            value={otpDigits[idx]}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            className="w-11 h-11 text-center font-mono font-bold text-lg border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none"
                          />
                        ))}
                      </div>
                      <span className="text-outline-variant self-center font-bold text-lg px-1">-</span>
                      <div className="flex gap-2">
                        {[3, 4, 5].map((idx) => (
                          <input
                            key={idx}
                            id={`otp-digit-${idx}`}
                            type="text"
                            maxLength={1}
                            value={otpDigits[idx]}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            className="w-11 h-11 text-center font-mono font-bold text-lg border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {otpError && <Notice tone="error">{otpError}</Notice>}
              </div>

              {/* ── Document Evidence Upload ── */}
              <div>
                <h3 className="font-headline font-semibold text-base text-primary mb-2">
                  {isAm ? "የማረጋገጫ ሰነድ" : "Supporting Document"}
                </h3>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInput.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                    dragActive
                      ? "border-primary bg-[#eff4ff]"
                      : selectedFile
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-outline-variant bg-[#fbfcfe] hover:bg-[#eff4ff]/60 hover:border-primary"
                  }`}
                >
                  <input
                    ref={fileInput}
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    type="file"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                    <span className={`material-symbols-outlined text-3xl ${selectedFile ? "text-emerald-600" : "text-primary"}`}>
                      {selectedFile ? "task_alt" : "cloud_upload"}
                    </span>
                  </div>
                  <p className="font-body text-sm font-semibold text-on-surface mb-1">
                    {selectedFile
                      ? selectedFile.name
                      : (isAm ? "የተማሪ ወይም የሰራተኛ መታወቂያ ለመጫን እዚህ ይጫኑ" : "Click to upload Student ID or Employee Badge")}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant max-w-md">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${isAm ? "ለመቀየር እንደገና ይጫኑ" : "Click to change file"}`
                      : "PNG, JPG, or PDF up to 10MB. Ensure all text and the photo are clearly visible."}
                  </p>
                </div>

                {uploadSuccess && <div className="mt-3"><Notice tone="success">{uploadSuccess}</Notice></div>}
                {clientError && <div className="mt-3"><Notice tone="error">{clientError}</Notice></div>}
              </div>

              {/* ── Footer Actions ── */}
              <div className="pt-4 border-t border-outline-variant/40 flex flex-col-reverse md:flex-row justify-end items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/inbox")}
                  className="w-full md:w-auto px-6 py-2.5 bg-transparent text-on-surface-variant font-body font-semibold rounded-full hover:bg-surface-container-high transition-colors cursor-pointer text-sm"
                >
                  {isAm ? "ለጊዜው ይለፉ" : "Skip for now"}
                </button>
                <button
                  type="submit"
                  disabled={upload.isPending || saveDetailsMutation.isPending}
                  className="w-full md:w-auto px-7 py-3 bg-primary text-white font-body font-bold text-sm rounded-full hover:bg-surface-tint transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {upload.isPending || saveDetailsMutation.isPending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <span>{isAm ? "የደረጃ 2 መረጃዎችን አስገባ" : "Submit Tier 2 Credentials"}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Upload History and Review Queue Status ── */}
          <section className="space-y-4">
            <h2 className="font-headline font-semibold text-lg text-on-surface">
              {isAm ? "የሰነድ ማረጋገጫ ሁኔታ" : "Document Verification Status"}
            </h2>

            {isLoading ? <LoadingBlock /> : null}

            {data && data.documents.length === 0 ? (
              <EmptyState icon="description" title={isAm ? "የተጫነ ሰነድ የለም" : "No documents uploaded"}>
                {isAm
                  ? "የደረጃ 2 ማረጋገጫ ለመጀመር የተማሪ ወይም የስራ መታወቂያዎን ይጫኑ።"
                  : "Upload your Student ID or Work Badge to trigger Tier 2 verification."}
              </EmptyState>
            ) : null}

            <div className="space-y-3">
              {data?.documents.map((document) => {
                const status = STATUS_CONFIG[document.status];
                return (
                  <Card className="p-4 md:p-5" key={document.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline text-sm font-bold text-on-surface">
                          {DOC_TYPE_LABELS[document.doc_type]}
                        </p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">
                          {new Date(document.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs ${status.className}`}
                      >
                        <span className="material-symbols-outlined text-sm">{status.icon}</span>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant/90">
                      {status.description}
                    </p>
                    {document.ai_notes ? (
                      <p className="mt-2 rounded-lg bg-surface-container-high/50 p-2.5 text-xs text-on-surface-variant border border-outline-variant/40">
                        <span className="font-semibold text-on-surface">Verification notes: </span>
                        {document.ai_notes}
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
