import { useQuery } from "@tanstack/react-query";
import type { PayoutRecord, RespondentWallet } from "@shared/types";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  LoadingBlock,
  Notice,
  StatBlock,
} from "@/components/ui";
import { api } from "@/lib/api";

interface WalletPayload {
  wallet: RespondentWallet;
  payouts: PayoutRecord[];
}

export function WalletPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["respondent-wallet"],
    queryFn: () => api<WalletPayload>("/wallet/respondent"),
  });

  if (isLoading) return <LoadingBlock label="Loading your wallet…" />;

  const wallet = data?.wallet;
  const payouts = data?.payouts ?? [];

  /**
   * A balance the server did not return is unknown, not zero.
   *
   * Rendering `0.00 ETB` beside a "try again shortly" notice tells a respondent
   * their earnings are gone. Money is the one figure this page must never guess
   * at, so an unread balance shows as blank instead.
   */
  const amount = (value: number | undefined) =>
    wallet && typeof value === "number" ? `${value.toFixed(2)} ETB` : "—";

  return (
    <div className="space-y-stack-md">
      <div>
        <h1 className="font-headline-md text-headline-md text-primary">Wallet</h1>
        <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
          Rewards credited from accepted responses.
        </p>
      </div>

      {error ? (
        <Notice tone="error" title="Balance unavailable">
          <p>
            Your earnings are safe — this page just could not read them right now. Nothing shown
            below reflects your real balance until it loads.
          </p>
          <Button
            className="mt-stack-sm"
            icon="refresh"
            loading={isFetching}
            onClick={() => refetch()}
            variant="outline"
          >
            Try again
          </Button>
        </Notice>
      ) : null}

      <div className="grid gap-stack-md lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-stack-md">
          <Card className="p-stack-lg text-center">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Available balance
            </p>
            <p className="mt-stack-sm font-display-lg-mobile text-display-lg-mobile text-primary">
              {amount(wallet?.available_etb)}
            </p>
            <Button className="mt-stack-md w-full" disabled icon="account_balance">
              Withdraw to Telebirr
            </Button>
          </Card>

          <div className="grid grid-cols-2 gap-stack-sm">
            <StatBlock label="Lifetime earned" value={amount(wallet?.lifetime_etb)} />
            <StatBlock label="Paid responses" value={wallet ? wallet.paid_response_count : "—"} />
          </div>

          <Notice tone="info" title="Withdrawals arrive with the pilot">
            Balances are real and accrue as your responses are accepted. Telebirr and CBE payout
            rails are connected at the pilot stage, which is when the withdraw button opens.
          </Notice>
        </div>

        <div className="space-y-stack-md">
          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Earnings</h2>

            {!wallet ? (
              // "No rewards yet" would be an assertion about earnings the page
              // never managed to read.
              <p className="mt-stack-md font-body-sm text-body-sm text-on-surface-variant">
                Your earnings could not be loaded.
              </p>
            ) : payouts.length === 0 ? (
              <div className="mt-stack-md">
                <EmptyState icon="payments" title="No rewards yet">
                  Complete a survey from your inbox and the reward appears here once the response
                  passes the quality check.
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-stack-sm divide-y divide-outline-variant">
                {payouts.map((payout) => (
                  <li
                    className="flex items-center justify-between gap-stack-md py-stack-sm"
                    key={payout.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-title-sm text-body-md text-on-surface">
                        {payout.survey_title ?? "Survey"}
                      </p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        {new Date(payout.created_at).toLocaleDateString()} ·{" "}
                        {payout.status === "withdrawn" ? "Withdrawn" : "Available"}
                      </p>
                    </div>
                    <span className="shrink-0 font-title-sm text-body-md text-primary">
                      +{payout.amount_etb.toFixed(2)} ETB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">How rewards work</h2>
            <ul className="mt-stack-sm space-y-stack-sm">
              {[
                "The researcher funds the study before it is sent, so the reward is already set aside when you start.",
                "A reward is credited once your response passes the quality check.",
                "Rewards are set per study by the researcher and shown before you start.",
              ].map((line) => (
                <li
                  className="flex items-start gap-stack-sm font-body-sm text-body-sm text-on-surface-variant"
                  key={line}
                >
                  <Icon className="mt-0.5 text-[16px] text-primary" name="check" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
