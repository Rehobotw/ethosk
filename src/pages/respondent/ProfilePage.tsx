import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TIER_RANK,
  GENDERS,
  GENDER_LABEL,
  ETHIOPIAN_REGIONS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABEL,
} from "@shared/types";
import type {
  PayoutRecord,
  RespondentWallet,
  RespondentProfileRecord,
} from "@shared/types";
import { CashoutModal } from "@/components/CashoutModal";
import { LoadingBlock, Notice, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import { AccountDeletionModal } from "@/components/AccountDeletionModal";

interface WalletPayload {
  wallet: RespondentWallet;
  payouts: PayoutRecord[];
}

interface ProfilePayload extends RespondentProfileRecord {
  full_name: string | null;
  phone: string | null;
  dob: string | null;
}

export function ProfilePage() {
  const { user, logout, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);

  // Section 1: Account Identity & Security State
  const [emailInput, setEmailInput] = useState(user?.email ?? "");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [surveyAlerts, setSurveyAlerts] = useState(true);

  // Section 2: Core Demographics State
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [employmentStatus, setEmploymentStatus] = useState<string>("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Section 4: Privacy Consent State
  const [dataConsent, setDataConsent] = useState(true);

  // Fetch respondent profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["respondent-profile"],
    queryFn: () => api<ProfilePayload>("/respondents/profile"),
  });

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["respondent-wallet"],
    queryFn: () => api<WalletPayload>("/wallet/respondent"),
  });

  // Sync state when profile and user load
  useEffect(() => {
    if (user?.email) setEmailInput(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (!profile) return;
    setAge(profile.age?.toString() ?? "");
    setGender(profile.gender ?? "");
    setRegion(profile.region ?? "");
    setCity(profile.city ?? "");
    setEmploymentStatus(profile.employment_status ?? "");
    if (profile.attributes?.survey_alerts !== undefined) {
      setSurveyAlerts(Boolean(profile.attributes.survey_alerts));
    }
    if (profile.attributes?.data_consent !== undefined) {
      setDataConsent(Boolean(profile.attributes.data_consent));
    }
  }, [profile]);

  // Demographic completion percentage
  const demographicProgress = useMemo(() => {
    const fields = [age, gender, region, city, employmentStatus];
    const filled = fields.filter((f) => f && f.toString().trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [age, gender, region, city, employmentStatus]);

  // Update Email Mutation
  const updateEmail = useMutation({
    mutationFn: (newEmail: string) =>
      api("/auth/update-email", { body: { email: newEmail } }),
    onSuccess: async () => {
      setEmailSaved(true);
      setEmailError(null);
      await refresh();
      setTimeout(() => setEmailSaved(false), 3000);
    },
    onError: (err: any) => {
      setEmailError(err instanceof ApiRequestError ? err.message : "Failed to update email.");
    },
  });

  // Update Password Mutation
  const updatePassword = useMutation({
    mutationFn: (data: { current_password?: string; new_password: string }) =>
      api("/auth/update-password", { body: data }),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err instanceof ApiRequestError ? err.message : "Failed to update password.");
    },
  });

  // Save Demographics & Preferences Mutation
  const saveDemographics = useMutation({
    mutationFn: (customConsent?: boolean | void) =>
      api("/respondents/profile", {
        body: {
          age: age ? Number(age) : null,
          gender: gender || null,
          region: region || null,
          city: city || null,
          employment_status: employmentStatus || null,
          attributes: {
            ...(profile?.attributes || {}),
            survey_alerts: surveyAlerts,
            data_consent: customConsent !== undefined ? customConsent : dataConsent,
          },
        },
      }),
    onSuccess: () => {
      setProfileSaved(true);
      queryClient.invalidateQueries({ queryKey: ["respondent-profile"] });
      setTimeout(() => setProfileSaved(false), 3000);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    updatePassword.mutate({ current_password: currentPassword, new_password: newPassword });
  };

  const handleToggleConsent = () => {
    const nextConsent = !dataConsent;
    setDataConsent(nextConsent);
    saveDemographics.mutate(nextConsent);
  };

  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isTier1Verified = currentRank >= TIER_RANK["1_id_verified"];
  const isTier2Verified = currentRank >= TIER_RANK["2_attribute_verified"];

  const wallet = walletData?.wallet;
  const payouts = walletData?.payouts ?? [];
  const availableAmount = wallet?.available_etb ?? 0;
  const canWithdraw = availableAmount >= 100 && isTier1Verified;

  // Verification status label
  const verificationLabel = isTier2Verified
    ? "Tier 2 — Attribute Verified"
    : isTier1Verified
    ? "Tier 1 — ID Verified"
    : "Tier 0 — Basic Registered";

  const tierBadgeBg = isTier2Verified
    ? "bg-blue-100 text-blue-800"
    : isTier1Verified
    ? "bg-amber-100 text-amber-800"
    : "bg-surface-container-high text-on-surface-variant";

  if (!user) return <LoadingBlock label="Loading profile…" />;

  return (
    <div className="space-y-8 font-body-md text-on-surface max-w-4xl mx-auto pb-20">
      {/* ── Page Header ── */}
      <header>
        <h1 className="text-3xl md:text-4xl font-headline-lg font-bold text-[#0D253A] tracking-tight mb-2">
          Profile &amp; Settings
        </h1>
        <p className="text-sm text-on-surface-variant">
          Manage your account identity, demographic targeting details, rewards redemption, and privacy controls.
        </p>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: ACCOUNT IDENTITY & SECURITY (§3.3.1)                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-outline-variant/30 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-2">
          <Icon className="text-[20px] text-primary" name="badge" />
          1. Account Identity &amp; Security
        </h2>

        {/* User Identity Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              User ID
            </label>
            <div className="p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low text-xs font-mono text-on-surface-variant select-all">
              {user.user_id || "ID unavailable"}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Full Legal Name
            </label>
            <div className="p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm font-semibold text-on-surface">
              {user.full_name || "Respondent"}
            </div>
          </div>
        </div>

        {/* Account Verification Status */}
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-[#f8f9ff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              Account Verification Status
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tierBadgeBg}`}>
                {verificationLabel}
              </span>
            </div>
          </div>

          <Link to="/respondent/profile/verification">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#003450] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Icon className="text-[16px]" name="verified_user" />
              {isTier1Verified ? "Manage Verification" : "Complete ID Verification"}
            </button>
          </Link>
        </div>

        {/* Email Field & Update */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="profile-email">
              Email Address
            </label>
            <div className="flex gap-3">
              <input
                id="profile-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none font-medium"
                placeholder="you@example.com"
              />
              <button
                type="button"
                disabled={updateEmail.isPending || emailInput.trim() === user.email}
                onClick={() => updateEmail.mutate(emailInput.trim())}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#003450] transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap"
              >
                {updateEmail.isPending ? "Updating…" : "Update Email"}
              </button>
            </div>
            {emailSaved && (
              <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                <Icon className="text-[14px]" name="check_circle" /> Email address updated.
              </span>
            )}
            {emailError && <p className="text-xs text-error font-medium">{emailError}</p>}
          </div>

          {/* Survey Alert Notifications Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-outline-variant/30 bg-white mt-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface">Survey Alert Notifications</span>
              <span className="text-xs text-on-surface-variant">
                Receive instant email alerts when new matched surveys become available
              </span>
            </div>
            <button
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                surveyAlerts ? "bg-primary" : "bg-outline-variant"
              }`}
              onClick={() => {
                const next = !surveyAlerts;
                setSurveyAlerts(next);
                saveDemographics.mutate();
              }}
              type="button"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  surveyAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Update Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t border-outline-variant/30">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Change Login Password
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="new-pwd">
                New Password
              </label>
              <input
                id="new-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full p-2.5 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="confirm-pwd">
                Confirm New Password
              </label>
              <input
                id="confirm-pwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full p-2.5 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              />
            </div>
          </div>

          {passwordError && <p className="text-xs text-error font-medium">{passwordError}</p>}
          {passwordSuccess && (
            <p className="text-xs text-teal-700 font-medium flex items-center gap-1">
              <Icon className="text-[14px]" name="check_circle" /> Password updated successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={updatePassword.isPending || !newPassword}
            className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#003450] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {updatePassword.isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: CORE DEMOGRAPHICS (§3.3.2)                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-outline-variant/30 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-3">
          <div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Icon className="text-[20px] text-primary" name="demography" />
              2. Core Demographics (Survey Targeting)
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              These demographic criteria are used by researchers to match targeted audiences.
            </p>
          </div>

          {/* Verification Flow Shortcut Button */}
          <Link to="/respondent/profile/verification">
            <button
              type="button"
              className="px-4 py-2 border border-primary text-primary rounded-lg text-xs font-bold hover:bg-primary/5 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Icon className="text-[16px]" name="verified" />
              Verify Demographics
            </button>
          </Link>
        </div>

        {/* Profile Progress Bar (§3.3.2) */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-on-surface">Targeting Profile Completion</span>
            <span className="text-primary">{demographicProgress}% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${demographicProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-on-surface-variant">
            {demographicProgress === 100
              ? "All demographic targeting criteria are set for maximum survey qualification."
              : "Complete all fields to qualify for more high-reward survey opportunities."}
          </p>
        </div>

        {profileLoading ? (
          <LoadingBlock label="Loading demographic details…" />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDemographics.mutate();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2"
          >
            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="field-age">
                Age
              </label>
              <input
                id="field-age"
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 25"
                className="w-full p-3 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="field-gender">
                Gender
              </label>
              <select
                id="field-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABEL[g]}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="field-region">
                Region / State
              </label>
              <select
                id="field-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              >
                <option value="">Select region</option>
                {ETHIOPIAN_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="field-city">
                City / Municipality
              </label>
              <input
                id="field-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Addis Ababa / Hawassa"
                className="w-full p-3 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              />
            </div>

            {/* Employment Status */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="field-employment">
                Employment Status
              </label>
              <select
                id="field-employment"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant/30 text-sm bg-white outline-none focus:border-primary"
              >
                <option value="">Select employment status</option>
                {EMPLOYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {EMPLOYMENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saveDemographics.isPending}
                className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#003450] transition-all disabled:opacity-50 cursor-pointer"
              >
                {saveDemographics.isPending ? "Saving…" : "Save Demographic Profile"}
              </button>
              {profileSaved && (
                <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                  <Icon className="text-[14px]" name="check_circle" /> Demographics saved successfully.
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: EARNINGS & REDEMPTION (§3.3.3)                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-outline-variant/30 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-2">
          <Icon className="text-[20px] text-primary" name="account_balance_wallet" />
          3. Earnings &amp; Redemption
        </h2>

        {walletLoading ? (
          <LoadingBlock label="Loading earnings and payouts…" />
        ) : (
          <div className="space-y-6">
            {/* Balance Card & Redeem Button */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#e8f4fd] to-[#f0f7fb] border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Available Withdrawable Balance
                </p>
                <p className="text-3xl font-bold text-primary">
                  {availableAmount.toLocaleString()} <span className="text-base font-semibold">ETB</span>
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Lifetime Earnings: <strong>{(wallet?.lifetime_etb ?? 0).toLocaleString()} ETB</strong>
                </p>
              </div>

              <button
                type="button"
                disabled={!canWithdraw}
                onClick={() => setIsCashoutModalOpen(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold hover:bg-[#003450] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Icon className="text-[18px]" name="payments" />
                Redeem Rewards
              </button>
            </div>

            {!isTier1Verified && (
              <Notice tone="warning">
                <strong>ID Verification Required:</strong> Complete Fayda National ID verification to unlock withdrawals to Telebirr / CBE Birr.
              </Notice>
            )}

            <p className="text-xs text-on-surface-variant">
              Minimum cashout threshold: <strong>100 ETB</strong>. Payout methods: <strong>Telebirr</strong> and <strong>CBE Birr</strong>.
            </p>

            {/* Transaction History (§3.3.3) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Transaction &amp; Survey History
              </h3>

              {payouts.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant border border-outline-variant/30 rounded-xl bg-surface-container-low/40">
                  <Icon className="text-[32px] opacity-40 mb-1" name="receipt_long" />
                  <p className="text-xs font-medium">No survey reward transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-outline-variant/30 rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant">
                        <th className="p-3 font-bold uppercase tracking-wider">Date</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Title / Description</th>
                        <th className="p-3 font-bold uppercase tracking-wider text-right">Amount</th>
                        <th className="p-3 font-bold uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {payouts.map((row) => {
                        const isDebit = row.amount_etb < 0 || row.status === "withdrawn";
                        return (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-3 text-on-surface-variant whitespace-nowrap">
                              {new Date(row.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-semibold text-on-surface">
                              {row.survey_title || (isDebit ? "Cashout Withdrawal" : "Survey Reward")}
                            </td>
                            <td className={`p-3 text-right font-bold whitespace-nowrap ${isDebit ? "text-error" : "text-teal-700"}`}>
                              {isDebit ? "−" : "+"}{Math.abs(row.amount_etb).toLocaleString()} ETB
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.status === "available" || row.status === "paid" || row.status === "completed"
                                    ? "bg-teal-100 text-teal-800"
                                    : row.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-surface-container-high text-on-surface-variant"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: ESSENTIAL PRIVACY CONTROLS (§3.3.4)                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-outline-variant/30 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-2">
          <Icon className="text-[20px] text-primary" name="security" />
          4. Essential Privacy Controls
        </h2>

        {/* Data Processing & Privacy Consent Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/30 bg-[#f8f9ff]">
          <div className="flex flex-col pr-4">
            <span className="text-sm font-bold text-on-surface">Data Processing &amp; Privacy Consent</span>
            <span className="text-xs text-on-surface-variant mt-0.5">
              Allow processing of verified demographic parameters solely for relevant survey matching pursuant to Proclamation 1321/2024.
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleConsent}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
              dataConsent ? "bg-primary" : "bg-outline-variant"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                dataConsent ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Delete Account (Permanent Data Erasure) */}
        <div className="p-5 rounded-xl border border-error/30 bg-error-container/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-error">Delete Account</span>
            <span className="text-xs text-on-surface-variant mt-0.5">
              Permanently remove your account, demographic targeting records, and identity hashes. Confirmation required.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-5 py-2 border border-error text-error text-xs font-bold rounded-lg hover:bg-error/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Log Out Button ── */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container-low transition-colors cursor-pointer"
      >
        Log Out
      </button>

      {/* ── Modals ── */}
      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <CashoutModal
        isOpen={isCashoutModalOpen}
        onClose={() => setIsCashoutModalOpen(false)}
        availableEtb={availableAmount}
      />
    </div>
  );
}
