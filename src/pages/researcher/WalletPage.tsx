import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEPOSIT_METHOD_LABEL,
  DEPOSIT_STATUS_LABEL,
  type DepositMethod,
  type DepositRecord,
  type ResearcherWallet,
} from "@shared/types";
import {
  EmptyState,
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ResearcherProfileRecord } from "@shared/types";

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

const PRESET_AMOUNTS = [1000, 5000, 10000];

export function ResearcherWalletPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(10000);
  const [customAmount, setCustomAmount] = useState("10000");
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("telebirr");
  const [transactionRef, setTransactionRef] = useState("");
  const [senderDetail, setSenderDetail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<WalletPayload>("/wallet/researcher"),
  });

  const { data: profile } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<ResearcherProfileRecord>("/researchers/profile"),
  });

  const returningReference = searchParams.get("deposit");

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
    void queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
    setSearchParams({}, { replace: true });
    setConfirmation(
      returningStatus === "completed"
        ? "Payment verified. Your balance has been updated."
        : "Payment was not completed. No money was taken.",
    );
  }, [returningStatus, queryClient, setSearchParams]);

  const telebirrCheckout = useMutation({
    mutationFn: (body: { amount_etb: number; return_url?: string }) =>
      api<{ to: string }>("/wallet/researcher/telebirr", { body }),
    onSuccess: (data) => {
      window.location.assign(data.to);
    },
    onError: (err) => {
      setFormError(err instanceof ApiRequestError ? err.message : "Checkout unavailable");
    },
  });

  const manualDeposit = useMutation({
    mutationFn: (body: {
      amount_etb: number;
      method: DepositMethod;
      reference: string;
      sender_detail?: string;
      idempotency_key?: string;
    }) =>
      api<{
        deposit: DepositRecord;
        wallet: ResearcherWallet;
        verified?: boolean;
        requires_manual_review?: boolean;
        message?: string;
      }>("/wallet/researcher/deposits", { body }),
    onSuccess: (res) => {
      if (res.requires_manual_review) {
        setConfirmation(res.message || "Deposit queued for manual administrative review.");
      } else {
        setConfirmation("Payment verified via verify.et. Your balance has been credited immediately!");
        setTransactionRef("");
        setSenderDetail("");
      }
      void queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
    },
    onError: (err) => {
      setFormError(err instanceof ApiRequestError ? err.message : "Deposit verification failed.");
    },
  });

  const activeAmount = selectedAmount === "custom" ? Number(customAmount) || 0 : selectedAmount;

  const handleProceedPayment = () => {
    setFormError(null);
    setConfirmation(null);

    if (activeAmount < 50) {
      setFormError("Minimum deposit amount is 50 ETB.");
      return;
    }

    if (!transactionRef.trim()) {
      setFormError("Please enter the transaction reference from your payment confirmation.");
      return;
    }

    const idempotencyKey = `idemp_${user?.id || "anon"}_${transactionRef.trim()}_${Date.now()}`;

    manualDeposit.mutate({
      amount_etb: activeAmount,
      method: selectedMethod,
      reference: transactionRef.trim(),
      sender_detail: senderDetail.trim() || undefined,
      idempotency_key: idempotencyKey,
    });
  };

  if (isLoading) return <LoadingBlock label="Loading institutional billing operations…" />;

  const wallet = data?.wallet;
  const deposits = data?.deposits ?? [];

  const availableEtb = wallet?.available_etb ?? 12500;
  const escrowEtb = wallet?.reserved_etb ?? 30000;
  const lifetimeEtb = (wallet as any)?.lifetime_deposited_etb ?? wallet?.deposited_etb ?? 182500;

  return (
    <div className="space-y-10 font-body-md text-on-surface pb-16">
      {/* ── Header (Stitch Screen a968284a1d994ae3a8c9f9f26f740357) ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline-lg font-bold text-[#0D253A] tracking-tight">
            Wallet &amp; Billing Operations
          </h1>
          <p className="text-base text-on-surface-variant mt-1">
            Manage institutional funds, active escrows, and billing profiles.
          </p>
        </div>

        <button
          className="bg-primary hover:bg-[#003450] text-white px-6 py-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          onClick={() => {
            const el = document.getElementById("quick-deposit-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          type="button"
        >
          <span>Deposit Funds</span>
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </header>

      {/* ── 4 Metric Cards Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Available Wallet Balance */}
        <div className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)] hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Available Wallet Balance
            </h3>
            <span className="material-symbols-outlined text-primary opacity-60 group-hover:opacity-100 transition-opacity text-2xl">
              account_balance_wallet
            </span>
          </div>
          <div className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {availableEtb.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">ETB</span>
          </div>
        </div>

        {/* Card 2: Reserved in Active Escrow */}
        <div className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)] hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Reserved in Active Escrow
            </h3>
            <span className="material-symbols-outlined text-primary opacity-60 group-hover:opacity-100 transition-opacity text-2xl">
              lock
            </span>
          </div>
          <div className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {escrowEtb.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">ETB</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">Locked for live respondent payouts</p>
        </div>

        {/* Card 3: Total Lifetime Research Spend */}
        <div className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)] hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Lifetime Research Spend
            </h3>
            <span className="material-symbols-outlined text-primary opacity-60 group-hover:opacity-100 transition-opacity text-2xl">
              payments
            </span>
          </div>
          <div className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {lifetimeEtb.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">ETB</span>
          </div>
        </div>

        {/* Card 4: Subscription Status */}
        <div className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)] hover:border-primary transition-all group flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Subscription Status
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#0F9B8E]/10 text-[#0F9B8E] text-[10px] font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="text-xl font-headline-lg font-bold text-[#0D253A]">Pro Plan</div>
            <p className="text-xs text-on-surface-variant mt-0.5">2,500 ETB/mo</p>
          </div>
          <Link
            className="text-xs font-semibold text-primary hover:underline mt-4 inline-block"
            to="/researcher/subscription"
          >
            Manage Subscription →
          </Link>
        </div>
      </section>

      {/* ── Two-Column Workspace: Quick Deposit + Invoicing Profile ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="quick-deposit-section">
        {/* Left Column: Quick Deposit */}
        <div className="lg:col-span-7 bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)]">
          <h2 className="text-xl font-headline-md font-bold text-[#0D253A] mb-6 border-b border-outline-variant/30 pb-4">
            Quick Deposit / Add Funds
          </h2>

          {/* Amount selection */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-3">
              Select Amount (ETB)
            </label>
            <div className="flex flex-wrap gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedAmount === amt
                      ? "border-2 border-primary bg-primary/5 text-primary shadow-xs"
                      : "border border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
                  }`}
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  type="button"
                >
                  {amt.toLocaleString()} ETB
                </button>
              ))}
              <button
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedAmount === "custom"
                    ? "border-2 border-primary bg-primary/5 text-primary shadow-xs"
                    : "border border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
                }`}
                onClick={() => setSelectedAmount("custom")}
                type="button"
              >
                Custom Amount
              </button>
            </div>

            {selectedAmount === "custom" && (
              <div className="mt-3">
                <input
                  className="w-full bg-[#f8f9ff] border border-outline-variant/50 rounded-lg px-4 py-2.5 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  min={100}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter custom ETB amount (min 100)"
                  type="number"
                  value={customAmount}
                />
              </div>
            )}
          </div>

          {/* Payment Method Radios */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-3">
              Select Payment Method
            </label>
            <div className="space-y-3">
              {/* Telebirr */}
              <label
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedMethod === "telebirr"
                    ? "border-2 border-primary bg-primary/5 shadow-xs"
                    : "border-outline-variant/40 hover:border-primary"
                }`}
              >
                <input
                  checked={selectedMethod === "telebirr"}
                  className="text-primary focus:ring-primary h-4 w-4 border-outline-variant"
                  name="payment_method"
                  onChange={() => setSelectedMethod("telebirr")}
                  type="radio"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">smartphone</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#0D253A] block">Telebirr</span>
                    <span className="text-xs text-on-surface-variant">Automated verification via verify.et</span>
                  </div>
                </div>
              </label>

              {/* CBE */}
              <label
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedMethod === "cbe"
                    ? "border-2 border-primary bg-primary/5 shadow-xs"
                    : "border-outline-variant/40 hover:border-primary"
                }`}
              >
                <input
                  checked={selectedMethod === "cbe"}
                  className="text-primary focus:ring-primary h-4 w-4 border-outline-variant"
                  name="payment_method"
                  onChange={() => setSelectedMethod("cbe")}
                  type="radio"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#0D253A] block">
                      Commercial Bank of Ethiopia (CBE / CBE Birr)
                    </span>
                    <span className="text-xs text-on-surface-variant">Direct bank reconciliation via verify.et</span>
                  </div>
                </div>
              </label>

              {/* Bank of Abyssinia / BOA */}
              <label
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedMethod === "boa"
                    ? "border-2 border-primary bg-primary/5 shadow-xs"
                    : "border-outline-variant/40 hover:border-primary"
                }`}
              >
                <input
                  checked={selectedMethod === "boa"}
                  className="text-primary focus:ring-primary h-4 w-4 border-outline-variant"
                  name="payment_method"
                  onChange={() => setSelectedMethod("boa")}
                  type="radio"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#0D253A] block">
                      Bank of Abyssinia (BOA)
                    </span>
                    <span className="text-xs text-on-surface-variant">Automated verification via verify.et</span>
                  </div>
                </div>
              </label>

              {/* Other Bank / Wire */}
              <label
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedMethod === "bank_transfer"
                    ? "border-2 border-primary bg-primary/5 shadow-xs"
                    : "border-outline-variant/40 hover:border-primary"
                }`}
              >
                <input
                  checked={selectedMethod === "bank_transfer"}
                  className="text-primary focus:ring-primary h-4 w-4 border-outline-variant"
                  name="payment_method"
                  onChange={() => setSelectedMethod("bank_transfer")}
                  type="radio"
                />
                <div className="ml-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#0D253A] block">
                      Other Local Bank Transfer (Manual Review)
                    </span>
                    <span className="text-xs text-on-surface-variant">Admin reconciliation</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* verify.et Transaction Confirmation Details */}
          <div className="mb-6 bg-[#f8f9ff] border border-outline-variant/50 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                <h4 className="text-xs font-bold text-[#0D253A] uppercase tracking-wider">
                  verify.et Transaction Reconciliation
                </h4>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#d4e3ff] text-[#004785] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Instant Match
              </span>
            </div>

            {/* Receiving Account Box */}
            <div className="bg-white border border-[#c1c7d0]/60 rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] font-medium text-on-surface-variant mb-1">
                Transfer to Ethosk Escrow Account:
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0D253A]">
                    {selectedMethod === "telebirr" && "Telebirr (Ethosk Escrow)"}
                    {selectedMethod === "cbe" && "Commercial Bank of Ethiopia (CBE)"}
                    {selectedMethod === "cbe_birr" && "CBE Birr (Ethosk Escrow)"}
                    {selectedMethod === "boa" && "Bank of Abyssinia (BOA)"}
                    {selectedMethod === "awash" && "Awash Bank"}
                    {selectedMethod === "dashen" && "Dashen Bank"}
                    {selectedMethod === "bank_transfer" && "Bank Wire / Local Transfer"}
                  </div>
                  <div className="text-sm font-mono font-extrabold text-primary tracking-wide">
                    {selectedMethod === "telebirr" && "0974688397"}
                    {selectedMethod === "cbe" && "1000307620522"}
                    {selectedMethod === "cbe_birr" && "0974688397"}
                    {selectedMethod === "boa" && "1000307620522"}
                    {selectedMethod === "awash" && "1000307620522"}
                    {selectedMethod === "dashen" && "1000307620522"}
                    {selectedMethod === "bank_transfer" && "1000307620522 (CBE)"}
                  </div>
                  <div className="text-[10px] text-on-surface-variant">
                    Account Name: <strong className="text-on-surface">Ethosk Research Escrow</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const acc = selectedMethod === "cbe" ? "1000307620522" : "0974688397";
                    navigator.clipboard.writeText(acc);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs font-bold bg-[#f1f4f9] hover:bg-[#e2e8f0] text-primary px-3 py-1.5 rounded-lg border border-outline-variant/60 transition"
                  title="Copy Account Number"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? "check" : "content_copy"}
                  </span>
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Transfer exactly <strong>{activeAmount.toLocaleString()} ETB</strong>, then paste the transaction reference from your SMS or banking app below for instant verification.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#0D253A] block mb-1" htmlFor="tx_reference">
                Transaction Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                id="tx_reference"
                className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-xs md:text-sm font-mono font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={selectedMethod === "cbe" ? "e.g., FT26123490 or CBE Transaction ID" : "e.g., FT2423490X12 or Telebirr Ref #"}
                type="text"
                value={transactionRef}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0D253A] block mb-1" htmlFor="sender_detail">
                Sender Phone or Account Suffix <span className="text-xs font-normal text-on-surface-variant">(Optional)</span>
              </label>
              <input
                id="sender_detail"
                className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-xs md:text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setSenderDetail(e.target.value)}
                placeholder="e.g., Last 4 digits (*8901)"
                type="text"
                value={senderDetail}
              />
            </div>
          </div>

          {formError && (
            <div className="mb-4">
              <Notice tone="error">{formError}</Notice>
            </div>
          )}

          {confirmation && (
            <div className="mb-4">
              <Notice tone="success">{confirmation}</Notice>
            </div>
          )}

          <button
            className="w-full bg-primary hover:bg-[#003450] text-white py-3.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            disabled={manualDeposit.isPending}
            onClick={handleProceedPayment}
            type="button"
          >
            {manualDeposit.isPending ? (
              <>
                <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                <span>Verifying with verify.et…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">lock_open</span>
                <span>Verify &amp; Credit Deposit ({activeAmount.toLocaleString()} ETB)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Billing Info & Invoicing */}
        <div className="lg:col-span-5 bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)] flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-headline-md font-bold text-[#0D253A] mb-6 border-b border-outline-variant/30 pb-4">
              Billing Info &amp; Invoicing
            </h2>

            <div className="space-y-5 text-sm">
              <div>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Organization / Researcher
                </span>
                <div className="font-semibold text-[#0D253A]">
                  {profile?.institution || user?.full_name || user?.email || "Personal Researcher Account"}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Account Email
                </span>
                <div className="font-mono text-sm text-[#0D253A]">
                  {profile?.institutional_email || user?.email || "Not configured"}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Verification Status
                </span>
                <div className="text-on-surface flex items-center gap-1.5 text-xs font-medium">
                  <span className={`inline-block w-2 h-2 rounded-full ${profile?.verified || user?.verification_tier === "1_id_verified" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span>{profile?.verified || user?.verification_tier === "1_id_verified" ? "Verified Institutional Account" : "Standard Account (Unverified)"}</span>
                </div>
              </div>

              <div className="p-4 bg-[#f8f9ff] rounded-xl border border-outline-variant/40 mt-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">info</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    VAT receipts and deposit invoices are automatically generated and linked to your transaction history upon successful clearance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/researcher/profile?tab=edit"
            className="w-full mt-6 bg-[#f8f9ff] border border-outline-variant text-primary hover:bg-primary/5 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center block"
          >
            Edit Profile &amp; Affiliation
          </Link>
        </div>
      </section>

      {/* ── Transaction & Escrow History Table ── */}
      <section className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(13,37,58,0.04)] overflow-hidden">
        <h2 className="text-xl font-headline-md font-bold text-[#0D253A] mb-6">
          Transaction &amp; Escrow History
        </h2>

        {deposits.length === 0 ? (
          <EmptyState icon="receipt_long" title="No billing transactions yet">
            Deposits, subscription renewals, and survey escrow commitments will appear here.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-[#f8f9ff] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Reference ID</th>
                  <th className="py-4 px-4">Description</th>
                  <th className="py-4 px-4 text-right">Amount (ETB)</th>
                  <th className="py-4 px-4">Method</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs md:text-sm">
                {deposits.map((dep) => {
                  const isCompleted = dep.status === "completed";
                  const isPending = dep.status === "pending";

                  return (
                    <tr className="hover:bg-[#f8f9ff] transition-colors" key={dep.id}>
                      <td className="py-4 px-4 whitespace-nowrap text-[#5A6E7F]">
                        {new Date(dep.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-4 px-4 font-mono text-[#5A6E7F]">
                        #{dep.reference || dep.id.slice(0, 8).toUpperCase()}
                      </td>

                      <td className="py-4 px-4 text-[#0D253A] font-semibold">
                        Deposit via {DEPOSIT_METHOD_LABEL[dep.method] || "Telebirr"}
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-emerald-600">
                        +{dep.amount_etb.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 text-[#5A6E7F]">
                        {DEPOSIT_METHOD_LABEL[dep.method] || "Telebirr"}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {DEPOSIT_STATUS_LABEL[dep.status] || "Completed"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
