import { useState, useEffect } from "react";
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
import type { PayoutRecord, RespondentWallet, RespondentProfileRecord } from "@shared/types";
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
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Notification toggles
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Privacy toggles
  const [dataConsent, setDataConsent] = useState(true);

  // Demographic form fields
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [employmentStatus, setEmploymentStatus] = useState<string>("");
  const [profileSaved, setProfileSaved] = useState(false);

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

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setAge(profile.age?.toString() ?? "");
    setGender(profile.gender ?? "");
    setRegion(profile.region ?? "");
    setEmploymentStatus(profile.employment_status ?? "");
  }, [profile]);

  // Save demographics mutation
  const saveDemographics = useMutation({
    mutationFn: () =>
      api("/respondents/profile", {
        body: {
          age: age ? Number(age) : null,
          gender: gender || null,
          region: region || null,
          employment_status: employmentStatus || null,
        },
      }),
    onSuccess: () => {
      setProfileSaved(true);
      queryClient.invalidateQueries({ queryKey: ["respondent-profile"] });
      setTimeout(() => setProfileSaved(false), 3000);
    },
  });

  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isTier1Verified = currentRank >= TIER_RANK["1_id_verified"];

  const wallet = walletData?.wallet;
  const payouts = walletData?.payouts ?? [];
  const availableAmount = wallet?.available_etb ?? 0;
  const isVerified = user?.verification_tier && user.verification_tier !== "0_registered";
  const canWithdraw = availableAmount >= 100 && isVerified;

  // Tier badge config
  let tierBadge: { label: string; color: string; bg: string } | null = null;
  if (currentRank >= 2) {
    tierBadge = { label: "Tier 2", color: "#1565c0", bg: "#e3f2fd" };
  } else if (currentRank >= 1) {
    tierBadge = { label: "Tier 1", color: "#f57f17", bg: "#fff8e1" };
  }

  const handleUpdatePassword = () => {
    setPasswordError("");
    setPasswordSuccess(false);
    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!user) return <LoadingBlock label="Loading profile…" />;

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* ── Page Header ── */}
      <header>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline-lg font-bold text-primary mb-2 tracking-tight">
          Profile &amp; Settings
        </h1>
        <p className="text-base text-on-surface-variant">
          Manage your account identity, demographics, rewards, and preferences.
        </p>
      </header>

      {/* ── Profile Header Card ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1d5d8a] text-white font-bold text-lg flex items-center justify-center border-2 border-white shadow-md">
              {(user.full_name || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-headline-md font-bold text-primary">
                  {user.full_name || "Respondent"}
                </h2>
                {tierBadge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold leading-none"
                    style={{ backgroundColor: tierBadge.bg, color: tierBadge.color }}
                  >
                    {tierBadge.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  {isTier1Verified ? "ID Verified" : "Basic Registration"}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Completion / Verification CTA */}
          {!isTier1Verified && (
            <Link to="/verify">
              <button
                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#003450] transition-all active:scale-95 cursor-pointer"
                type="button"
              >
                Complete Verification
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Email & Survey Alerts ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2 mb-5">
          Email & Survey Alerts
        </h3>

        <div className="flex flex-col gap-4">
          {/* Email Display (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Email Address
            </label>
            <div className="w-full p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm text-on-surface-variant">
              {user.email}
            </div>
          </div>

          {/* Email Notification Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface">Email Notifications</span>
              <span className="text-xs text-on-surface-variant">
                Receive survey invitations via email
              </span>
            </div>
            <button
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                emailNotifications ? "bg-primary" : "bg-outline-variant"
              }`}
              onClick={() => setEmailNotifications(!emailNotifications)}
              type="button"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  emailNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Basic Demographics ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2 mb-5">
          Basic Demographics
        </h3>

        <p className="text-xs text-on-surface-variant mb-5 p-3 rounded-lg bg-[#f2f3f9] border border-outline-variant/20 flex items-start gap-2">
          <Icon className="text-[16px] text-primary shrink-0 mt-0.5" name="info" />
          This information helps match you with relevant surveys. All data is stored securely
          and used only for survey targeting.
        </p>

        {profileLoading ? (
          <LoadingBlock label="Loading your profile…" />
        ) : (
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveDemographics.mutate();
            }}
          >
            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="demo-age">
                Age
              </label>
              <input
                id="demo-age"
                className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
                type="number"
                min={13}
                max={120}
                placeholder="e.g. 28"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="demo-gender">
                Gender
              </label>
              <select
                id="demo-gender"
                className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
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
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="demo-region">
                Location / Region
              </label>
              <select
                id="demo-region"
                className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Select region</option>
                {ETHIOPIAN_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="demo-employment">
                Employment Status
              </label>
              <select
                id="demo-employment"
                className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
              >
                <option value="">Select status</option>
                {EMPLOYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {EMPLOYMENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Save button — spans full row */}
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <button
                className="bg-primary text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-[#003450] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                type="submit"
                disabled={saveDemographics.isPending}
              >
                {saveDemographics.isPending ? "Saving…" : "Save Changes"}
              </button>
              {profileSaved && (
                <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                  <Icon className="text-[14px]" name="check_circle" /> Saved successfully
                </span>
              )}
              {saveDemographics.error && (
                <span className="text-xs text-error font-medium">
                  {saveDemographics.error instanceof ApiRequestError
                    ? saveDemographics.error.message
                    : "Failed to save. Try again."}
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ── Redeem Rewards ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2 mb-5">
          Redeem Rewards
        </h3>

        {walletLoading ? (
          <LoadingBlock label="Loading wallet…" />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Balance display */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px] p-4 rounded-xl bg-gradient-to-br from-[#e8f4fd] to-[#f0f7fb] border border-primary/10">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-primary">
                  {availableAmount.toLocaleString()} <span className="text-sm font-medium">ETB</span>
                </p>
              </div>
              <div className="flex-1 min-w-[150px] p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Lifetime Earnings
                </p>
                <p className="text-2xl font-bold text-on-surface">
                  {(wallet?.lifetime_etb ?? 0).toLocaleString()} <span className="text-sm font-medium">ETB</span>
                </p>
              </div>
            </div>

            {/* Verification warning */}
            {!isVerified && (
              <Notice tone="warning">
                <strong>Identity verification required.</strong> Complete{" "}
                <Link to="/verify" className="text-primary font-semibold underline">
                  Fayda ID verification
                </Link>{" "}
                to unlock withdrawals.
              </Notice>
            )}

            {/* Minimum threshold notice */}
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <Icon className="text-[14px]" name="info" />
              Minimum withdrawal amount: <strong>100 ETB</strong>. Payment methods: Telebirr, CBE Birr.
            </p>

            {/* Redeem button */}
            <button
              className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#003450] transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-fit"
              type="button"
              disabled={!canWithdraw}
              onClick={() => setIsCashoutModalOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Icon className="text-[18px]" name="account_balance_wallet" />
                Redeem Rewards
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2 mb-5">
          Transaction History
        </h3>

        {walletLoading ? (
          <LoadingBlock label="Loading transactions…" />
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <Icon className="text-[40px] mb-2 opacity-40" name="receipt_long" />
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs mt-1">
              Complete surveys to start earning rewards.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-outline-variant/30">
                  <th className="pb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Description
                  </th>
                  <th className="pb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="pb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Date
                  </th>
                  <th className="pb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => {
                  const isWithdrawal = payout.status === "withdrawn" || payout.amount_etb < 0;
                  return (
                    <tr
                      key={payout.id}
                      className="border-b border-outline-variant/10 last:border-0"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`text-[18px] ${isWithdrawal ? "text-error" : "text-teal-600"}`}
                            name={isWithdrawal ? "arrow_upward" : "arrow_downward"}
                          />
                          <span className="font-medium text-on-surface truncate max-w-[200px]">
                            {payout.survey_title || (isWithdrawal ? "Withdrawal" : "Survey Payout")}
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 text-right font-bold ${isWithdrawal ? "text-error" : "text-teal-700"}`}>
                        {isWithdrawal ? "−" : "+"}{Math.abs(payout.amount_etb).toLocaleString()} ETB
                      </td>
                      <td className="py-3 text-right text-on-surface-variant text-xs">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            payout.status === "available" || payout.status === "completed" || payout.status === "paid"
                              ? "bg-teal-100 text-teal-800"
                              : payout.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {payout.status === "available"
                            ? "Earned"
                            : payout.status === "paid"
                              ? "Paid"
                              : payout.status === "completed"
                                ? "Completed"
                                : payout.status === "pending"
                                  ? "Pending"
                                  : payout.status === "withdrawn"
                                    ? "Withdrawn"
                                    : payout.status}
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

      {/* ── Security ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2 mb-5">
          Security
        </h3>

        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Current Password
            </label>
            <input
              className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              value={currentPassword}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              New Password
            </label>
            <input
              className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              value={newPassword}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              className="w-full p-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm outline-none transition-all"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
            />
          </div>

          {passwordError ? (
            <p className="text-xs text-error font-medium">{passwordError}</p>
          ) : null}
          {passwordSuccess ? (
            <p className="text-xs text-teal-700 font-medium">Password updated successfully.</p>
          ) : null}

          <button
            className="bg-primary text-white px-6 py-2 rounded-full text-xs font-bold w-fit mt-2 hover:bg-[#003450] transition-all active:scale-95 cursor-pointer"
            onClick={handleUpdatePassword}
            type="button"
          >
            Update Password
          </button>
        </div>
      </div>

      {/* ── Privacy & Data ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2 mb-5">
          Privacy &amp; Data
        </h3>

        <div className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/30">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface">Data Processing Consent</span>
            <span className="text-xs text-on-surface-variant">
              Allow us to process your data for personalized survey matching
            </span>
          </div>
          <button
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              dataConsent ? "bg-primary" : "bg-outline-variant"
            }`}
            onClick={() => setDataConsent(!dataConsent)}
            type="button"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                dataConsent ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <h3 className="text-lg font-title-md font-bold text-error mb-4">Danger Zone</h3>

        <div className="p-6 rounded-lg border border-error/30 bg-error-container/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface">Delete Account</span>
            <span className="text-xs text-on-surface-variant">
              Permanently remove your account and all associated data. This action is irreversible.
            </span>
          </div>
          <button
            className="px-6 py-2 rounded-full border border-error text-error text-xs font-bold hover:bg-error/5 transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
            onClick={() => setIsDeleteModalOpen(true)}
            type="button"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Log Out Button ── */}
      <button
        className="w-full py-3 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.99]"
        onClick={logout}
        type="button"
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
