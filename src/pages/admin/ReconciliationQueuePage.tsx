import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, Field, Icon, LoadingBlock, Notice } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

export interface ReconciliationItem {
  id: string;
  type: "deposit" | "payout";
  user_id: string;
  user_name: string;
  user_email: string;
  role: "researcher" | "respondent";
  amount_etb: number;
  provider: string;
  reference: string;
  provider_ref: string | null;
  claimed_detail: string;
  status: string;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
}

export interface ReconciliationMetrics {
  total_needs_review: number;
  total_deposits: number;
  total_payouts: number;
  total_transactions: number;
  unsupported_share_percent: number;
  flag_volume_alert: boolean;
}

export interface ReconciliationPayload {
  items: ReconciliationItem[];
  metrics: ReconciliationMetrics;
}

export function ReconciliationQueuePage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<"all" | "deposit" | "payout">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<ReconciliationItem | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [providerRefInput, setProviderRefInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-reconciliation-queue"],
    queryFn: () => api<ReconciliationPayload>("/admin/reconciliation-queue"),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      id,
      type,
      decision,
      notes,
      provider_ref,
    }: {
      id: string;
      type: "deposit" | "payout";
      decision: "confirm" | "reject";
      notes?: string;
      provider_ref?: string;
    }) =>
      api(`/admin/reconciliation-queue/${id}`, {
        body: { type, decision, notes, provider_ref },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      closeActionModal();
    },
    onError: (err) => {
      setErrorMessage(
        err instanceof ApiRequestError ? err.message : "Failed to process reconciliation item.",
      );
    },
  });

  const openActionModal = (item: ReconciliationItem, type: "confirm" | "reject") => {
    setActiveItem(item);
    setActionType(type);
    setActionNotes("");
    setProviderRefInput(item.provider_ref || "");
    setErrorMessage(null);
  };

  const closeActionModal = () => {
    setActiveItem(null);
    setActionType(null);
    setActionNotes("");
    setProviderRefInput("");
    setErrorMessage(null);
  };

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !actionType) return;

    if (actionType === "reject" && !actionNotes.trim()) {
      setErrorMessage("Please specify a reason for rejecting this transaction.");
      return;
    }

    decisionMutation.mutate({
      id: activeItem.id,
      type: activeItem.type,
      decision: actionType,
      notes: actionNotes.trim() || undefined,
      provider_ref: providerRefInput.trim() || undefined,
    });
  };

  if (isLoading) return <LoadingBlock label="Loading manual reconciliation queue…" />;

  const items = data?.items ?? [];
  const metrics = data?.metrics ?? {
    total_needs_review: 0,
    total_deposits: 0,
    total_payouts: 0,
    total_transactions: 0,
    unsupported_share_percent: 0,
    flag_volume_alert: false,
  };

  const filteredItems = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = item.reference?.toLowerCase().includes(q);
      const matchUser = item.user_name?.toLowerCase().includes(q) || item.user_email?.toLowerCase().includes(q);
      const matchDetail = item.claimed_detail?.toLowerCase().includes(q);
      const matchProvider = item.provider?.toLowerCase().includes(q);
      if (!matchRef && !matchUser && !matchDetail && !matchProvider) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-[#00456d] tracking-tight">
              Transaction Reconciliation Queue
            </h1>
            <span className="bg-[#1d5d8a]/10 text-[#00456d] font-mono text-xs font-bold px-2.5 py-1 rounded-full">
              v4 §8 Fallback
            </span>
          </div>
          <p className="text-xs text-[#5A6E7F] mt-1">
            Manual administrative review queue for unsupported payment providers and transaction clearances requiring verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon="refresh"
            loading={isFetching}
            onClick={() => refetch()}
            size="sm"
            variant="outline"
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* ── Pilot Volume Monitoring KPI Banner (Spec v4 §8) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            Pending Review
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#0D253A]">{metrics.total_needs_review}</span>
            <span className="text-xs text-[#5A6E7F]">transactions</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            Deposits vs Payouts
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              +{metrics.total_deposits} Deposits
            </span>
            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              -{metrics.total_payouts} Payouts
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            Manual Volume Share
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#0D253A]">{metrics.unsupported_share_percent}%</span>
            <span className="text-xs text-[#5A6E7F]">of platform total</span>
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between ${
            metrics.flag_volume_alert
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-emerald-50 border-emerald-300 text-emerald-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pilot Volume Monitor
            </span>
            <span className="material-symbols-outlined text-sm">
              {metrics.flag_volume_alert ? "warning" : "check_circle"}
            </span>
          </div>
          <p className="text-xs font-medium mt-2">
            {metrics.flag_volume_alert
              ? "Elevated manual volume. Monitor provider expansion during pilot."
              : "Manual reconciliation rate within healthy pilot thresholds (<15%)."}
          </p>
        </div>
      </div>

      {error ? (
        <Notice tone="error" title="Queue Unavailable">
          <p>Failed to retrieve manual reconciliation items. Please retry.</p>
        </Notice>
      ) : null}

      {/* ── Filters & Search ── */}
      <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === "all"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setFilterType("all")}
            type="button"
          >
            All Items ({items.length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === "deposit"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setFilterType("deposit")}
            type="button"
          >
            Deposits ({items.filter((i) => i.type === "deposit").length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === "payout"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setFilterType("payout")}
            type="button"
          >
            Payouts ({items.filter((i) => i.type === "payout").length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">
            search
          </span>
          <input
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E1E8EE] bg-[#f8f9fa] text-xs text-[#0D253A] placeholder-gray-400 focus:bg-white focus:border-[#00456d] focus:outline-none"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, user, provider, phone..."
            type="text"
            value={searchQuery}
          />
        </div>
      </div>

      {/* ── Reconciliation Table ── */}
      {filteredItems.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => refetch()} variant="outline">
              Refresh
            </Button>
          }
          description={
            searchQuery || filterType !== "all"
              ? "No reconciliation items matched your current filter criteria."
              : "The manual reconciliation queue is clear. All transactions have been automated via verify.et."
          }
          icon="task_alt"
          title="No Transactions Awaiting Review"
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E1E8EE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#E1E8EE]">
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    Type / Date
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    User &amp; Role
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    Reference ID
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider text-right">
                    Amount (ETB)
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    Claimed Detail / Reason
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8EE] text-xs">
                {filteredItems.map((item) => {
                  const isDeposit = item.type === "deposit";
                  return (
                    <tr className="hover:bg-[#fbfcfe] transition-colors" key={item.id}>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isDeposit
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isDeposit ? "Escrow Deposit" : "Respondent Payout"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5A6E7F] mt-1 font-mono">
                          {new Date(item.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#0D253A]">{item.user_name}</p>
                        <p className="text-[11px] text-[#5A6E7F]">{item.user_email}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold uppercase tracking-wider text-[#00456d] bg-gray-100 px-2 py-0.5 rounded">
                          {item.provider.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#00456d]">
                        #{item.reference}
                      </td>

                      <td
                        className={`py-3.5 px-4 text-right font-bold text-sm whitespace-nowrap ${
                          isDeposit ? "text-emerald-700" : "text-[#0D253A]"
                        }`}
                      >
                        {isDeposit ? `+${item.amount_etb.toLocaleString()}` : `-${item.amount_etb.toLocaleString()}`} ETB
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[#0D253A] font-medium">
                          Account/Sender: <span className="font-mono font-bold">{item.claimed_detail}</span>
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {item.verification_notes || "Unsupported provider fallback"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            onClick={() => openActionModal(item, "confirm")}
                            type="button"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-xs">check</span>
                            <span>Confirm</span>
                          </button>
                          <button
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            onClick={() => openActionModal(item, "reject")}
                            type="button"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-xs">close</span>
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Confirm / Reject Action Modal ── */}
      {activeItem && actionType && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    actionType === "confirm"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <Icon
                    className="text-xl"
                    name={actionType === "confirm" ? "check_circle" : "cancel"}
                  />
                </div>
                <div>
                  <h2 className="font-title-sm text-lg font-bold text-[#0D253A]">
                    {actionType === "confirm"
                      ? `Manually Confirm ${activeItem.type === "deposit" ? "Deposit" : "Payout"}`
                      : `Reject ${activeItem.type === "deposit" ? "Deposit" : "Payout"}`}
                  </h2>
                  <p className="text-xs text-[#5A6E7F]">
                    Ref: <span className="font-mono font-bold">#{activeItem.reference}</span> • {activeItem.amount_etb} ETB ({activeItem.provider.toUpperCase()})
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                onClick={closeActionModal}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmitAction}>
              {actionType === "confirm" ? (
                <Notice tone="info">
                  {activeItem.type === "deposit"
                    ? `Confirming will mark this deposit as completed and immediately credit ${activeItem.amount_etb.toLocaleString()} ETB to the researcher's wallet.`
                    : `Confirming will mark this cashout as completed and paid to account ${activeItem.claimed_detail}.`}
                </Notice>
              ) : (
                <Notice tone="warning">
                  Rejecting will mark this transaction as failed. No funds will be credited.
                </Notice>
              )}

              {actionType === "confirm" && (
                <Field label="Bank / Provider Confirmation Reference (Optional)">
                  <input
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs font-mono text-on-surface focus:border-[#00456d] focus:outline-none"
                    onChange={(e) => setProviderRefInput(e.target.value)}
                    placeholder="e.g. CBE-TX-99881122 or Telebirr Trans ID"
                    type="text"
                    value={providerRefInput}
                  />
                </Field>
              )}

              <Field
                label={
                  actionType === "confirm"
                    ? "Audit Notes (Optional)"
                    : "Rejection Reason (Required)"
                }
              >
                <textarea
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-[#00456d] focus:outline-none min-h-[80px]"
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === "confirm"
                      ? "e.g. Verified via CBE statement PDF on Aug 25"
                      : "e.g. Bank reference not found on statement or sender mismatch"
                  }
                  required={actionType === "reject"}
                  value={actionNotes}
                />
              </Field>

              {errorMessage && <Notice tone="error">{errorMessage}</Notice>}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <Button onClick={closeActionModal} type="button" variant="outline">
                  Cancel
                </Button>
                <Button
                  className={actionType === "confirm" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
                  loading={decisionMutation.isPending}
                  type="submit"
                >
                  {actionType === "confirm" ? "Confirm & Advance" : "Reject Transaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
