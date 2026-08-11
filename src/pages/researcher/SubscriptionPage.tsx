import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Notice, SectionHeading, StatBlock } from "@/components/ui";
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Subscription Plan
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Upgrade your account to access premium researcher features and advanced analytics.
        </p>
      </div>

      {error && (
        <Notice title="Subscription failed">
          {error}
        </Notice>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card className="flex flex-col">
          <SectionHeading title="Current Plan" />
          <div className="mt-6 flex-1 space-y-6">
            <StatBlock
              label="Status"
              value={isSubscribed ? "Pro" : "Free"}
            />
            {isSubscribed && expiresAt && (
              <StatBlock label="Active until" value={expiresAt} />
            )}
            {!isSubscribed && (
              <p className="text-sm text-on-surface-variant">
                You are currently on the free tier. Your account is fully functional but subject to certain usage limits and lacks advanced analytics.
              </p>
            )}
          </div>
        </Card>

        {/* Upgrade Card */}
        <Card className="flex flex-col border-primary/20 bg-surface-container-low shadow-sm">
          <SectionHeading title="Ethosk Pro" />
          <div className="mt-6 flex-1 space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-on-surface">500</span>
              <span className="text-lg font-medium text-on-surface-variant">
                ETB / month
              </span>
            </div>

            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                Advanced demographics analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                Unlimited active surveys
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                Export data to advanced formats
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                Priority researcher support
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Button
              className="w-full"
              disabled={isSubscribed || isPending}
              icon="account_balance_wallet"
              loading={isPending}
              onClick={() => subscribe()}
            >
              {isSubscribed ? "Currently Active" : "Upgrade with Wallet Balance"}
            </Button>
            {!isSubscribed && (
              <p className="mt-3 text-center text-xs text-on-surface-variant">
                500 ETB will be deducted from your available wallet balance.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
