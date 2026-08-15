import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  TierBadge,
  Toggle,
} from "@/components/ui";
import { AccountDeletionModal } from "@/components/AccountDeletionModal";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const RESEARCHER_TYPES = [
  { value: "academic", label: "Academic Researcher (University / Faculty / Student)" },
  { value: "corporate", label: "Enterprise / Corporate Market Researcher" },
  { value: "ngo", label: "NGO / Non-Profit / Development Worker" },
  { value: "independent", label: "Independent Research Consultant" },
  { value: "public_sector", label: "Government / Public Policy Analyst" },
];

export function ResearcherProfilePage() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get("tab") as
    | "profile"
    | "verification"
    | "settings"
    | "subscription") || "profile";

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(
    null,
  );

  // Profile Form States
  const [fullName, setFullName] = useState(user?.full_name || "");
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
  const [github, setGithub] = useState("");

  // Notification Preferences
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
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

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
      setGithub(links.github ?? "");
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
            ...(github.trim() && { github: github.trim() }),
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
      setBanner({ tone: "success", text: res.message || "Verification request submitted." });
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
  const isVerified = user?.verification_tier && user.verification_tier !== "0_registered";

  const getResearcherTypeLabel = () => {
    const found = RESEARCHER_TYPES.find((t) => t.value === (profile?.researcher_type || researcherType));
    return found ? found.label.split(" (")[0] : "Academic Researcher";
  };

  return (
    <div className="space-y-stack-md">
      {/* Profile Header Card */}
      <Card className="p-stack-lg bg-surface border-outline-variant/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-md">
          <div className="flex items-center gap-stack-md">
            <div className="relative">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-on-primary shadow-sm ring-2 ring-primary/20">
                {(user?.full_name || user?.email || "?")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              {isVerified && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-surface">
                  <Icon className="text-sm" filled name="verified" />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {user?.full_name || "Researcher Profile"}
                </h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {getResearcherTypeLabel()}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {user?.email} {profile?.institution ? `· ${profile.institution}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {user?.verification_tier && <TierBadge tier={user.verification_tier} />}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isSubscribed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {isSubscribed ? "PRO SUBSCRIBER" : "FREE PLAN"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              icon="save"
              loading={saveProfileMutation.isPending}
              onClick={() => saveProfileMutation.mutate()}
            >
              Save Profile
            </Button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-stack-lg flex border-b border-outline-variant/60 gap-stack-sm overflow-x-auto">
          {[
            { id: "profile", label: "Profile & Bio", icon: "person" },
            { id: "verification", label: "Verification Hub", icon: "verified" },
            { id: "subscription", label: "Subscription & Billing", icon: "star" },
            { id: "settings", label: "Settings & Security", icon: "settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-title-sm text-body-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
              }`}
              type="button"
            >
              <Icon className="text-[18px]" name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {banner ? (
        <Notice onDismiss={() => setBanner(null)} tone={banner.tone}>
          {banner.text}
        </Notice>
      ) : null}

      {/* TAB 1: Profile & Bio */}
      {activeTab === "profile" && (
        <div className="grid gap-stack-md lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-stack-md">
            <Card className="p-stack-md space-y-stack-md">
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                Professional Details
              </h2>

              <Field label="Full Legal Name">
                <Input
                  disabled
                  value={fullName}
                  placeholder="Your legal name"
                />
              </Field>

              <Field label="Researcher Type">
                <select
                  className="w-full rounded-md border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
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

              <div className="grid sm:grid-cols-2 gap-stack-md">
                <Field label="Institutional / Work Email">
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
                label="Researcher Bio / Study Objectives"
              >
                <Textarea
                  maxLength={1000}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your research domains, primary interests, methodological expertise, and previous publications or initiatives..."
                />
              </Field>
            </Card>

            <Card className="p-stack-md space-y-stack-md">
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                Professional Profiles &amp; Research Links
              </h2>
              <p className="text-xs text-on-surface-variant">
                Link your verified academic and professional accounts to build credibility with respondents and reviewers.
              </p>

              <div className="grid gap-stack-md sm:grid-cols-2">
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

                <Field label="Organization / Lab Website">
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://institution.edu.et/lab"
                  />
                </Field>

                <Field label="Twitter / X Handle">
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@researcher_handle"
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* Quick Summary Sidebar */}
          <div className="space-y-stack-md">
            <Card className="p-stack-md">
              <h3 className="font-title-sm text-body-md font-bold text-on-surface">
                Profile Completeness
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Completed researcher profiles enjoy higher respondent response acceptance and expedited compliance reviews.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Organization Affiliation</span>
                  <Icon
                    className={institution ? "text-emerald-600" : "text-on-surface-variant"}
                    filled={Boolean(institution)}
                    name={institution ? "check_circle" : "radio_button_unchecked"}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Professional Bio</span>
                  <Icon
                    className={bio ? "text-emerald-600" : "text-on-surface-variant"}
                    filled={Boolean(bio)}
                    name={bio ? "check_circle" : "radio_button_unchecked"}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>ORCID / LinkedIn</span>
                  <Icon
                    className={orcid || linkedin ? "text-emerald-600" : "text-on-surface-variant"}
                    filled={Boolean(orcid || linkedin)}
                    name={orcid || linkedin ? "check_circle" : "radio_button_unchecked"}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>National ID / Fayda Check</span>
                  <Icon
                    className={isVerified ? "text-emerald-600" : "text-on-surface-variant"}
                    filled={Boolean(isVerified)}
                    name={isVerified ? "check_circle" : "radio_button_unchecked"}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-stack-md bg-surface-container-low border-primary/20">
              <h3 className="font-title-sm text-body-md font-bold text-primary">
                Need Help with Profiling?
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Institutional teams and large research grant holders can contact our ethics support desk for custom attestations.
              </p>
              <Link className="mt-3 inline-block font-semibold text-xs text-primary hover:underline" to="/#how">
                Learn more about verification &rarr;
              </Link>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Verification Hub */}
      {activeTab === "verification" && (
        <div className="space-y-stack-md max-w-3xl">
          <Card className="p-stack-md space-y-stack-md">
            <div>
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                Researcher Identity &amp; Affiliation Verification
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Verified researchers are marked with trust badges on respondent study invitations, resulting in faster recruitment.
              </p>
            </div>

            <div className="space-y-3">
              {/* Step 1: Fayda National ID */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <Icon name={isVerified ? "check" : "fingerprint"} />
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">National ID (Fayda) Verification</p>
                    <p className="text-xs text-on-surface-variant">
                      {isVerified ? "Fayda FIN Verified via eSignet." : "National ID not yet verified."}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {isVerified ? "Verified" : "Pending"}
                </span>
              </div>

              {/* Step 2: Institutional Email */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      profile?.institutional_email_verified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    <Icon name="mail" />
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Institutional Domain Email</p>
                    <p className="text-xs text-on-surface-variant">
                      {profile?.institutional_email || "No institutional email registered"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    profile?.institutional_email_verified
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {profile?.institutional_email_verified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                icon="verified"
                loading={requestVerificationMutation.isPending}
                onClick={() => requestVerificationMutation.mutate()}
                variant="outline"
              >
                Request Institutional Re-Verification
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Subscription & Billing */}
      {activeTab === "subscription" && (
        <div className="space-y-stack-md">
          <Card className="p-stack-md bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="rounded-full bg-primary text-on-primary px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Current Plan: {isSubscribed ? "Ethosk Pro" : "Free Starter"}
                </span>
                <h2 className="mt-2 text-xl font-bold text-on-surface">
                  {isSubscribed
                    ? "You have full access to Pro Research Tools"
                    : "Upgrade to Ethosk Pro for AI Drafting & Raw Exports"}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Wallet Balance: <strong>{walletData?.wallet.available_etb ?? 0} ETB</strong>
                </p>
              </div>

              {!isSubscribed && (
                <Button
                  icon="upgrade"
                  loading={upgradeSubscriptionMutation.isPending}
                  onClick={() => upgradeSubscriptionMutation.mutate()}
                >
                  Upgrade to Pro (500 ETB/mo)
                </Button>
              )}
            </div>
          </Card>

          {/* Pricing Comparison Cards */}
          <div className="grid gap-stack-md md:grid-cols-3">
            <Card className="p-stack-md border-outline-variant/60 flex flex-col justify-between">
              <div>
                <h3 className="font-title-sm text-title-sm text-on-surface font-bold">Free Starter</h3>
                <p className="mt-2 text-2xl font-black text-on-surface">0 ETB</p>
                <p className="text-xs text-on-surface-variant mt-1">For exploratory pilot studies</p>
                <ul className="mt-4 space-y-2 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <Icon className="text-emerald-600" name="check" /> Up to 1 active study at a time
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-emerald-600" name="check" /> Standard demographic targeting
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-emerald-600" name="check" /> Summary analytics &amp; charts
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-stack-md border-primary shadow-md bg-surface flex flex-col justify-between relative overflow-hidden">
              <span className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                Recommended
              </span>
              <div>
                <h3 className="font-title-sm text-title-sm text-primary font-bold">Ethosk Pro</h3>
                <p className="mt-2 text-2xl font-black text-primary">500 ETB <span className="text-xs font-normal text-on-surface-variant">/ month</span></p>
                <p className="text-xs text-on-surface-variant mt-1">For academic faculty &amp; corporate researchers</p>
                <ul className="mt-4 space-y-2 text-xs text-on-surface">
                  <li className="flex items-center gap-2">
                    <Icon className="text-primary font-bold" name="check" /> <strong>Claude Sonnet AI Survey Generator</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-primary font-bold" name="check" /> <strong>Raw Data CSV / SPSS Exports</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-primary font-bold" name="check" /> <strong>Unlimited Concurrent Active Studies</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-primary font-bold" name="check" /> Priority demographic panel matching
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Button
                  className="w-full"
                  disabled={isSubscribed}
                  icon="star"
                  loading={upgradeSubscriptionMutation.isPending}
                  onClick={() => upgradeSubscriptionMutation.mutate()}
                >
                  {isSubscribed ? "Active Plan" : "Upgrade to Pro"}
                </Button>
              </div>
            </Card>

            <Card className="p-stack-md border-outline-variant/60 flex flex-col justify-between">
              <div>
                <h3 className="font-title-sm text-title-sm text-on-surface font-bold">Enterprise</h3>
                <p className="mt-2 text-2xl font-black text-on-surface">Custom</p>
                <p className="text-xs text-on-surface-variant mt-1">For large research NGOs &amp; agencies</p>
                <ul className="mt-4 space-y-2 text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <Icon className="text-emerald-600" name="check" /> Custom niche panel recruitment
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-emerald-600" name="check" /> Dedicated research ethics review
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon className="text-emerald-600" name="check" /> SLA &amp; API Integration Access
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Button className="w-full" variant="outline" onClick={() => window.open("mailto:support@ethosk.com")}>
                  Contact Enterprise Desk
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: Settings & Security */}
      {activeTab === "settings" && (
        <div className="grid gap-stack-md lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-stack-md">
            <Card className="p-stack-md">
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                Email Notifications &amp; Alerts
              </h2>
              <div className="mt-stack-md space-y-stack-md">
                <Toggle
                  checked={emailOnResponse}
                  label="Daily summary digest of newly collected responses"
                  onChange={setEmailOnResponse}
                />
                <Toggle
                  checked={emailOnFlagged}
                  label="Immediate notification when a response is flagged for quality"
                  onChange={setEmailOnFlagged}
                />
                <Toggle
                  checked={emailOnLowBalance}
                  label="Low balance alert when funds are insufficient for active studies"
                  onChange={setEmailOnLowBalance}
                />
              </div>
            </Card>

            <Card className="p-stack-md">
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">Security &amp; Passwords</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Protect your research data and survey instrument reservations.
              </p>
              <div className="mt-4">
                <Link to="/forgot-password">
                  <Button icon="lock_reset" variant="outline">
                    Change Password via Email
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="space-y-stack-md">
            <Card className="border-error/20 bg-error/5 p-stack-md">
              <p className="font-title-sm text-title-sm text-error font-bold">Danger Zone</p>
              <p className="mt-stack-sm font-body-sm text-[12px] text-error/80">
                Permanently delete your researcher account. All active studies will be closed immediately.
              </p>
              <Button
                className="mt-stack-md w-full border-error text-error hover:bg-error/10"
                onClick={() => setIsDeleteModalOpen(true)}
                variant="outline"
              >
                Delete Account
              </Button>
            </Card>
          </div>
        </div>
      )}

      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
