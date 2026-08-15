import { useState } from "react";
import { Link } from "react-router-dom";
import { TIER_RANK } from "@shared/types";
import { LoadingBlock } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { AccountDeletionModal } from "@/components/AccountDeletionModal";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Notification toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Privacy toggles
  const [dataConsent, setDataConsent] = useState(true);

  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isTier1Verified = currentRank >= TIER_RANK["1_id_verified"];
  const completionPercent = isTier1Verified ? 85 : 65;

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
      {/* ── Page Header (Stitch Screen 5873129409120510831) ── */}
      <header>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline-lg font-bold text-primary mb-2 tracking-tight">
          Profile &amp; Settings
        </h1>
        <p className="text-base text-on-surface-variant">
          Manage your account identity, security, and preferences.
        </p>
      </header>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/30">
        <div className="flex flex-col gap-8">
          {/* ── User ID Header with Profile Completion ── */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline-variant/30 pb-6 gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-headline-md font-bold text-primary">
                User ID: {user.full_name || "Respondent"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {isTier1Verified ? "Tier 1 Verified" : "Basic Registration"}
                </span>
              </div>
            </div>

            <div className="bg-[#f2f3f9] p-4 rounded-xl border border-outline-variant/30 w-full md:w-64">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-on-surface">Profile Completion</span>
                <span className="text-xs font-bold text-primary">{completionPercent}%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <Link to="/verify">
                <button
                  className="w-full bg-primary text-white py-2 rounded-full text-xs font-bold hover:bg-[#003450] transition-all active:scale-95 cursor-pointer"
                  type="button"
                >
                  Complete Verification
                </button>
              </Link>
            </div>
          </header>

          {/* ── Two-Column Grid: Security + Survey Alerts ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Security / Password */}
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2">
                Security
              </h3>

              <div className="flex flex-col gap-4">
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

            {/* Right: Survey Alerts */}
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2">
                Survey Alerts
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Email Notifications</span>
                    <span className="text-xs text-on-surface-variant">
                      Get survey invites via email
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

                <div className="flex items-center justify-between p-4 rounded-lg border border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Push Notifications</span>
                    <span className="text-xs text-on-surface-variant">
                      Real-time alerts on your device
                    </span>
                  </div>
                  <button
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      pushNotifications ? "bg-primary" : "bg-outline-variant"
                    }`}
                    onClick={() => setPushNotifications(!pushNotifications)}
                    type="button"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        pushNotifications ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Privacy & Data ── */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-title-md font-bold text-primary border-b border-outline-variant/30 pb-2">
              Privacy &amp; Data
            </h3>

            <div className="flex flex-col gap-4">
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
          </div>

          {/* ── Danger Zone ── */}
          <div className="mt-8 pt-8 border-t border-outline-variant/30">
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

      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
