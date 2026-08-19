import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { PayoutRecord, RespondentWallet } from "@shared/types";
import { CashoutModal } from "@/components/CashoutModal";
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface WalletPayload {
  wallet: RespondentWallet;
  payouts: PayoutRecord[];
}

export function WalletPage() {
  const { user } = useAuth();
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["respondent-wallet"],
    queryFn: () => api<WalletPayload>("/wallet/respondent"),
  });

  if (isLoading) return <LoadingBlock label="Loading your wallet & ledger…" />;

  const wallet = data?.wallet;
  const payouts = data?.payouts ?? [];

  const availableAmount = wallet?.available_etb ?? 0;
  const pendingAmount = wallet?.pending_etb ?? 0;
  const lifetimeAmount = wallet?.lifetime_etb ?? 0;
  const averageReward = wallet?.paid_response_count && wallet.paid_response_count > 0
    ? Math.round(lifetimeAmount / wallet.paid_response_count)
    : 0;
  const isVerified = user?.verification_tier && user.verification_tier !== "0_registered";
  const canWithdraw = availableAmount >= 100 && isVerified;

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* ── Page Header (Stitch Screen 0424ea7b43dc48e292c214d2388aaca9) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-3xl md:text-4xl text-[#0D253A] font-bold tracking-tight">
            Wallet &amp; Payouts
          </h1>
          <p className="text-xs text-[#5A6E7F] mt-1">
            Minimum cashout threshold: <span className="font-bold text-[#0D253A]">100.00 ETB</span> (Telebirr or CBE Birr)
          </p>
        </div>
        <button
          className="bg-[#1D5D8A] hover:bg-[#00456d] text-white transition-colors px-6 py-2.5 rounded-lg font-body-sm text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          disabled={!canWithdraw && !isVerified}
          onClick={() => setIsCashoutModalOpen(true)}
          type="button"
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>Withdraw Funds</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {!isVerified && (
        <Notice tone="warning" title="Identity Verification Required for Cashout">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs">
              To withdraw earnings via Telebirr or CBE Birr, your account must complete Fayda or ID verification.
            </p>
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00456d] text-white text-xs font-semibold hover:bg-[#1d5d8a] transition-colors shrink-0"
            >
              <span>Complete Verification</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </Notice>
      )}

      {error ? (
        <Notice tone="error" title="Balance unavailable">
          <p>Your earnings ledger could not be read right now. Please check your connection and retry.</p>
          <Button
            className="mt-stack-sm"
            icon="refresh"
            loading={isFetching}
            onClick={() => refetch()}
            variant="outline"
          >
            Retry
          </Button>
        </Notice>
      ) : null}

      {/* ── Metrics Bento Grid (4 Cards matching Stitch Screen) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Available to Withdraw */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1D5D8A] transition-all shadow-[0_4px_20px_rgba(0,89,133,0.05)] flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-label-sm text-[#5A6E7F] uppercase tracking-wider font-semibold">
              Available to Withdraw
            </p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-auto pt-3">
            <span className="text-3xl font-headline-md font-bold text-[#0D253A]">
              {availableAmount.toLocaleString()}
            </span>
            <span className="text-xs text-[#5A6E7F] font-medium">ETB</span>
          </div>
        </div>

        {/* Metric 2: Pending Earnings */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1D5D8A] transition-all shadow-[0_4px_20px_rgba(0,89,133,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-xs font-label-sm text-[#5A6E7F] uppercase tracking-wider font-semibold">
              Pending Earnings
            </p>
            <span className="bg-[#F59E0B]/15 text-[#b06000] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ml-2">
              Processing
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-auto pt-3">
            <span className="text-3xl font-headline-md font-bold text-[#0D253A]">
              {pendingAmount.toLocaleString()}
            </span>
            <span className="text-xs text-[#5A6E7F] font-medium">ETB</span>
          </div>
        </div>

        {/* Metric 3: Average Reward per Survey */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1D5D8A] transition-all shadow-[0_4px_20px_rgba(0,89,133,0.05)] flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-label-sm text-[#5A6E7F] uppercase tracking-wider font-semibold">
              Average Reward per Survey
            </p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-auto pt-3">
            <span className="text-3xl font-headline-md font-bold text-[#0D253A]">
              {averageReward}
            </span>
            <span className="text-xs text-[#5A6E7F] font-medium">ETB</span>
          </div>
        </div>

        {/* Metric 4: Total Lifetime Earned */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1D5D8A] transition-all shadow-[0_4px_20px_rgba(0,89,133,0.05)] flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-label-sm text-[#5A6E7F] uppercase tracking-wider font-semibold">
              Total Lifetime Earned
            </p>
          </div>
          <div className="flex items-baseline gap-1.5 mt-auto pt-3">
            <span className="text-3xl font-headline-md font-bold text-[#0D253A]">
              {lifetimeAmount.toLocaleString()}
            </span>
            <span className="text-xs text-[#5A6E7F] font-medium">ETB</span>
          </div>
        </div>
      </div>

      {/* ── Transaction Table Section (Exact Stitch Design) ── */}
      <div className="bg-white rounded-xl border border-[#E1E8EE] overflow-hidden shadow-[0_4px_20px_rgba(0,89,133,0.05)]">
        <div className="p-5 border-b border-[#E1E8EE] bg-[#f8f9ff]">
          <h2 className="font-headline-md text-base md:text-lg font-bold text-[#0D253A] m-0">
            Transaction &amp; Payout History
          </h2>
        </div>

        {payouts.length === 0 ? (
          <div className="p-8">
            <EmptyState icon="receipt_long" title="No transaction records yet">
              Completed survey rewards and withdrawal disbursements will appear in this itemized ledger.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#E1E8EE]">
                  <th className="py-3.5 px-4 font-semibold text-xs text-[#5A6E7F] uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-xs text-[#5A6E7F] uppercase tracking-wider whitespace-nowrap">
                    Reference ID
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-xs text-[#5A6E7F] uppercase tracking-wider">
                    Description / Survey Title
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-xs text-[#5A6E7F] uppercase tracking-wider text-right whitespace-nowrap">
                    Amount (ETB)
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-xs text-[#5A6E7F] uppercase tracking-wider whitespace-nowrap">
                    Payment Method
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-xs text-[#5A6E7F] uppercase tracking-wider whitespace-nowrap text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8EE] text-xs md:text-sm text-[#5A6E7F]">
                {payouts.map((row: any) => {
                  const isWithdrawal = Boolean(row.is_withdrawal || row.status === "paid" || row.status === "withdrawn");
                  const isPending = row.status === "pending";
                  const isFailed = row.status === "failed";
                  const displayAmount = row.net_amount_etb ?? row.amount_etb;

                  return (
                    <tr className="hover:bg-[#f8f9ff] transition-colors" key={row.id}>
                      <td className="py-4 px-4 whitespace-nowrap text-on-surface">
                        {new Date(row.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-primary">
                        #{row.id.slice(0, 8).toUpperCase()}
                      </td>

                      <td className="py-4 px-4 text-on-surface font-medium">
                        <div className="flex items-center gap-2">
                          {isWithdrawal && (
                            <span className="material-symbols-outlined text-[#1D5D8A] text-base">
                              account_balance_wallet
                            </span>
                          )}
                          <span>{row.survey_title || (isWithdrawal ? "Mobile Withdrawal" : "Survey Reward")}</span>
                        </div>
                      </td>

                      <td
                        className={`py-4 px-4 text-right font-semibold whitespace-nowrap ${
                          isWithdrawal ? "text-error" : "text-[#0F9B8E]"
                        }`}
                      >
                        {isWithdrawal ? `-${displayAmount.toFixed(2)}` : `+${displayAmount.toFixed(2)}`}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          isWithdrawal ? "bg-blue-50 text-[#00456d]" : "bg-emerald-50 text-emerald-800"
                        }`}>
                          {row.payout_method || (isWithdrawal ? "Telebirr / CBE" : "Survey Reward")}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-block bg-[#F59E0B]/10 text-[#b06000] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                            Pending (Awaiting Quality Check)
                          </span>
                        ) : isFailed ? (
                          <span className="inline-block bg-error/10 text-error text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-block bg-[#0F9B8E]/10 text-[#0F9B8E] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cashout Modal */}
      <CashoutModal
        availableEtb={availableAmount}
        isOpen={isCashoutModalOpen}
        onClose={() => setIsCashoutModalOpen(false)}
      />
    </div>
  );
}
