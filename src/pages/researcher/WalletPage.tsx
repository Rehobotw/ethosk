import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEPOSIT_METHOD_LABEL,
  DEPOSIT_METHODS,
  DEPOSIT_STATUS_LABEL,
  type DepositMethod,
  type DepositRecord,
  type ResearcherWallet,
} from "@shared/types";
import { depositSchema, telebirrCheckoutSchema } from "@shared/validation/schemas";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  Input,
  LoadingBlock,
  Notice,
  SectionHeading,
  Select,
  StatBlock,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";

interface Commitment {
  survey_id: string;
  title: string;
  reserved_etb: number;
  reward_etb: number;
}

interface WalletPayload {
  wallet: ResearcherWallet;
  deposits: DepositRecord[];
  commitments: Commitment[];
}

/** Quick amounts, so the common case is one tap rather than typing. */
const PRESETS = [500, 1_000, 2_500, 5_000];

/** How the researcher is funding the balance. */
type FundingMode = "telebirr" | "manual";

export function ResearcherWalletPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [amount, setAmount] = useState("1000");
  const [mode, setMode] = useState<FundingMode>("telebirr");
  const [method, setMethod] = useState<DepositMethod>("telebirr");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<WalletPayload>("/wallet/researcher"),
  });

  const { data: telebirr } = useQuery({
    queryKey: ["telebirr-availability"],
    queryFn: () => api<{ available: boolean; demo: boolean }>("/wallet/researcher/telebirr"),
  });

  // Set when telebirr sends the browser back from checkout.
  const returningReference = searchParams.get("deposit");

  /**
   * Watches a deposit until telebirr's callback has been applied.
   *
   * The payer's browser often returns before the server-to-server callback
   * arrives, so a deposit reads as pending for a few seconds through no fault of
   * anyone's. Polling stops as soon as it resolves either way.
   */
  const { data: returning } = useQuery({
    queryKey: ["deposit", returningReference],
    queryFn: () =>
      api<{ deposit: DepositRecord; wallet: ResearcherWallet }>(
        `/wallet/researcher/deposits/${returningReference}`,
      ),
    enabled: Boolean(returningReference),
    refetchInterval: (query) =>
      query.state.data?.deposit.status === "pending" ? 2_000 : false,
  });

  const returningStatus = returning?.deposit.status;

  useEffect(() => {
    if (!returningStatus || returningStatus === "pending") return;

    // The balance changed underneath the page, so the summary above is stale.
    void queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });

    // Clears `?deposit=` so a refresh does not reopen a settled payment.
    setSearchParams({}, { replace: true });

    setConfirmation(
      returningStatus === "completed" && returning
        ? `${returning.deposit.amount_etb.toLocaleString()} ETB received. Available balance is now ${returning.wallet.available_etb.toLocaleString()} ETB.`
        : null,
    );
    setFormError(
      returningStatus === "completed" ? null : "That telebirr payment did not complete.",
    );
  }, [returningStatus, returning, queryClient, setSearchParams]);

  const startTelebirr = useMutation({
    mutationFn: (amountEtb: number) =>
      api<{ checkout_url: string; reference: string; demo: boolean }>(
        "/wallet/researcher/deposits/telebirr",
        { body: { amount_etb: amountEtb } },
      ),
    // Leaves the app for telebirr's own checkout. Nothing is credited here — the
    // balance moves only when telebirr calls the server back.
    onSuccess: (result) => window.location.assign(result.checkout_url),
    onError: (error) => {
      setConfirmation(null);
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not open telebirr checkout.",
      );
    },
  });

  const deposit = useMutation({
    mutationFn: (input: { amount_etb: number; method: DepositMethod; reference: string }) =>
      api<{ deposit: DepositRecord; wallet: ResearcherWallet }>("/wallet/researcher/deposits", {
        body: input,
      }),
    onSuccess: async (result) => {
      setFormError(null);
      setReference("");
      setConfirmation(
        `${result.deposit.amount_etb.toLocaleString()} ETB added. Available balance is now ${result.wallet.available_etb.toLocaleString()} ETB.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
    },
    onError: (error) => {
      setConfirmation(null);
      setFormError(
        error instanceof ApiRequestError ? error.message : "The deposit could not be recorded.",
      );
    },
  });

  const submit = () => {
    setConfirmation(null);

    if (mode === "telebirr") {
      // Only the amount is the researcher's to supply: the order number is issued
      // by the server so it cannot collide with another deposit.
      const parsed = telebirrCheckoutSchema.safeParse({
        amount_etb: amount === "" ? Number.NaN : Number(amount),
      });

      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Check the amount.");
        return;
      }

      setFormError(null);
      startTelebirr.mutate(parsed.data.amount_etb);
      return;
    }

    const parsed = depositSchema.safeParse({
      amount_etb: amount === "" ? Number.NaN : Number(amount),
      method,
      reference,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the deposit details.");
      return;
    }

    setFormError(null);
    deposit.mutate(parsed.data);
  };

  if (isLoading) return <LoadingBlock label="Loading your balance…" />;

  const wallet = data?.wallet;
  const commitments = data?.commitments ?? [];
  const deposits = data?.deposits ?? [];

  return (
    <div>
      <SectionHeading
        subtitle="Fund your studies up front, so every respondent you reach is already paid for."
        title="Wallet"
      />

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-stack-md">
          <Card className="p-stack-lg">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Available to spend
            </p>
            <p className="mt-base font-display-lg text-display-lg text-primary">
              {(wallet?.available_etb ?? 0).toLocaleString()} ETB
            </p>

            <div className="mt-stack-md grid grid-cols-3 gap-stack-sm">
              <StatBlock
                label="Deposited"
                value={`${(wallet?.deposited_etb ?? 0).toLocaleString()} ETB`}
              />
              <StatBlock
                label="Reserved"
                value={`${(wallet?.reserved_etb ?? 0).toLocaleString()} ETB`}
              />
              <StatBlock
                label="Paid out"
                value={`${(wallet?.paid_etb ?? 0).toLocaleString()} ETB`}
              />
            </div>

            <p className="mt-stack-md font-body-sm text-[12px] text-on-surface-variant">
              Reserved funds are committed to studies that are still collecting responses. They
              become paid out as each response passes the quality check.
            </p>
          </Card>

          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Committed to studies</h2>

            {commitments.length === 0 ? (
              <div className="mt-stack-md">
                <EmptyState icon="savings" title="Nothing reserved">
                  When you send a survey, its full reward budget is reserved here until the
                  responses come in.
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-stack-sm divide-y divide-outline-variant">
                {commitments.map((commitment) => (
                  <li
                    className="flex items-center justify-between gap-stack-md py-stack-sm"
                    key={commitment.survey_id}
                  >
                    <div className="min-w-0">
                      <Link
                        className="truncate font-title-sm text-body-md text-primary hover:underline"
                        to={`/researcher/surveys/${commitment.survey_id}/dashboard`}
                      >
                        {commitment.title}
                      </Link>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">
                        {commitment.reward_etb.toLocaleString()} ETB per response
                      </p>
                    </div>
                    <span className="shrink-0 font-title-sm text-body-md text-on-surface">
                      {commitment.reserved_etb.toLocaleString()} ETB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Deposit history</h2>

            {deposits.length === 0 ? (
              <div className="mt-stack-md">
                <EmptyState icon="receipt_long" title="No deposits yet">
                  Add funds on the right to start sending studies.
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-stack-sm divide-y divide-outline-variant">
                {deposits.map((row) => (
                  <li
                    className="flex items-center justify-between gap-stack-md py-stack-sm"
                    key={row.id}
                  >
                    <div className="min-w-0">
                      <p className="font-title-sm text-body-md text-on-surface">
                        {DEPOSIT_METHOD_LABEL[row.method]}
                      </p>
                      <p className="truncate font-body-sm text-[12px] text-on-surface-variant">
                        {new Date(row.created_at).toLocaleDateString()} · ref {row.reference}
                        {row.status === "completed" ? null : ` · ${DEPOSIT_STATUS_LABEL[row.status]}`}
                      </p>
                    </div>
                    {/* Only a completed deposit is money in the balance, so only a
                        completed deposit is shown as a credit. */}
                    <span
                      className={
                        row.status === "completed"
                          ? "shrink-0 font-title-sm text-body-md text-flag-clean"
                          : "shrink-0 font-title-sm text-body-md text-on-surface-variant line-through"
                      }
                    >
                      +{row.amount_etb.toLocaleString()} ETB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Deposit form */}
        <div className="lg:sticky lg:top-24">
          <Card className="p-stack-md">
            <div className="mb-stack-md flex items-center gap-stack-sm">
              <Icon className="text-primary" name="add_card" />
              <h2 className="font-headline-md text-title-sm text-primary">Add funds</h2>
            </div>

            {returningStatus === "pending" ? (
              <div className="mb-stack-md">
                <Notice tone="info" title="Confirming your payment">
                  telebirr has not confirmed this payment yet. This updates on its own — you can
                  leave the page open.
                </Notice>
              </div>
            ) : null}

            {telebirr?.available ? (
              <div
                className="mb-stack-md grid grid-cols-2 gap-base rounded-xl bg-surface-subtle p-1"
                role="tablist"
              >
                {(
                  [
                    ["telebirr", "Pay with telebirr"],
                    ["manual", "Record a transfer"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    aria-selected={mode === value}
                    className={
                      mode === value
                        ? "rounded-lg bg-surface px-stack-sm py-2 font-title-sm text-body-sm text-primary shadow-soft"
                        : "rounded-lg px-stack-sm py-2 font-title-sm text-body-sm text-on-surface-variant hover:text-primary"
                    }
                    key={value}
                    onClick={() => {
                      setMode(value);
                      setFormError(null);
                    }}
                    role="tab"
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            <Field label="Amount (ETB)">
              <Input
                inputMode="numeric"
                min={50}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                value={amount}
              />
            </Field>

            <div className="mt-stack-sm flex flex-wrap gap-stack-sm">
              {PRESETS.map((preset) => (
                <button
                  className="rounded-full border border-outline-variant px-3 py-1 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  type="button"
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>

            {mode === "manual" ? (
              <>
                <div className="mt-stack-md">
                  <Field label="Paid with">
                    <Select
                      onChange={(event) => setMethod(event.target.value as DepositMethod)}
                      value={method}
                    >
                      {DEPOSIT_METHODS.map((value) => (
                        <option key={value} value={value}>
                          {DEPOSIT_METHOD_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="mt-stack-md">
                  <Field
                    hint="The transaction number from your payment confirmation."
                    label="Transaction reference"
                  >
                    <Input
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="e.g. CBE240718A9F3"
                      value={reference}
                    />
                  </Field>
                </div>
              </>
            ) : null}

            {formError ? (
              <div className="mt-stack-md">
                <Notice tone="error">{formError}</Notice>
              </div>
            ) : null}

            {confirmation ? (
              <div className="mt-stack-md">
                <Notice tone="success">{confirmation}</Notice>
              </div>
            ) : null}

            <Button
              className="mt-stack-md w-full"
              icon={mode === "telebirr" ? "smartphone" : "account_balance"}
              loading={mode === "telebirr" ? startTelebirr.isPending : deposit.isPending}
              onClick={submit}
            >
              {mode === "telebirr" ? "Continue to telebirr" : "Record deposit"}
            </Button>

            <div className="mt-stack-md">
              {mode === "telebirr" ? (
                <Notice
                  tone={telebirr?.demo ? "warning" : "info"}
                  title={telebirr?.demo ? "Demo checkout" : "Paying with telebirr"}
                >
                  {telebirr?.demo
                    ? "No telebirr credentials are configured, so checkout is simulated locally and credits your balance without a real payment."
                    : "You will finish the payment in telebirr and come back here. Your balance updates once telebirr confirms it, which is usually immediate."}
                </Notice>
              ) : (
                <Notice tone="info" title="Confirming a transfer by hand">
                  Transfer to the Ethosk account with your chosen method, then enter the reference
                  here to credit your balance. A reference can only be credited once.
                </Notice>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
