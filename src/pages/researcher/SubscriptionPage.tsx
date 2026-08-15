import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Notice } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function SubscriptionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = user?.subscription_tier === "subscribed";
  const expiresAt = user?.subscription_expires_at
    ? new Date(user.subscription_expires_at).toLocaleDateString()
    : null;

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: async () => {
      setError(null);
      return api("/wallet/researcher/subscription", { method: "POST" });
    },
    onSuccess: () => {
      // Refresh user profile and wallet
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Failed to upgrade subscription. Please try again.");
      }
    },
  });

  return (
    <div className="max-w-5xl space-y-8 font-body-md text-on-surface">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-headline-lg font-bold text-[#0D253A] tracking-tight">
          Subscription Plan
        </h1>
        <p className="mt-1 text-base text-on-surface-variant max-w-2xl">
          Upgrade your account to access premium researcher features and advanced analytics.
        </p>
      </div>

      {error && (
        <Notice tone="error">
          {error}
        </Notice>
      )}

      {/* ── Plans Grid ── */}
      <div className="grid gap-8 md:grid-cols-2 items-stretch">
        {/* Current Status Card */}
        <div className="bg-white rounded-xl border border-outline-variant/40 p-8 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,89,133,0.04)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-lg text-2xl font-bold text-[#0D253A]">
                Current Plan
              </h2>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {isSubscribed ? "Pro Plan" : "Free Plan"}
              </span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 mb-6">
              <p className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider mb-1">
                Plan Status
              </p>
              <p className="text-lg font-bold text-primary">
                {isSubscribed ? "Active Pro Subscriber" : "Free Community Tier"}
              </p>
              {isSubscribed && expiresAt && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Active until {expiresAt}
                </p>
              )}
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              {isSubscribed
                ? "You currently have unlimited active research studies and full executive export capabilities enabled."
                : "You are currently on the free tier. Your account is fully functional with standard demographic targeting but subject to baseline usage limits."}
            </p>
          </div>

          <div className="pt-8 border-t border-outline-variant/30 mt-6">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
              <span>All research data is encrypted and IRB compliant.</span>
            </div>
          </div>
        </div>

        {/* Upgrade Card (Ethosk Pro) */}
        <div className="bg-white rounded-xl border-2 border-primary/40 p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,89,133,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wider">
            RECOMMENDED
          </div>

          <div>
            <h2 className="font-headline-lg text-2xl font-bold text-primary mb-2">
              Ethosk Pro
            </h2>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-headline-lg font-bold text-[#0D253A]">500</span>
              <span className="text-sm font-medium text-on-surface-variant">
                ETB / month
              </span>
            </div>

            <ul className="space-y-3.5 text-sm text-on-surface-variant mb-8">
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600 font-bold shrink-0">
                  check_circle
                </span>
                <span>Advanced demographics analytics & cross-tabulation</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600 font-bold shrink-0">
                  check_circle
                </span>
                <span>Unlimited concurrent active studies</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600 font-bold shrink-0">
                  check_circle
                </span>
                <span>AI-driven executive summaries and export formats</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600 font-bold shrink-0">
                  check_circle
                </span>
                <span>Priority researcher support & fast-track review</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              className="w-full bg-[#002446] hover:bg-[#00386c] text-white py-3.5 px-6 rounded-lg font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              disabled={isSubscribed || isPending}
              onClick={() => subscribe()}
              type="button"
            >
              {isPending ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              )}
              <span>{isSubscribed ? "Currently Active" : "Upgrade with Wallet Balance"}</span>
            </button>
            {!isSubscribed && (
              <p className="mt-3 text-center text-xs text-on-surface-variant font-medium">
                500 ETB will be deducted from your available wallet balance.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
