import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TIER_RANK,
  type DocReviewStatus,
  type DocType,
  type RespondentProfileRecord,
} from "@shared/types";
import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  type InstitutionalDetailsInput,
} from "@shared/validation/schemas";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  Input,
  LoadingBlock,
  Notice,
  Select,
  TierBadge,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
    className: "bg-status-passed/15 text-flag-clean border border-status-passed/30 font-bold",
    icon: "verified",
    description: "Document confirmed and approved. Tier 2 unlocked.",
  },
  failed: {
    label: "Rejected",
    className: "bg-error-container text-on-error-container border border-error/30 font-bold",
    icon: "cancel",
    description: "Document could not be verified. Please check notes and resubmit.",
  },
  needs_review: {
    label: "Pending Manual Review",
    className: "bg-status-review/15 text-[#7c4a03] border border-status-review/30",
    icon: "person_search",
    description: "Queued for administrator verification review.",
  },
};

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const { user, refresh } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  // Institutional form state
  const [institutionType, setInstitutionType] = useState<"university" | "corporate">("university");
  const [institutionName, setInstitutionName] = useState("");
  const [department, setDepartment] = useState("");
  const [positionOrYear, setPositionOrYear] = useState("");
  const [instFormSuccess, setInstFormSuccess] = useState<string | null>(null);
  const [instFormError, setInstFormError] = useState<string | null>(null);

  // Email OTP state
  const [instEmail, setInstEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Document upload state
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
        setPositionOrYear(profile.occupation ?? "");
      }

      const attrs = (profile.attributes || {}) as Record<string, unknown>;
      if (attrs.institutional_email) {
        setInstEmail(attrs.institutional_email as string);
        if (attrs.institutional_email_verified) {
          setOtpSuccess(true);
        }
      }
    }
  }, [profile]);

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: DocumentRow[] }>("/respondents/documents"),
    refetchInterval: (query) =>
      query.state.data?.documents.some((doc) => doc.status === "processing") ? 3_000 : false,
  });

  const saveDetailsMutation = useMutation({
    mutationFn: (values: InstitutionalDetailsInput) =>
      api<RespondentProfileRecord>("/respondents/institutional-details", { body: values }),
    onSuccess: async () => {
      setInstFormSuccess("Institutional details saved successfully.");
      setInstFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["respondent-profile"] });
    },
    onError: (err) => {
      setInstFormSuccess(null);
      setInstFormError(err instanceof ApiRequestError ? err.message : "Failed to save details.");
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: (email: string) =>
      api<{ success: boolean; message: string; _dev_otp?: string }>(
        "/respondents/verify-institutional-email/request",
        { body: { email } },
      ),
    onSuccess: (res) => {
      setOtpSent(true);
      setOtpError(null);
      if (res._dev_otp) setOtpDevCode(res._dev_otp);
    },
    onError: (err) => {
      setOtpError(err instanceof ApiRequestError ? err.message : "Could not send verification code.");
    },
  });

  const confirmOtpMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      api<{ success: boolean }>("/respondents/verify-institutional-email/confirm", {
        body: { email, code },
      }),
    onSuccess: async () => {
      setOtpSuccess(true);
      setOtpError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["respondent-profile"] }),
        refresh(),
      ]);
    },
    onError: (err) => {
      setOtpError(err instanceof ApiRequestError ? err.message : "Invalid or expired code.");
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("doc_type", docType);
      formData.append("file", file);
      return api<{ document_id: string; status: string }>("/respondents/documents", { formData });
    },
    onSuccess: async () => {
      if (fileInput.current) fileInput.current.value = "";
      setUploadSuccess("Document uploaded! Automated legibility and name check in progress.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        refresh(),
      ]);
    },
  });

  const handleFile = (file: File | undefined) => {
    setClientError(null);
    if (!file) return;

    if (!ACCEPTED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ACCEPTED_UPLOAD_MIME_TYPES)[number])) {
      setClientError("That file type is not supported. Upload a JPEG, PNG, or PDF.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setClientError("That file is larger than 8MB. Upload a smaller version.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    upload.mutate(file);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || !department.trim() || !positionOrYear.trim()) {
      setInstFormError("Please complete all institutional fields.");
      return;
    }
    saveDetailsMutation.mutate({
      institution_type: institutionType,
      institution_name: institutionName.trim(),
      department: department.trim(),
      position_or_year: positionOrYear.trim(),
    });
  };

  return (
    <div className="space-y-stack-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">
            Tier 2 Institutional Verification
          </h1>
          <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
            Verify your university or corporate affiliation to access high-payout academic &amp; niche panel studies.
          </p>
        </div>
        {user ? <TierBadge tier={user.verification_tier} /> : null}
      </div>

      {/* Tier 2 Eligibility & Benefit Highlights */}
      <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/10 border-primary/20 p-stack-md">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Icon className="text-2xl" filled name="stars" />
          </div>
          <div>
            <h2 className="font-title-sm text-title-sm text-primary font-bold">
              Tier 2 Eligibility &amp; Premium Survey Access
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
              Tier 2 Verified respondents unlock <strong>3x to 10x higher-paying</strong> research studies, including NGO policy evaluations, university faculty research, corporate market tests, and specialized professional panel surveys.
            </p>
          </div>
        </div>
      </Card>

      {/* Gating Check: Must complete Tier 1 first */}
      {!isTier1Completed ? (
        <Card className="p-stack-lg border-amber-300 bg-amber-50/60">
          <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Icon className="text-3xl" name="lock" />
            </div>
            <div>
              <h3 className="font-title-sm text-title-md text-on-surface font-bold">
                Tier 1 Verification Required First
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                You must complete <strong>Tier 1 Fayda National ID Verification</strong> before accessing Tier 2 Institutional Verification and document uploads.
              </p>
            </div>
            <Link to="/verify">
              <Button className="shadow-md" icon="fingerprint">
                Complete Tier 1 Verification
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-stack-md lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
          {/* Main verification form steps */}
          <div className="space-y-stack-md">
            {/* Step 1: Institutional Details Form */}
            <Card className="p-stack-md">
              <div className="flex items-center gap-2 mb-stack-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                  1
                </span>
                <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                  Institutional Affiliation Details
                </h3>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mb-stack-md">
                Tell us about your university, research center, or company affiliation.
              </p>

              <form onSubmit={handleSaveDetails} className="space-y-stack-sm">
                <Field label="Affiliation Type">
                  <Select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value as "university" | "corporate")}
                  >
                    <option value="university">University / Higher Education (Student, Faculty, Staff)</option>
                    <option value="corporate">Corporate / Company / NGO (Employee, Professional)</option>
                  </Select>
                </Field>

                <Field
                  label={institutionType === "university" ? "University / Institution Name" : "Company / Organization Name"}
                >
                  <Input
                    placeholder={institutionType === "university" ? "e.g. Addis Ababa University" : "e.g. Commercial Bank of Ethiopia"}
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid gap-stack-sm sm:grid-cols-2">
                  <Field label="Department / Faculty / Division">
                    <Input
                      placeholder="e.g. Faculty of Technology / Marketing"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </Field>

                  <Field
                    label={institutionType === "university" ? "Academic Year (1–8)" : "Job Position / Title"}
                  >
                    <Input
                      placeholder={institutionType === "university" ? "e.g. 4" : "e.g. Senior Financial Analyst"}
                      value={positionOrYear}
                      onChange={(e) => setPositionOrYear(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                {instFormSuccess && <Notice tone="success">{instFormSuccess}</Notice>}
                {instFormError && <Notice tone="error">{instFormError}</Notice>}

                <Button
                  className="w-full mt-2"
                  loading={saveDetailsMutation.isPending}
                  type="submit"
                  variant="outline"
                >
                  Save Institutional Details
                </Button>
              </form>
            </Card>

            {/* Step 2: Institutional Email Verification (OTP) */}
            <Card className="p-stack-md">
              <div className="flex items-center justify-between mb-stack-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                    2
                  </span>
                  <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                    Institutional Email Verification
                  </h3>
                </div>
                {otpSuccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <Icon className="text-sm" filled name="check_circle" />
                    Email Verified
                  </span>
                )}
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mb-stack-md">
                Verify your institutional domain email address (`.edu.et`, `@org.et`, or corporate domain) via 6-digit OTP.
              </p>

              <div className="space-y-stack-sm">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. abebe.k@aau.edu.et"
                      type="email"
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                      disabled={otpSuccess}
                    />
                  </div>
                  {!otpSuccess && (
                    <Button
                      onClick={() => instEmail.trim() && sendOtpMutation.mutate(instEmail.trim())}
                      loading={sendOtpMutation.isPending}
                      disabled={!instEmail.includes("@") || sendOtpMutation.isPending}
                      variant="outline"
                    >
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                  )}
                </div>

                {otpSent && !otpSuccess && (
                  <div className="mt-stack-sm p-stack-sm rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2 animate-fade-in">
                    <p className="text-xs text-on-surface-variant">
                      Enter the 6-digit verification code sent to <strong>{instEmail}</strong>
                    </p>
                    {otpDevCode && (
                      <div className="text-[11px] text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                        Demo environment OTP: <strong>{otpDevCode}</strong>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        maxLength={6}
                        placeholder="123456"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="font-mono text-center tracking-widest text-base font-bold"
                      />
                      <Button
                        onClick={() =>
                          confirmOtpMutation.mutate({
                            email: instEmail.trim(),
                            code: emailOtp.trim(),
                          })
                        }
                        loading={confirmOtpMutation.isPending}
                        disabled={emailOtp.length < 6 || confirmOtpMutation.isPending}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}

                {otpError && <Notice tone="error">{otpError}</Notice>}
              </div>
            </Card>

            {/* Step 3: Document Upload */}
            <Card className="p-stack-md">
              <div className="flex items-center justify-between mb-stack-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                    3
                  </span>
                  <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                    Upload ID Badge or Degree Certificate
                  </h3>
                </div>
                {isTier2Verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <Icon className="text-sm" filled name="verified" />
                    Tier 2 Verified
                  </span>
                )}
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mb-stack-md">
                Upload your Student ID, Employee Badge, or Degree Certificate. Our automated AI checks legibility and name consistency against your profile.
              </p>

              <Field label="Document Type">
                <Select
                  onChange={(event) => setDocType(event.target.value as DocType)}
                  value={docType}
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <input
                accept={ACCEPTED_UPLOAD_MIME_TYPES.join(",")}
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
                ref={fileInput}
                type="file"
              />

              <Button
                className="mt-stack-md w-full py-3"
                icon="upload_file"
                loading={upload.isPending}
                onClick={() => fileInput.current?.click()}
              >
                Choose Document File
              </Button>

              <p className="mt-stack-sm text-center font-body-sm text-[12px] text-on-surface-variant">
                JPEG, PNG, or PDF · up to 8MB
              </p>

              {uploadSuccess ? (
                <div className="mt-stack-md">
                  <Notice tone="success">{uploadSuccess}</Notice>
                </div>
              ) : null}

              {clientError ? (
                <div className="mt-stack-md">
                  <Notice tone="error">{clientError}</Notice>
                </div>
              ) : null}

              {upload.error ? (
                <div className="mt-stack-md">
                  <Notice tone="error">
                    {upload.error instanceof ApiRequestError
                      ? upload.error.message
                      : "The upload did not complete."}
                  </Notice>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Upload History and Review Queue Status */}
          <section className="space-y-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
              Document Verification Status
            </h2>

            {isLoading ? <LoadingBlock /> : null}

            {data && data.documents.length === 0 ? (
              <EmptyState icon="description" title="No documents uploaded">
                Upload your Student ID or Work Badge to trigger Tier 2 verification.
              </EmptyState>
            ) : null}

            <div className="space-y-stack-sm">
              {data?.documents.map((document) => {
                const status = STATUS_CONFIG[document.status];
                return (
                  <Card className="p-stack-md" key={document.id}>
                    <div className="flex items-start justify-between gap-stack-sm">
                      <div>
                        <p className="font-title-sm text-body-md text-on-surface font-bold">
                          {DOC_TYPE_LABELS[document.doc_type]}
                        </p>
                        <p className="mt-base font-body-sm text-[12px] text-on-surface-variant">
                          {new Date(document.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-status-badge text-status-badge ${status.className}`}
                      >
                        <Icon className="text-[14px]" filled name={status.icon} />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-2 font-body-sm text-[13px] text-on-surface-variant/80">
                      {status.description}
                    </p>
                    {document.ai_notes ? (
                      <p className="mt-stack-sm rounded-lg bg-surface-container-high/50 p-2.5 font-body-sm text-xs text-on-surface-variant border border-outline-variant/40">
                        <span className="font-semibold text-on-surface">Verification notes: </span>
                        {document.ai_notes}
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
