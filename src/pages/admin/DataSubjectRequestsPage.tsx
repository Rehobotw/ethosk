import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";

interface DataSubjectRequestItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: "respondent" | "researcher" | "admin";
  event_type: string;
  statute: string;
  reason: string;
  status: "pending" | "completed" | "rejected";
  action_taken?: "complete_erasure" | "export_data" | "reject" | null;
  admin_notes?: string | null;
  actioned_at?: string | null;
  created_at: string;
  due_by: string;
  days_remaining: number;
  is_urgent: boolean;
}

interface DataSubjectRequestsResponse {
  requests: DataSubjectRequestItem[];
  metrics: {
    total_requests: number;
    pending_requests: number;
    completed_requests: number;
    urgent_count: number;
    response_sla_days: number;
  };
}

export function DataSubjectRequestsPage() {
  const { isAm } = useLanguage();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<DataSubjectRequestItem | null>(null);
  const [actionModalType, setActionModalType] = useState<"complete_erasure" | "export_data" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<DataSubjectRequestsResponse>({
    queryKey: ["admin-data-requests"],
    queryFn: () => api<DataSubjectRequestsResponse>("/admin/data-requests"),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      notes,
    }: {
      id: string;
      action: "complete_erasure" | "export_data" | "reject";
      notes?: string;
    }) => {
      return api(`/admin/data-requests/${id}`, {
        method: "POST",
        body: { action, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-data-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      closeActionModal();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to process data subject request");
    },
  });

  const openActionModal = (
    item: DataSubjectRequestItem,
    type: "complete_erasure" | "export_data" | "reject",
  ) => {
    setSelectedItem(item);
    setActionModalType(type);
    setActionNotes("");
    setErrorMessage(null);
  };

  const closeActionModal = () => {
    setSelectedItem(null);
    setActionModalType(null);
    setActionNotes("");
    setErrorMessage(null);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !actionModalType) return;
    if (actionModalType === "reject" && !actionNotes.trim()) {
      setErrorMessage(
        isAm
          ? "እባክዎ ውድቅ የተደረገበትን የህግ ምክንያት ያስገቡ።"
          : "Please provide a statutory reason or justification for rejecting this request.",
      );
      return;
    }

    actionMutation.mutate({
      id: selectedItem.id,
      action: actionModalType,
      notes: actionNotes.trim() || undefined,
    });
  };

  if (isLoading) return <LoadingBlock label="Loading Data Subject Requests…" />;
  if (error) {
    return (
      <Notice tone="error">
        {isAm ? "የመረጃ ጥያቄዎችን መጫን አልተቻለም።" : "Failed to load data subject compliance requests."}
      </Notice>
    );
  }

  const allRequests = data?.requests ?? [];
  const metrics = data?.metrics ?? {
    total_requests: 0,
    pending_requests: 0,
    completed_requests: 0,
    urgent_count: 0,
    response_sla_days: 30,
  };

  const filteredRequests = allRequests.filter((item) => {
    if (activeTab === "pending" && item.status !== "pending") return false;
    if (activeTab === "completed" && item.status !== "completed") return false;
    if (activeTab === "rejected" && item.status !== "rejected") return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.user_name.toLowerCase().includes(term);
      const matchEmail = item.user_email.toLowerCase().includes(term);
      const matchReason = item.reason.toLowerCase().includes(term);
      const matchId = item.id.toLowerCase().includes(term);
      return matchName || matchEmail || matchReason || matchId;
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
              {isAm ? "የተጠቃሚ መረጃ እና ስረዛ ጥያቄዎች" : "Data Subject Requests"}
            </h1>
            <span className="bg-[#1d5d8a]/10 text-[#00456d] font-mono text-xs font-bold px-2.5 py-1 rounded-full">
              Proclamation 1321/2024 §17.7
            </span>
          </div>
          <p className="text-xs text-[#5A6E7F] mt-1">
            {isAm
              ? "በኢትዮጵያ የግል መረጃ ጥበቃ አዋጅ መሠረት የተጠቃሚዎችን የመረጃ ስረዛና ተደራሽነት ጥያቄዎች ያስተዳድሩ።"
              : "Review and action data erasure, access, and subject rights requests within the statutory 30-day compliance window."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-headline-md text-sm font-semibold transition-all whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-50 border border-primary/30 text-primary hover:bg-primary/5 hover:border-primary cursor-pointer"
            onClick={() => refetch()}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">refresh</span>
            {isAm ? "አድስ" : "Refresh Queue"}
          </button>
        </div>
      </div>

      {/* ── Statutory Compliance KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Pending Actions */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            {isAm ? "በመጠባበቅ ላይ ያሉ" : "Pending Actions"}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#0D253A]">{metrics.pending_requests}</span>
            <span className="text-xs text-[#5A6E7F]">{isAm ? "ጥያቄዎች" : "requests"}</span>
          </div>
        </div>

        {/* Card 2: Completed Erasures */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            {isAm ? "የተጠናቀቁ ስረዛዎች" : "Completed Requests"}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-emerald-700">{metrics.completed_requests}</span>
            <span className="text-xs text-[#5A6E7F]">{isAm ? "የተፈጸሙ" : "actioned"}</span>
          </div>
        </div>

        {/* Card 3: Statutory SLA Window */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
            {isAm ? "የህግ የጊዜ ገደብ" : "Statutory SLA"}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#00456d]">{metrics.response_sla_days}</span>
            <span className="text-xs text-[#5A6E7F]">{isAm ? "ቀናት መስኮት" : "days SLA window"}</span>
          </div>
        </div>

        {/* Card 4: Urgent Requests Banner */}
        <div
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between ${
            metrics.urgent_count > 0
              ? "bg-rose-50 border-rose-300 text-rose-900"
              : "bg-emerald-50 border-emerald-300 text-emerald-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isAm ? "አስቸኳይ ጥያቄዎች" : "SLA Deadlines"}
            </span>
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              {metrics.urgent_count > 0 ? "warning" : "verified"}
            </span>
          </div>
          <p className="text-xs font-medium mt-2">
            {metrics.urgent_count > 0
              ? isAm
                ? `${metrics.urgent_count} ጥያቄዎች ከ7 ቀናት በታች ቀርቷቸዋል።`
                : `${metrics.urgent_count} request(s) due in under 7 days.`
              : isAm
              ? "ሁሉም ጥያቄዎች በህጋዊ የጊዜ ገደብ ውስጥ ናቸው።"
              : "All requests within compliant response window."}
          </p>
        </div>
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="bg-white rounded-xl border border-[#E1E8EE] p-4 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "pending"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setActiveTab("pending")}
            type="button"
          >
            {isAm ? "በመጠባበቅ ላይ" : "Pending Action"} ({metrics.pending_requests})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setActiveTab("all")}
            type="button"
          >
            {isAm ? "ሁሉም" : "All Requests"} ({metrics.total_requests})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "completed"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setActiveTab("completed")}
            type="button"
          >
            {isAm ? "የተጠናቀቁ" : "Completed"} ({metrics.completed_requests})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "rejected"
                ? "bg-[#00456d] text-white"
                : "bg-[#f0f4f8] text-[#5A6E7F] hover:bg-[#e2e8f0]"
            }`}
            onClick={() => setActiveTab("rejected")}
            type="button"
          >
            {isAm ? "ውድቅ የተደረጉ" : "Rejected"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <span
            aria-hidden="true"
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5A6E7F]"
          >
            search
          </span>
          <input
            className="w-full bg-[#f8f9fa] border border-[#E1E8EE] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0D253A] placeholder-[#5A6E7F] focus:outline-none focus:border-[#00456d]"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAm ? "በስም ወይም በኢሜይል ፈልግ…" : "Search by applicant name or email…"}
            type="text"
            value={searchTerm}
          />
        </div>
      </div>

      {/* ── Requests Table ── */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          description={
            searchTerm
              ? isAm
                ? "የተሰጠውን ፍለጋ የሚያሟላ የመረጃ ጥያቄ አልተገኘም።"
                : "No data subject requests matched your search criteria."
              : isAm
              ? "ምንም በመጠባበቅ ላይ ያለ የመረጃ ጥያቄ የለም።"
              : "No data subject requests in this status."
          }
          icon="verified_user"
          title={isAm ? "ምንም ጥያቄዎች የሉም" : "No Requests Found"}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E1E8EE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#E1E8EE]">
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    {isAm ? "አመልካች / ተጠቃሚ" : "Applicant / User"}
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    {isAm ? "የጥያቄ ዓይነት" : "Request Type"}
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    {isAm ? "ቀን & የጊዜ ገደብ" : "Date & SLA Deadline"}
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    {isAm ? "ምክንያት / ማብራሪያ" : "Claimed Reason / Details"}
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider">
                    {isAm ? "ሁኔታ" : "Status"}
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#5A6E7F] uppercase tracking-wider text-right">
                    {isAm ? "እርምጃዎች" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8EE] text-xs">
                {filteredRequests.map((item) => {
                  const isPending = item.status === "pending";
                  const isCompleted = item.status === "completed";
                  const isRejected = item.status === "rejected";

                  return (
                    <tr className="hover:bg-[#f8f9fa] transition-colors" key={item.id}>
                      {/* User & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0D253A]">{item.user_name}</div>
                        <div className="text-[#5A6E7F] text-[11px]">{item.user_email}</div>
                        <span className="inline-block mt-1 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.role}
                        </span>
                      </td>

                      {/* Request Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#00456d]">
                          {item.event_type === "data_erasure_request"
                            ? isAm
                              ? "የመረጃና አካውንት ስረዛ"
                              : "Account & Data Erasure"
                            : item.event_type}
                        </div>
                        <div className="text-[11px] text-[#5A6E7F]">{item.statute}</div>
                      </td>

                      {/* Date & SLA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[#0D253A] font-medium">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        {isPending && (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                                item.is_urgent
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-blue-50 text-blue-800"
                              }`}
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-[12px]">
                                {item.is_urgent ? "alarm" : "schedule"}
                              </span>
                              <span>{item.days_remaining} {isAm ? "ቀናት ቀሩት" : "days left"}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Reason / Claimed Detail */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[#0D253A] font-medium line-clamp-2">{item.reason}</p>
                        {item.admin_notes && (
                          <p className="text-[11px] text-[#5A6E7F] mt-1 italic">
                            Admin note: {item.admin_notes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            <span aria-hidden="true" className="material-symbols-outlined text-xs">pending</span>
                            <span>Pending Review</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            <span aria-hidden="true" className="material-symbols-outlined text-xs">check_circle</span>
                            <span>Completed ({item.action_taken || "Actioned"})</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            <span aria-hidden="true" className="material-symbols-outlined text-xs">cancel</span>
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              onClick={() => openActionModal(item, "complete_erasure")}
                              type="button"
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-xs">delete_forever</span>
                              <span>Complete Erasure</span>
                            </button>
                            <button
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              onClick={() => openActionModal(item, "export_data")}
                              type="button"
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-xs">download</span>
                              <span>Export</span>
                            </button>
                            <button
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              onClick={() => openActionModal(item, "reject")}
                              type="button"
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-xs">close</span>
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#5A6E7F] font-mono">
                            {item.actioned_at
                              ? new Date(item.actioned_at).toLocaleDateString()
                              : "Actioned"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Action Modal Dialog ── */}
      {selectedItem && actionModalType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E1E8EE] space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-lg font-bold text-[#0D253A]">
                  {actionModalType === "complete_erasure" && "Execute Data Erasure"}
                  {actionModalType === "export_data" && "Export Data Subject Archive"}
                  {actionModalType === "reject" && "Reject Data Subject Request"}
                </h3>
                <button
                  className="text-[#5A6E7F] hover:text-[#0D253A] cursor-pointer"
                  onClick={closeActionModal}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <p className="text-xs text-[#5A6E7F] mt-1">
                {actionModalType === "complete_erasure" &&
                  "This will permanently anonymize user records and record compliance under Proclamation 1321/2024."}
                {actionModalType === "export_data" &&
                  "Prepare personal data portable archive for the applicant."}
                {actionModalType === "reject" &&
                  "Rejecting requires documenting a valid statutory exemption or legal rationale."}
              </p>
            </div>

            {/* Applicant Summary Card */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#E1E8EE] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Applicant:</span>
                <span className="font-bold text-[#0D253A]">{selectedItem.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Email / User ID:</span>
                <span className="font-mono text-[#0D253A]">{selectedItem.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Statute:</span>
                <span className="font-bold text-[#00456d]">{selectedItem.statute}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">30-Day Due Date:</span>
                <span className="font-bold text-[#0D253A]">
                  {new Date(selectedItem.due_by).toLocaleDateString()} ({selectedItem.days_remaining} days remaining)
                </span>
              </div>
              <div className="pt-2 border-t border-[#E1E8EE]">
                <span className="text-[#5A6E7F]">Stated Reason:</span>
                <p className="font-medium text-[#0D253A] mt-0.5">{selectedItem.reason}</p>
              </div>
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                {errorMessage}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleActionSubmit}>
              <div>
                <label className="block text-xs font-bold text-[#0D253A] mb-1">
                  {actionModalType === "reject" ? "Statutory Reason for Rejection *" : "Compliance Audit Notes (Optional)"}
                </label>
                <textarea
                  className="w-full bg-[#f8f9fa] border border-[#E1E8EE] rounded-lg p-2.5 text-xs text-[#0D253A] focus:outline-none focus:border-[#00456d]"
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionModalType === "reject"
                      ? "e.g. Identity could not be authenticated, or legal retention obligation applies under Commercial Code..."
                      : "e.g. All profile attributes and identifying documents removed from active storage..."
                  }
                  required={actionModalType === "reject"}
                  rows={3}
                  value={actionNotes}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5A6E7F] hover:bg-[#f0f4f8] transition-colors cursor-pointer"
                  onClick={closeActionModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                    actionModalType === "complete_erasure"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionModalType === "export_data"
                      ? "bg-[#00456d] hover:bg-[#003452]"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                  disabled={actionMutation.isPending}
                  type="submit"
                >
                  {actionMutation.isPending
                    ? "Processing…"
                    : actionModalType === "complete_erasure"
                    ? "Execute Erasure"
                    : actionModalType === "export_data"
                    ? "Confirm Export"
                    : "Reject Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
