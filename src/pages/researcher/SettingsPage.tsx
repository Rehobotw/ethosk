import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ResearcherWallet } from "@shared/types";
import {
  Button,
  Card,
  Icon,
  LoadingBlock,
  SectionHeading,
  TierBadge,
  Toggle,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AccountDeletionModal } from "@/components/AccountDeletionModal";

export function SettingsPage() {
  const { user } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [emailOnResponse, setEmailOnResponse] = useState(true);
  const [emailOnFlagged, setEmailOnFlagged] = useState(true);
  const [emailOnLowBalance, setEmailOnLowBalance] = useState(true);

  const { data: walletData, isLoading } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  if (isLoading) return <LoadingBlock label="Loading your settings…" />;

  return (
    <div>
      <SectionHeading
        subtitle="Manage your notifications and account."
        title="Settings"
      />

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-stack-md">
          {/* Notifications */}
          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Email notifications</h2>
            <div className="mt-stack-md space-y-stack-md">
              <Toggle
                checked={emailOnResponse}
                label="Daily summary of new responses"
                onChange={setEmailOnResponse}
              />
              <Toggle
                checked={emailOnFlagged}
                label="When a response is flagged for quality"
                onChange={setEmailOnFlagged}
              />
              <Toggle
                checked={emailOnLowBalance}
                label="When my balance will not cover an active study"
                onChange={setEmailOnLowBalance}
              />
            </div>
          </Card>
        </div>

        {/* Summary column */}
        <div className="space-y-stack-md lg:sticky lg:top-24">
          <Card className="p-stack-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Account
            </p>
            <p className="mt-stack-sm font-title-sm text-title-sm text-on-surface">
              {user?.full_name}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{user?.email}</p>
            {user ? (
              <div className="mt-stack-sm">
                <TierBadge tier={user.verification_tier} />
              </div>
            ) : null}

            <div className="mt-stack-md space-y-stack-sm border-t border-outline-variant pt-stack-md">
              <Link
                className="flex items-center justify-between font-label-md text-label-md text-primary"
                to="/forgot-password"
              >
                Change password
                <Icon name="arrow_forward" />
              </Link>
            </div>
          </Card>

          <Card className="border-error/20 bg-error/5 p-stack-md">
            <p className="font-title-sm text-title-sm text-error">Danger zone</p>
            <p className="mt-stack-sm font-body-sm text-[12px] text-error/80">
              Permanently delete your account. Active surveys will be closed.{" "}
              {walletData?.wallet && walletData.wallet.available_etb > 0
                ? "Your remaining balance will be forfeited."
                : ""}
            </p>
            <Button
              className="mt-stack-md w-full border-error text-error hover:bg-error/10"
              onClick={() => setIsDeleteModalOpen(true)}
              variant="outline"
            >
              Delete account
            </Button>
          </Card>
        </div>
      </div>

      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
