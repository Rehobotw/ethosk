import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocType } from "@shared/types";
import {
  EmptyState,
  Input,
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";

interface ReviewItem {
  id: string;
  user_id: string;
  doc_type: DocType;
  ai_notes: string | null;
  created_at: string;
  respondent: { full_name: string; email: string; verification_tier: string } | null;
  preview_url: string | null;
}

type TabKey = "pending" | "flagged" | "approved";

export function AdminReviewQueuePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectingItem, setInspectingItem] = useState<ReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api<{ items: ReviewItem[] }>("/admin/review-queue"),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: "passed" | "failed"; notes?: string }) =>
      api<{ id: string }>(`/admin/review-queue/${id}`, { body: { decision, notes } }),
    onSuccess: () => {
      setInspectingItem(null);
      setRejectReason("");
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });

  const items = data?.items ?? [];

  const pendingItems = items.filter((i) => !i.ai_notes || !i.ai_notes.toLowerCase().includes("flag"));
  const flaggedItems = items.filter((i) => i.ai_notes && i.ai_notes.toLowerCase().includes("flag"));

  const displayItems = activeTab === "flagged" ? flaggedItems : pendingItems;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    selectedIds.forEach((id) => {
      decide.mutate({ id, decision: "passed" });
    });
  };

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#181c1e] pb-16">
      {/* ── Header Section (Stitch Screen 5ad14fea00de44119f65448479cb37a0) ── */}
      <div>
        <h1 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#00456d] mb-1 tracking-tight">
          Verification Queue
        </h1>
        <p className="text-sm md:text-base text-[#4b6078]">
          Review and process pending identity and credential verifications.
        </p>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="border-b border-[#c1c7d0] flex space-x-8 text-xs font-semibold">
        <button
          className={`pb-4 transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === "pending"
              ? "text-[#00456d] border-b-2 border-[#00456d] font-bold"
              : "text-[#4b6078] hover:text-[#00456d]"
          }`}
          onClick={() => setActiveTab("pending")}
          type="button"
        >
          <span>Pending Review</span>
          <span className="bg-[#00456d]/10 text-[#00456d] px-2 py-0.5 rounded-full text-[10px] font-bold">
            {pendingItems.length}
          </span>
        </button>

        <button
          className={`pb-4 transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === "flagged"
              ? "text-[#00456d] border-b-2 border-[#00456d] font-bold"
              : "text-[#4b6078] hover:text-[#00456d]"
          }`}
          onClick={() => setActiveTab("flagged")}
          type="button"
        >
          <span>Flagged / Action Required</span>
          <span className="bg-[#ba1a1a]/10 text-[#ba1a1a] px-2 py-0.5 rounded-full text-[10px] font-bold">
            {flaggedItems.length}
          </span>
        </button>

        <button
          className={`pb-4 transition-colors flex items-center space-x-2 cursor-pointer ${
            activeTab === "approved"
              ? "text-[#00456d] border-b-2 border-[#00456d] font-bold"
              : "text-[#4b6078] hover:text-[#00456d]"
          }`}
          onClick={() => setActiveTab("approved")}
          type="button"
        >
          <span>Recently Approved</span>
        </button>
      </div>

      {/* ── Batch Action Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-lg border border-[#c1c7d0] shadow-xs">
        <div className="flex items-center space-x-4 pl-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              checked={selectedIds.length > 0 && selectedIds.length === displayItems.length}
              className="rounded border-[#c1c7d0] text-[#00456d] focus:ring-[#00456d] w-4 h-4 cursor-pointer"
              onChange={(e) => handleSelectAll(e.target.checked)}
              type="checkbox"
            />
            <span className="text-xs font-semibold text-[#4b6078] select-none">
              Select All
            </span>
          </label>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            className="px-4 py-2 border border-[#c1c7d0] rounded-md text-[#4b6078] text-xs font-semibold hover:border-[#00456d] hover:text-[#00456d] transition-all flex items-center space-x-1.5 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">replay</span>
            <span>Request Re-upload</span>
          </button>

          <button
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedIds.length > 0
                ? "bg-[#00456d] text-white hover:bg-[#003450] shadow-xs active:scale-95"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
            }`}
            disabled={selectedIds.length === 0}
            onClick={handleBatchApprove}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Approve Selected ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {isLoading ? <LoadingBlock label="Loading verification queue…" /> : null}
      {error ? <Notice tone="error">Could not load the review queue.</Notice> : null}

      {/* ── Data Table Container (Stitch Screen 5ad14fea00de44119f65448479cb37a0) ── */}
      <div className="bg-white rounded-xl border border-[#c1c7d0] overflow-hidden shadow-xs">
        {displayItems.length === 0 && !isLoading ? (
          <div className="p-8">
            <EmptyState icon="task_alt" title="The verification queue is clear">
              All respondent and researcher credentials have been processed.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c1c7d0] bg-[#f1f4f7]">
                  <th className="py-3 px-4 w-12 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#4f657c] uppercase tracking-wider">
                    Submission ID
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#4f657c] uppercase tracking-wider">
                    Applicant Name
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#4f657c] uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#4f657c] uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#4f657c] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#4f657c] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c1c7d0] text-xs">
                {displayItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isFlagged = item.ai_notes && item.ai_notes.toLowerCase().includes("flag");
                  const isTier2 = item.respondent?.verification_tier?.includes("2") || item.respondent?.verification_tier?.includes("attribute");

                  return (
                    <tr
                      className={`hover:bg-[#f1f4f7] transition-colors ${
                        isSelected ? "bg-[#00456d]/5" : ""
                      }`}
                      key={item.id}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          checked={isSelected}
                          className="rounded border-[#c1c7d0] text-[#00456d] focus:ring-[#00456d] w-4 h-4 cursor-pointer"
                          onChange={() => handleToggleSelect(item.id)}
                          type="checkbox"
                        />
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-[#181c1e] font-semibold">
                        #VRF-{item.id.slice(0, 4).toUpperCase()}
                      </td>

                      <td className="py-4 px-4 font-semibold text-[#181c1e]">
                        {item.respondent?.full_name ?? "Pending Applicant"}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isTier2
                            ? "bg-[#cfe5ff] text-[#33495f]"
                            : "bg-[#d0e5f9] text-[#071d2c]"
                        }`}>
                          {item.respondent?.verification_tier
                            ? isTier2 ? "Resp. Tier 2" : "Resp. Tier 1"
                            : "Researcher"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-[#00456d] font-semibold">
                          <span className="material-symbols-outlined text-[18px]">
                            {item.doc_type.includes("student") ? "id_card" : "badge"}
                          </span>
                          <span>{item.doc_type.replace("_", " ").toUpperCase()}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isFlagged ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20">
                            Flagged ({item.ai_notes?.slice(0, 16) || "Review"})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F59E0B]/10 text-[#b06000] border border-[#F59E0B]/20">
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          className="px-3.5 py-1.5 bg-[#00456d] text-white rounded-md text-xs font-semibold hover:bg-[#003450] transition-colors shadow-xs inline-flex items-center space-x-1 ml-auto cursor-pointer active:scale-95"
                          onClick={() => setInspectingItem(item)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ── */}
        <div className="border-t border-[#c1c7d0] px-4 py-3 flex items-center justify-between bg-white">
          <span className="text-xs text-[#4b6078] font-medium">
            Showing {displayItems.length} entries
          </span>
          <div className="flex space-x-2">
            <button
              className="p-1 rounded-md border border-[#c1c7d0] text-[#4b6078] hover:bg-[#f1f4f7] hover:text-[#00456d] transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              disabled
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              className="p-1 rounded-md border border-[#c1c7d0] text-[#4b6078] hover:bg-[#f1f4f7] hover:text-[#00456d] transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Inspection Modal ── */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-['Newsreader',serif] text-2xl font-bold text-[#181c1e]">
                  Inspect Verification Submission
                </h3>
                <p className="text-xs text-[#4b6078] mt-1">
                  Applicant: <strong className="text-[#181c1e]">{inspectingItem.respondent?.full_name}</strong> ({inspectingItem.doc_type})
                </p>
              </div>
              <button
                className="text-[#4b6078] hover:text-[#181c1e] p-1 cursor-pointer"
                onClick={() => setInspectingItem(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Document Preview */}
            <div className="rounded-xl border border-[#c1c7d0] bg-[#f8f9ff] overflow-hidden flex items-center justify-center min-h-[200px] max-h-[300px]">
              {inspectingItem.preview_url ? (
                <img
                  alt="Document preview"
                  className="max-h-[300px] w-full object-contain"
                  src={inspectingItem.preview_url}
                />
              ) : (
                <div className="p-8 text-center text-xs text-[#4b6078]">
                  <span className="material-symbols-outlined text-4xl text-[#00456d]/40 block mb-2">
                    badge
                  </span>
                  No image preview file attached. Deterministic attribute match verification.
                </div>
              )}
            </div>

            {inspectingItem.ai_notes && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>System Flag:</strong> {inspectingItem.ai_notes}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#181c1e] uppercase tracking-wider block">
                Rejection Notes (Optional)
              </label>
              <Input
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason if rejecting (e.g., Unclear image, expired badge)…"
                value={rejectReason}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 rounded-lg border border-[#ba1a1a] text-[#ba1a1a] text-xs font-bold hover:bg-red-50 transition-all cursor-pointer"
                onClick={() =>
                  decide.mutate({
                    id: inspectingItem.id,
                    decision: "failed",
                    notes: rejectReason || "Rejected by administrator",
                  })
                }
                type="button"
              >
                Reject
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-[#00456d] hover:bg-[#003450] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                onClick={() =>
                  decide.mutate({
                    id: inspectingItem.id,
                    decision: "passed",
                  })
                }
                type="button"
              >
                Approve Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
