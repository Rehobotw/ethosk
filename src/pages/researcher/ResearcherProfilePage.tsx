import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResearcherProfileRecord, ResearcherWallet } from "@shared/types";
import {
  Button,
  Card,
  Field,
  Icon,
  Input,
  LoadingBlock,
  Notice,
  Textarea,
  Toggle,
} from "@/components/ui";
import { AccountDeletionModal } from "@/components/AccountDeletionModal";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const RESEARCHER_TYPES = [
  { value: "academic", label: "Academic Researcher" },
  { value: "corporate", label: "Enterprise / Market Researcher" },
  { value: "ngo", label: "NGO / Development Worker" },
  { value: "independent", label: "Independent Consultant" },
  { value: "public_sector", label: "Public Sector / Policy Analyst" },
];

export function ResearcherProfilePage() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get("tab") as
    | "verification"
    | "settings"
    | "subscription"
    | "edit") || "verification";

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(
    null,
  );

  // Form Fields
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [researcherType, setResearcherType] = useState("academic");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [institutionalEmail, setInstitutionalEmail] = useState("");
  const [dob, setDob] = useState("");

  // Social Links
  const [linkedin, setLinkedin] = useState("");
  const [orcid, setOrcid] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");

  // Settings & Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailOnResponse, setEmailOnResponse] = useState(true);
  const [emailOnFlagged, setEmailOnFlagged] = useState(true);
  const [emailOnLowBalance, setEmailOnLowBalance] = useState(true);

  // Queries
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<ResearcherProfileRecord>("/researchers/profile"),
  });

  const { data: walletData } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? "");
      setInstitution(profile.institution ?? "");
      setResearcherType(profile.researcher_type ?? "academic");
      setYearsExperience(profile.years_experience ?? "");
      setPhone(profile.phone ?? "");
      setInstitutionalEmail(profile.institutional_email ?? "");
      setDob(profile.dob ?? "");

      const links = profile.social_links || {};
      setLinkedin(links.linkedin ?? "");
      setOrcid(links.orcid ?? "");
      setWebsite(links.website ?? "");
      setTwitter(links.twitter ?? "");
    }
  }, [profile]);

  // Mutations
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      return api<ResearcherProfileRecord>("/researchers/profile", {
        method: "POST",
        body: {
          bio: bio.trim() || null,
          institution: institution.trim() || null,
          researcher_type: researcherType,
          years_experience: typeof yearsExperience === "number" ? yearsExperience : null,
          phone: phone.trim() || null,
          institutional_email: institutionalEmail.trim() || null,
          dob: dob || null,
          social_links: {
            ...(linkedin.trim() && { linkedin: linkedin.trim() }),
            ...(orcid.trim() && { orcid: orcid.trim() }),
            ...(website.trim() && { website: website.trim() }),
            ...(twitter.trim() && { twitter: twitter.trim() }),
          },
        },
      });
    },
    onSuccess: async () => {
      setBanner({ tone: "success", text: "Profile details saved successfully." });
      await queryClient.invalidateQueries({ queryKey: ["researcher-profile"] });
      await refresh();
    },
    onError: (err) => {
      setBanner({
        tone: "error",
        text: err instanceof ApiRequestError ? err.message : "Failed to save profile.",
      });
    },
  });

  const requestVerificationMutation = useMutation({
    mutationFn: async () => {
      return api<{ message: string }>("/researchers/request-verification", {
        method: "POST",
      });
    },
    onSuccess: async (res) => {
      setBanner({ tone: "success", text: res.message || "Verification update requested." });
      await queryClient.invalidateQueries({ queryKey: ["researcher-profile"] });
    },
    onError: (err) => {
      setBanner({
        tone: "error",
        text: err instanceof ApiRequestError ? err.message : "Verification request failed.",
      });
    },
  });

  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return api<{ status: string }>("/wallet/researcher/subscription", {
        method: "POST",
      });
    },
    onSuccess: async () => {
      setBanner({ tone: "success", text: "Successfully upgraded to Ethosk Pro subscription!" });
      await queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
      await queryClient.invalidateQueries({ queryKey: ["researcher-profile"] });
      await refresh();
    },
    onError: (err) => {
      setBanner({
        tone: "error",
        text: err instanceof ApiRequestError ? err.message : "Subscription upgrade failed.",
      });
    },
  });

  if (profileLoading && !user) return <LoadingBlock label="Loading researcher profile…" />;

  const isSubscribed = user?.subscription_tier === "subscribed" || user?.role === "admin";

  const getResearcherTypeLabel = () => {
    const found = RESEARCHER_TYPES.find((t) => t.value === (profile?.researcher_type || researcherType));
    return found ? found.label : "Academic Researcher";
  };

  const emailPrefix = user?.email ? user.email.split("@")[0] : "researcher";

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6 pb-24">
      {/* ── Page Title & Subtitle (Stitch Spec) ── */}
      <div className="pt-2 md:pt-4">
        <h1 className="text-2xl md:text-4xl font-bold font-headline text-[#001d29] tracking-tight mb-2">
          Profile &amp; Settings
        </h1>
        <p className="text-sm text-[#41484c]">
          Manage your institutional identity, security preferences, and verification status.
        </p>
      </div>

      {banner ? (
        <Notice onDismiss={() => setBanner(null)} tone={banner.tone}>
          {banner.text}
        </Notice>
      ) : null}

      {/* ── Top Profile Summary Card (Stitch Spec) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8 shadow-[0_4px_16px_rgba(0,51,69,0.05)] relative overflow-hidden">
        {/* Subtle decorative background radial glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0e8ff]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Profile Photo & Info */}
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer shrink-0">
              <span className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-[#003345] text-2xl md:text-3xl font-bold text-white shadow-sm ring-4 ring-[#f8f9ff]">
                {(user?.full_name || user?.email || "Dr. B")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              <div className="absolute inset-0 bg-[#001d29]/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                <Icon className="text-white text-[20px]" name="photo_camera" />
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-headline font-bold text-[#001d29] mb-1">
                {user?.full_name || "Dr. Tesfaye Bekele"}
              </h2>

              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-xs md:text-sm font-mono text-[#41484c]">
                  @{emailPrefix}
                </span>
                <span className="px-2.5 py-0.5 bg-[#bfe8ff] text-[#001f2b] text-[11px] font-mono uppercase tracking-wider rounded font-bold">
                  {getResearcherTypeLabel()}
                </span>
                {isSubscribed && (
                  <span className="px-2 py-0.5 bg-[#0B2B42] text-white text-[10px] font-mono uppercase tracking-wider rounded font-bold">
                    PRO TIER
                  </span>
                )}
              </div>

              <p className="text-[#41484c] text-xs md:text-sm flex items-center gap-1.5">
                <Icon className="text-[16px] text-[#71787c]" name="account_balance" />
                <span>
                  {institution || profile?.institution || "Addis Ababa University · Faculty of Public Health"}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Social Icons & Action */}
          <div className="flex flex-col md:items-end gap-4 border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="flex items-center gap-2.5">
              {linkedin ? (
                <a
                  href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-[#c1c7cc] flex items-center justify-center text-[#71787c] hover:text-[#001d29] hover:border-[#001d29] transition-colors"
                  title="LinkedIn"
                >
                  <span className="font-bold text-xs">in</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className="w-9 h-9 rounded-full border border-[#c1c7cc] flex items-center justify-center text-[#71787c] hover:text-[#001d29] hover:border-[#001d29] transition-colors cursor-pointer"
                  title="Add LinkedIn"
                >
                  <span className="font-bold text-xs">in</span>
                </button>
              )}

              {orcid ? (
                <a
                  href={orcid.startsWith("http") ? orcid : `https://orcid.org/${orcid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-[#c1c7cc] flex items-center justify-center text-[#71787c] hover:text-[#001d29] hover:border-[#001d29] transition-colors"
                  title="ORCID"
                >
                  <span className="font-bold text-xs">iD</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className="w-9 h-9 rounded-full border border-[#c1c7cc] flex items-center justify-center text-[#71787c] hover:text-[#001d29] hover:border-[#001d29] transition-colors cursor-pointer"
                  title="Add ORCID"
                >
                  <span className="font-bold text-xs">iD</span>
                </button>
              )}

              {website ? (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-[#c1c7cc] flex items-center justify-center text-[#71787c] hover:text-[#001d29] hover:border-[#001d29] transition-colors"
                  title="Website"
                >
                  <Icon className="text-[18px]" name="language" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className="w-9 h-9 rounded-full border border-[#c1c7cc] flex items-center justify-center text-[#71787c] hover:text-[#001d29] hover:border-[#001d29] transition-colors cursor-pointer"
                  title="Add Website"
                >
                  <Icon className="text-[18px]" name="language" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTab(activeTab === "edit" ? "verification" : "edit")}
              className="px-5 py-2 bg-[#001d29] text-white rounded-full text-xs md:text-sm font-semibold hover:bg-[#003345] transition-colors cursor-pointer shadow-xs"
            >
              {activeTab === "edit" ? "Close Editor" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout Grid (Stitch Spec) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Tab Navigation */}
        <div className="lg:col-span-1">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 border-b lg:border-b-0 border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setTab("verification")}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === "verification"
                  ? "bg-[#dde9ff] text-[#001d29] shadow-xs"
                  : "text-[#41484c] hover:bg-[#eff4ff] hover:text-[#001d29]"
              }`}
            >
              <Icon className="text-[20px]" name="shield_person" />
              <span>Verification</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#dde9ff] text-[#001d29] shadow-xs"
                  : "text-[#41484c] hover:bg-[#eff4ff] hover:text-[#001d29]"
              }`}
            >
              <Icon className="text-[20px]" name="lock" />
              <span>Settings &amp; Security</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("subscription")}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === "subscription"
                  ? "bg-[#dde9ff] text-[#001d29] shadow-xs"
                  : "text-[#41484c] hover:bg-[#eff4ff] hover:text-[#001d29]"
              }`}
            >
              <Icon className="text-[20px]" name="receipt_long" />
              <span>Subscription &amp; Billing</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("edit")}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === "edit"
                  ? "bg-[#dde9ff] text-[#001d29] shadow-xs"
                  : "text-[#41484c] hover:bg-[#eff4ff] hover:text-[#001d29]"
              }`}
            >
              <Icon className="text-[20px]" name="edit_note" />
              <span>Professional Details</span>
            </button>
          </nav>
        </div>

        {/* Right Canvas Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 1: Verification (Stitch Screen Default)               ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-headline font-bold text-[#001d29]">
                Identity Verification Status
              </h3>

              {/* Status Card 1: Verified Identity */}
              <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-[0_4px_12px_rgba(0,51,69,0.05)] relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Icon className="text-[28px]" name="verified_user" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="font-bold text-[#001d29] text-base md:text-lg">
                        Verified Researcher Identity
                      </h4>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-mono uppercase tracking-wide font-bold flex items-center gap-1">
                        <Icon className="text-[14px]" name="check" />
                        <span>Verified Organization &amp; National ID</span>
                      </span>
                    </div>

                    <div className="bg-[#f8f9ff] rounded-xl p-4 mt-4 border border-[#E2E8F0] font-mono text-xs md:text-sm text-[#41484c] space-y-2.5">
                      <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[#71787c]">Institution:</span>
                        <span className="text-[#001d29] font-medium">
                          {institution || profile?.institution || "Addis Ababa University"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[#71787c]">TIN / National ID:</span>
                        <span className="text-[#001d29] font-medium">
                          {(user as unknown as Record<string, unknown>)?.national_id_hash
                            ? `FIN: ${String((user as unknown as Record<string, unknown>).national_id_hash).slice(0, 10)}…`
                            : "0048291029"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-[#71787c]">Auth Methods:</span>
                        <span className="text-[#001d29] font-medium">
                          Fayda FIN &amp; Institutional Email eSignet Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card 2: Credential & IRB Documentation */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_4px_12px_rgba(0,51,69,0.05)]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Icon className="text-[22px] text-[#2872A1]" name="folder_managed" />
                      <h4 className="font-bold text-[#001d29] text-base md:text-lg">
                        Credential &amp; IRB Documentation
                      </h4>
                    </div>

                    <p className="text-[#41484c] text-xs md:text-sm mb-5 leading-relaxed">
                      Current institutional authorization documents on file. Ensure these are kept up to date for uninterrupted platform access.
                    </p>

                    {/* PDF Preview Box */}
                    <div className="flex items-center gap-4 bg-[#eff4ff] border border-[#c1c7cc]/40 rounded-xl p-3.5 group hover:border-[#2872A1]/60 transition-colors">
                      <div className="w-10 h-12 bg-white rounded-lg border border-[#c1c7cc]/50 flex flex-col items-center justify-center relative overflow-hidden shrink-0 shadow-2xs">
                        <div className="absolute top-0 right-0 w-3 h-3 bg-[#eff4ff] border-b border-l border-[#c1c7cc]/50"></div>
                        <span className="font-mono text-[9px] text-[#001d29] font-bold">PDF</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-[#001d29] truncate">
                          institutional_authorization_2026.pdf
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#71787c] font-mono">2.4 MB</span>
                          <span className="w-1 h-1 rounded-full bg-[#71787c]"></span>
                          <span className="text-[11px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                            <Icon className="text-[13px]" name="task_alt" />
                            <span>Document Legibility Checked</span>
                          </span>
                        </div>
                      </div>

                      <a
                        href="/api/researchers/sample-doc"
                        download="institutional_authorization_2026.pdf"
                        className="p-2 text-[#71787c] hover:text-[#001d29] hover:bg-white rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Icon className="text-[20px]" name="download" />
                      </a>
                    </div>
                  </div>

                  {/* Re-verify action box */}
                  <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-4 md:pt-0 md:pl-6 shrink-0">
                    <p className="text-xs text-[#41484c] mb-4">
                      Next review required by: <strong className="text-[#001d29]">Oct 14, 2026</strong>
                    </p>

                    <button
                      type="button"
                      onClick={() => requestVerificationMutation.mutate()}
                      disabled={requestVerificationMutation.isPending}
                      className="w-full px-4 py-2.5 bg-[#dde9ff] text-[#001d29] border border-[#c1c7cc]/50 rounded-full text-xs md:text-sm font-bold hover:bg-[#c0e8ff] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Icon className="text-[18px]" name="update" />
                      <span>{requestVerificationMutation.isPending ? "Submitting…" : "Re-Verify / Update"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 2: Professional Details Edit Canvas                   ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeTab === "edit" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-headline font-bold text-[#001d29]">
                Professional Details &amp; Bio
              </h3>

              <Card className="p-6 space-y-4">
                <Field label="Researcher Type">
                  <select
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={researcherType}
                    onChange={(e) => setResearcherType(e.target.value)}
                  >
                    {RESEARCHER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Organization / Institution Affiliation">
                  <Input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g., Addis Ababa University / Ministry of Health"
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Institutional Domain Email">
                    <Input
                      value={institutionalEmail}
                      onChange={(e) => setInstitutionalEmail(e.target.value)}
                      placeholder="e.g., researcher@aau.edu.et"
                      type="email"
                    />
                  </Field>

                  <Field label="Years of Research Experience">
                    <Input
                      value={yearsExperience}
                      onChange={(e) =>
                        setYearsExperience(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="e.g., 6"
                      type="number"
                    />
                  </Field>
                </div>

                <Field
                  hint={`Max 1000 characters. ${bio.length}/1000`}
                  label="Researcher Bio & Objectives"
                >
                  <Textarea
                    maxLength={1000}
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your research domains, primary interests, and previous initiatives..."
                  />
                </Field>
              </Card>

              {/* Social URLs */}
              <Card className="p-6 space-y-4">
                <h4 className="font-bold text-[#001d29] text-base">Academic &amp; Professional Links</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="LinkedIn Profile URL">
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </Field>

                  <Field label="ORCID Identifier">
                    <Input
                      value={orcid}
                      onChange={(e) => setOrcid(e.target.value)}
                      placeholder="0000-0002-1825-0097"
                    />
                  </Field>

                  <Field label="Lab or Organization Website">
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://institution.edu.et"
                    />
                  </Field>

                  <Field label="Twitter / X Profile">
                    <Input
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="@handle"
                    />
                  </Field>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 3: Settings & Security                                ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-headline font-bold text-[#001d29]">
                Settings &amp; Security
              </h3>

              {/* Password update card */}
              <Card className="p-6 space-y-4">
                <h4 className="font-bold text-[#001d29] text-base">Update Password</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="New Password">
                    <Input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      type="password"
                    />
                  </Field>
                  <Field label="Confirm Password">
                    <Input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      type="password"
                    />
                  </Field>
                </div>
              </Card>

              {/* Notification preferences */}
              <Card className="p-6 space-y-4">
                <h4 className="font-bold text-[#001d29] text-base">Notification Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Survey Response Notifications</p>
                      <p className="text-xs text-on-surface-variant">Get notified when respondents complete your survey.</p>
                    </div>
                    <Toggle label="Survey Response Notifications" checked={emailOnResponse} onChange={setEmailOnResponse} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Fraud Signal Alerts</p>
                      <p className="text-xs text-on-surface-variant">Instant alerts when responses are flagged for review.</p>
                    </div>
                    <Toggle label="Fraud Signal Alerts" checked={emailOnFlagged} onChange={setEmailOnFlagged} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Low Balance Reminders</p>
                      <p className="text-xs text-on-surface-variant">Alert when wallet balance drops below 200 ETB.</p>
                    </div>
                    <Toggle label="Low Balance Reminders" checked={emailOnLowBalance} onChange={setEmailOnLowBalance} />
                  </div>
                </div>
              </Card>

              {/* Danger Zone: Account Deletion */}
              <Card className="p-6 border-error/30 bg-error/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-error text-base">Delete Account</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Permanently remove your researcher account, past studies, and credentials.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-error hover:bg-error/90 text-white font-bold"
                    type="button"
                  >
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TAB 4: Subscription & Billing                             ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-headline font-bold text-[#001d29]">
                Subscription &amp; Billing
              </h3>

              <div className="bg-gradient-to-r from-[#003345] to-[#001d29] text-white p-6 md:p-8 rounded-2xl shadow-md space-y-4">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
                  Current Plan: {isSubscribed ? "Ethosk Pro" : "Free Starter"}
                </span>

                <h4 className="text-xl md:text-2xl font-bold font-headline">
                  {isSubscribed
                    ? "Full Access to Pro AI Survey Tools & Export"
                    : "Upgrade to Ethosk Pro for AI Survey Drafting & Raw Exports"}
                </h4>

                <p className="text-xs md:text-sm text-slate-200">
                  Wallet Balance: <strong>{walletData?.wallet.available_etb ?? 0} ETB</strong>
                </p>

                {!isSubscribed && (
                  <button
                    type="button"
                    onClick={() => upgradeSubscriptionMutation.mutate()}
                    disabled={upgradeSubscriptionMutation.isPending}
                    className="px-6 py-2.5 bg-white text-[#001d29] rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                  >
                    {upgradeSubscriptionMutation.isPending ? "Upgrading…" : "Upgrade to Pro (500 ETB/mo)"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed Bottom Footer Action Bar (Stitch Spec) ── */}
      <div className="fixed bottom-0 right-0 left-0 md:left-[260px] bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] p-4 px-6 md:px-8 flex justify-end z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => saveProfileMutation.mutate()}
          disabled={saveProfileMutation.isPending}
          className="px-6 py-2.5 bg-[#001d29] hover:bg-[#003345] text-white rounded-full text-xs md:text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Icon className="text-[18px]" name="save" />
          <span>{saveProfileMutation.isPending ? "Saving Changes…" : "Save Changes"}</span>
        </button>
      </div>

      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
