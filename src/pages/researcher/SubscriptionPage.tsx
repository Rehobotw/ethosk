import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon, Notice, LoadingBlock } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface BillingInvoice {
  id: string;
  date: string;
  plan: string;
  amountEtb: number;
  paymentMethod: "telebirr" | "cbe_birr" | "wallet";
}

export function SubscriptionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const isSubscribed = user?.subscription_tier === "subscribed";
  const isCancelled = user?.subscription_tier === "cancelled";
  const isActive = isSubscribed || isCancelled; // access during grace period
  const expiresAt = user?.subscription_expires_at
    ? new Date(user.subscription_expires_at).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : null;

  // ── REH-138: Real billing history from DB ──────────────────────────────────
  const { data: billingData, isLoading: isLoadingBilling } = useQuery({
    queryKey: ["researcher-billing-history"],
    queryFn: () => api<{ history: BillingInvoice[] }>("/wallet/researcher/billing-history"),
  });
  const billingHistory = billingData?.history ?? [];

  // ── Subscribe mutation ─────────────────────────────────────────────────────
  const { mutate: subscribe, isPending: isSubscribing } = useMutation({
    mutationFn: async () => {
      setError(null);
      setSuccessNotice(null);
      return api("/wallet/researcher/subscription", { method: "POST" });
    },
    onSuccess: () => {
      setSuccessNotice("Successfully upgraded to Pro Researcher tier!");
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["researcher-billing-history"] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Failed to upgrade subscription. Please check your wallet balance and try again.");
      }
    },
  });

  // ── REH-139: Real cancel subscription mutation ─────────────────────────────
  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      setError(null);
      return api<{ message: string; subscription_expires_at: string }>(
        "/wallet/researcher/subscription",
        { method: "DELETE" },
      );
    },
    onSuccess: (data) => {
      setCancelModalOpen(false);
      setSuccessNotice(
        `Your subscription has been scheduled to cancel. You retain Pro access until ${expiresAt ?? "the end of the billing period"}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["researcher-wallet"] });
    },
    onError: (err) => {
      setCancelModalOpen(false);
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Failed to cancel subscription. Please try again or contact support.");
      }
    },
  });

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-20 space-y-10 animate-fade-in text-[#0b1c30]">
      {/* ── Page Header (Stitch Spec) ── */}
      <div>
        <h1 className="text-2xl md:text-4xl font-headline font-bold text-[#001d29] tracking-tight">
          Subscription &amp; Plan Management
        </h1>
        <p className="mt-1 text-xs md:text-sm text-[#41484c] max-w-3xl leading-relaxed">
          Manage your active research plans, view upcoming renewals, and download billing history to maintain seamless access to the Trust Layer Infrastructure.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {successNotice && <Notice tone="success">{successNotice}</Notice>}

      {/* ── Active Plan Banner / Card ── */}
      <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#2872A1] flex items-center justify-center shrink-0">
            <Icon className="text-[26px]" filled name="verified_user" />
          </div>

          <div className="space-y-1">
            <h2 className="font-headline font-bold text-lg md:text-xl text-[#001d29]">
              Active Plan: {isActive ? "Pro Researcher" : "Community Basic"}
            </h2>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {isActive ? (
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{isCancelled ? "Active (Cancelling)" : "Active"}</span>
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-500 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  <span>Free Tier</span>
                </span>
              )}
              {expiresAt && (
                <span className="text-[#71787c]">
                  {isCancelled ? `Access until: ${expiresAt}` : `Auto-renews: ${expiresAt}`}
                </span>
              )}
            </div>

            <p className="text-xs text-[#41484c] pt-1">
              <span className="font-bold text-[#001d29] font-mono">
                {isActive ? "2,500 ETB / month" : "0 ETB / month"}
              </span>{" "}
              <span className="text-[#71787c]">
                {isActive ? "(Wallet Auto-Debit)" : "(Free Tier)"}
              </span>
            </p>
          </div>
        </div>

        {isSubscribed && !isCancelled && (
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-[#c1c7cc] hover:border-[#001d29] text-[#001d29] text-xs font-semibold hover:bg-[#f8f9ff] transition-all cursor-pointer"
          >
            Cancel / Pause Subscription
          </button>
        )}
      </div>

      {/* ── Available Plans Section ── */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs font-bold text-[#41484c] uppercase tracking-wider">
          Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Basic Plan */}
          <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 p-6 md:p-8 flex flex-col justify-between shadow-2xs">
            <div>
              <h3 className="font-headline font-bold text-lg text-[#001d29] mb-1">
                Basic
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-headline font-bold text-3xl text-[#001d29]">0</span>
                <span className="text-xs text-[#71787c]">ETB/mo</span>
              </div>
              <p className="text-xs text-[#41484c] mb-6">
                Essential tools for entry-level academic research.
              </p>

              <ul className="space-y-3 text-xs text-[#41484c] mb-8">
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>Manual builder</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>Document import</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>Demographic targeting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>CSV export</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={!isActive}
              className="w-full py-3 px-4 rounded-xl border border-[#c1c7cc]/60 text-[#71787c] text-xs font-semibold bg-[#f8f9ff] text-center"
            >
              Current Basic Features
            </button>
          </div>

          {/* 2. Pro Researcher (Current Active / Recommended) */}
          <div className="bg-white rounded-2xl border-2 border-[#001d29] p-6 md:p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
            {/* Top Pill */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#001d29] text-white text-[10px] font-mono font-bold px-4 py-1 rounded-b-lg uppercase tracking-wider">
              {isActive ? "CURRENT ACTIVE PLAN" : "RECOMMENDED"}
            </div>

            <div className="pt-2">
              <h3 className="font-headline font-bold text-lg text-[#001d29] mb-1">
                Pro Researcher
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-headline font-bold text-3xl text-[#001d29]">2,500</span>
                <span className="text-xs text-[#71787c]">ETB/mo</span>
              </div>
              <p className="text-xs text-[#41484c] mb-6">
                Advanced AI verification for high-stakes studies.
              </p>

              <ul className="space-y-3 text-xs text-[#001d29] font-medium mb-8">
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-[#2872A1]" name="auto_awesome" />
                  <span>AI Generator &amp; Optimizer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-[#2872A1]" name="description" />
                  <span>Executive Summaries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-[#2872A1]" name="sentiment_satisfied" />
                  <span>Sentiment Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-[#2872A1]" name="support_agent" />
                  <span>Priority Support</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              id="subscribe-btn"
              onClick={() => !isActive && subscribe()}
              disabled={isActive || isSubscribing}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? "bg-[#eff4ff] text-[#001d29] cursor-default"
                  : "bg-[#001d29] hover:bg-[#003345] text-white shadow-sm cursor-pointer"
              }`}
            >
              {isSubscribing ? (
                <Icon className="animate-spin text-[16px]" name="progress_activity" />
              ) : isActive ? (
                <Icon className="text-[16px]" name="check" />
              ) : (
                <Icon className="text-[16px]" name="account_balance_wallet" />
              )}
              <span>{isActive ? "Active Plan" : "Upgrade with Wallet Balance"}</span>
            </button>
          </div>

          {/* 3. Enterprise Custom */}
          <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 p-6 md:p-8 flex flex-col justify-between shadow-2xs">
            <div>
              <h3 className="font-headline font-bold text-lg text-[#001d29] mb-1">
                Enterprise
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-headline font-bold text-3xl text-[#001d29]">Custom</span>
              </div>
              <p className="text-xs text-[#41484c] mb-6">
                Infrastructure for large NGOs and universities.
              </p>

              <ul className="space-y-3 text-xs text-[#41484c] mb-8">
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>All Pro+ features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>Multi-seat licensing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>Niche panel access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon className="text-[16px] text-emerald-600 font-bold" name="check" />
                  <span>Wire transfers &amp; SLA</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:institutional@ethosk.et?subject=Enterprise%20Plan%20Inquiry"
              className="w-full py-3 px-4 rounded-xl bg-[#2872A1] hover:bg-[#003345] text-white text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Contact Sales</span>
              <Icon className="text-[16px]" name="arrow_forward" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Subscription Billing History Table (REH-138: real data from DB) ── */}
      <div className="space-y-4 pt-4">
        <h2 className="font-mono text-xs font-bold text-[#41484c] uppercase tracking-wider">
          Subscription Billing History
        </h2>

        <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 overflow-hidden shadow-2xs">
          {isLoadingBilling ? (
            <LoadingBlock />
          ) : billingHistory.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#71787c]">
              No billing records yet. Your subscription charges will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#c1c7cc]/30 bg-[#f8f9ff] text-[#71787c] font-mono uppercase tracking-wider">
                    <th className="py-3 px-6 font-semibold">Invoice Date</th>
                    <th className="py-3 px-6 font-semibold">Plan</th>
                    <th className="py-3 px-6 font-semibold">Amount (ETB)</th>
                    <th className="py-3 px-6 font-semibold">Payment Method</th>
                    <th className="py-3 px-6 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c1c7cc]/20">
                  {billingHistory.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-[#f8f9ff]/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-[#001d29]">{invoice.date}</td>
                      <td className="py-4 px-6 text-[#41484c]">{invoice.plan}</td>
                      <td className="py-4 px-6 font-mono font-bold text-[#001d29]">
                        {invoice.amountEtb.toLocaleString()} ETB
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-[#eff4ff] text-[#2872A1] font-mono text-[10px] font-bold px-2.5 py-1 rounded-md capitalize">
                          {invoice.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          href={`/api/wallet/researcher/billing-history/${invoice.id}/receipt`}
                          className="inline-flex items-center gap-1 text-[#2872A1] hover:text-[#001d29] font-bold cursor-pointer"
                          download={`receipt-${invoice.id}.pdf`}
                        >
                          <Icon className="text-[14px]" name="download" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel Subscription Modal (REH-139: wired to real DELETE endpoint) ── */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-headline font-bold text-lg text-[#001d29]">
              Pause or Cancel Subscription?
            </h3>
            <p className="text-xs text-[#41484c] leading-relaxed">
              Your Pro access will remain active until the end of the current billing cycle
              {expiresAt ? (
                <>
                  {" on "}
                  <strong>{expiresAt}</strong>
                </>
              ) : null}
              . After this date, your account will revert to the Basic plan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="px-4 py-2 border border-[#c1c7cc] rounded-xl text-xs font-semibold text-[#71787c]"
              >
                Keep Active
              </button>
              <button
                type="button"
                id="confirm-cancel-btn"
                onClick={() => cancelSubscription()}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {isCancelling && (
                  <Icon className="animate-spin text-[16px]" name="progress_activity" />
                )}
                <span>{isCancelling ? "Cancelling…" : "Confirm Cancellation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
