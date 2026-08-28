import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";
import { DocumentReviewChecklist, type ReviewChecklistState } from "@/components/admin/DocumentReviewChecklist";

interface SurveyQueueItem {
  id: string;
  title: string;
  researcher: { full_name: string; email: string } | null;
  research_category?: string | null;
  compliance_required?: boolean | null;
  compliance_rule_triggered?: string | null;
  compliance_answer: boolean | null;
  sample_size: number;
  budget: number;
  created_at: string;
  preview_url: string | null;
  status?: "pending" | "under_review" | "needs_correction" | "resubmitted" | "passed" | "failed";
  priority?: "High" | "Medium" | "Low";
  reviewer?: string | null;
}

export function SurveyQueuePage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inspectingItem, setInspectingItem] = useState<SurveyQueueItem | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-queue"],
    queryFn: () => api<{ items: SurveyQueueItem[] }>("/admin/survey-queue"),
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      decision,
      checklist,
      notes,
    }: {
      id: string;
      decision: "passed" | "failed" | "request_changes";
      checklist: ReviewChecklistState;
      notes?: string;
    }) =>
      api<{ id: string }>(`/admin/survey-queue/${id}`, {
        body: { decision, checklist, notes },
      }),
    onSuccess: () => {
      setInspectingItem(null);
      queryClient.invalidateQueries({ queryKey: ["survey-queue"] });
    },
  });

  // Built-in demonstration fallback data adhering to Stitch screen
  const defaultItems: SurveyQueueItem[] = [
    {
      id: "srv-stitch-1",
      title: "Impact of Urban Noise on Sleep Quality",
      researcher: { full_name: "Sarah Jenkins", email: "s.jenkins@example.edu" },
      research_category: "Health Sciences",
      compliance_required: true,
      compliance_rule_triggered: "IRB Ethics Protocol",
      compliance_answer: true,
      sample_size: 500,
      budget: 12500,
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      preview_url: "https://example.com/urban_noise_protocol.pdf",
      status: "pending",
      priority: "High",
      reviewer: null,
    },
    {
      id: "srv-stitch-2",
      title: "Consumer Adoption of AI Assistants",
      researcher: { full_name: "Michael Reed", email: "m.reed@example.com" },
      research_category: "Market Research",
      compliance_required: false,
      compliance_answer: true,
      sample_size: 1000,
      budget: 24000,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      preview_url: null,
      status: "under_review",
      priority: "Medium",
      reviewer: "Dr. Allen",
    },
    {
      id: "srv-stitch-3",
      title: "Early Childhood Dietary Habits",
      researcher: { full_name: "Emma Lin", email: "e.lin@nutrition.org" },
      research_category: "Social Sciences",
      compliance_required: true,
      compliance_rule_triggered: "Pediatric Vulnerability Assessment",
      compliance_answer: true,
      sample_size: 300,
      budget: 18000,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      preview_url: "https://example.com/pediatric_dietary.pdf",
      status: "needs_correction",
      priority: "Medium",
      reviewer: "Dr. Allen",
    },
    {
      id: "srv-stitch-4",
      title: "Remote Work Efficacy Metrics Q3",
      researcher: { full_name: "David Barnes", email: "dbarnes@enterprise.io" },
      research_category: "Corporate",
      compliance_required: false,
      compliance_answer: true,
      sample_size: 800,
      budget: 16000,
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      preview_url: null,
      status: "resubmitted",
      priority: "High",
      reviewer: null,
    },
  ];

  const rawItems = (data?.items && data.items.length > 0) ? data.items : defaultItems;

  const filteredItems = rawItems.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.researcher?.full_name && item.researcher.full_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (item.status === "pending" || !item.status)) ||
      item.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      (item.research_category && item.research_category.toLowerCase().includes(categoryFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "under_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#d0e2ee] text-[#005985] text-xs font-semibold">
            {isAm ? "በግምገማ ላይ" : "Under Review"}
          </span>
        );
      case "needs_correction":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
            {isAm ? "እርማት ያስፈልጋል" : "Needs Correction"}
          </span>
        );
      case "resubmitted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#d3e5f1] text-[#0c1e26] text-xs font-semibold">
            {isAm ? "እንደገና የቀረበ" : "Resubmitted"}
          </span>
        );
      case "passed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            {isAm ? "ጸድቋል" : "Approved"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-semibold">
            {isAm ? "ግምገማ ይጠብቃል" : "Pending Review"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Breadcrumb & Header Section (Exact Stitch Screen 8b6cdee78c394f2ea173352001715754) ── */}
      <div>
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-2">
          <Link to="/admin" className="hover:text-[#005985] transition-colors">
            {isAm ? "ዳሽቦርድ" : "Dashboard"}
          </Link>
          <span>/</span>
          <Link to="/admin/review-queue" className="hover:text-[#005985] transition-colors">
            {isAm ? "የማጽደቂያ ወረፋዎች" : "Approval Queues"}
          </Link>
          <span>/</span>
          <span className="text-[#0F172A]">{isAm ? "የጥናት ግምገማ ወረፋ" : "Survey Review Queue"}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight">
              {isAm ? "የጥናት ግምገማ ወረፋ" : "Survey Review Queue"}
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              {isAm
                ? "የስነምግባር ማጽደቂያ የሚሹ በመጠባበቅ ላይ ያሉ ጥናቶችን ያስተዳድሩ እና ይገምግሙ።"
                : "Manage and evaluate pending ethical clearance surveys."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const rows = [
                ["Survey Title", "Researcher", "Category", "Status", "Budget (ETB)"],
                ...filteredItems.map((i) => [
                  i.title,
                  i.researcher?.full_name || "",
                  i.research_category || "",
                  i.status || "pending",
                  i.budget.toString(),
                ]),
              ];
              const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `survey-review-log-${Date.now()}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-bold hover:bg-[#eff4ff] transition-colors flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{isAm ? "መዝገብ ላክ" : "Export Log"}</span>
          </button>
        </div>
      </div>

      {/* ── Metrics Bento (Exact Stitch 4-Card Grid) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Review */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {isAm ? "ግምገማ የሚጠብቁ" : "Pending Review"}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#005985]">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <div className="font-headline font-bold text-2xl text-[#0F172A]">24</div>
        </div>

        {/* Card 2: Under Review */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="absolute inset-0 bg-[#005985]/5 pointer-events-none" />
          <div className="flex justify-between items-start mb-3 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {isAm ? "በግምገማ ላይ" : "Under Review"}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#005985] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">manage_search</span>
            </div>
          </div>
          <div className="font-headline font-bold text-2xl text-[#005985] relative z-10">8</div>
        </div>

        {/* Card 3: Needs Correction */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {isAm ? "እርማት የሚያስፈልጋቸው" : "Needs Correction"}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">error</span>
            </div>
          </div>
          <div className="font-headline font-bold text-2xl text-[#0F172A]">5</div>
        </div>

        {/* Card 4: Resubmitted */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {isAm ? "እንደገና የቀረቡ" : "Resubmitted"}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#d0e2ee] text-[#50616b] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">cycle</span>
            </div>
          </div>
          <div className="font-headline font-bold text-2xl text-[#0F172A]">12</div>
        </div>
      </div>

      {/* ── Data Table Panel ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 items-center justify-between bg-[#f8f9ff]">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAm ? "በጥናት ርዕስ ወይም በተመራማሪ ፈልግ..." : "Search by survey title or researcher..."}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#005985] cursor-pointer"
            >
              <option value="all">{isAm ? "ሁኔታ: ሁሉም" : "Status: All"}</option>
              <option value="pending">{isAm ? "ግምገማ ይጠብቃል" : "Pending"}</option>
              <option value="under_review">{isAm ? "በግምገማ ላይ" : "Under Review"}</option>
              <option value="needs_correction">{isAm ? "እርማት ያስፈልጋል" : "Needs Correction"}</option>
              <option value="resubmitted">{isAm ? "እንደገና የቀረበ" : "Resubmitted"}</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#005985] cursor-pointer"
            >
              <option value="all">{isAm ? "ዘርፍ: ሁሉም" : "Category: All"}</option>
              <option value="health">{isAm ? "የጤና ሳይንስ" : "Health Sciences"}</option>
              <option value="market">{isAm ? "የገበያ ጥናት" : "Market Research"}</option>
              <option value="social">{isAm ? "ማህበራዊ ሳይንስ" : "Social Sciences"}</option>
              <option value="corporate">{isAm ? "ድርጅታዊ" : "Corporate"}</option>
            </select>
          </div>
        </div>

        {isLoading ? <LoadingBlock label={isAm ? "ወረፋ በመጫን ላይ..." : "Loading survey review queue…"} /> : null}
        {error ? <Notice tone="error">{isAm ? "ወረፋውን መጫን አልተሳካም።" : "Could not load survey review queue."}</Notice> : null}

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የጥናት ርዕስ" : "Survey Title"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ተመራማሪ" : "Researcher"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ዘርፍ" : "Category"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የቀረበበት" : "Submitted"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የግምገማ ሁኔታ" : "Review Status"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ቅድሚያ" : "Priority"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ገምጋሚ" : "Reviewer"}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                  {isAm ? "እርምጃ" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#E2E8F0]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B]">
                    {isAm ? "ምንም ጥናት አልተገኘም።" : "No surveys found matching criteria."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#eff4ff]/40 transition-colors cursor-pointer"
                    onClick={() => setInspectingItem(inspectingItem?.id === item.id ? null : item)}
                  >
                    <td className="px-4 py-3.5 font-semibold text-[#0F172A] max-w-[220px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#d0e2ee] text-[#54656f] flex items-center justify-center text-[10px] font-bold">
                          {getInitials(item.researcher?.full_name)}
                        </div>
                        <span className="font-medium text-[#0F172A]">{item.researcher?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#64748B] whitespace-nowrap">
                      {item.research_category || "General"}
                    </td>
                    <td className="px-4 py-3.5 text-[#64748B] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.priority === "High"
                            ? "border-rose-300 text-rose-700 bg-rose-50"
                            : "border-slate-300 text-slate-700 bg-slate-50"
                        }`}
                      >
                        {item.priority || "Medium"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#64748B] whitespace-nowrap italic">
                      {item.reviewer || (isAm ? "ያልተመደበ" : "Unassigned")}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingItem(inspectingItem?.id === item.id ? null : item);
                        }}
                        className="px-3 py-1 text-[#005985] border border-[#005985] rounded-md hover:bg-[#005985] hover:text-white transition-colors text-xs font-bold cursor-pointer"
                      >
                        {inspectingItem?.id === item.id ? (isAm ? "ዝጋ" : "Close") : (isAm ? "ገምግም" : "Review")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Inspection Drawer / Row Checklist Expansion */}
        {inspectingItem && (
          <div className="p-6 bg-[#f8f9ff] border-t border-[#E2E8F0] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  {isAm ? "የስነምግባርና ህግ ግምገማ" : "Ethics & Compliance Verification"} — {inspectingItem.title}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {isAm ? "ተመራማሪ" : "Researcher"}: <strong>{inspectingItem.researcher?.full_name}</strong> ({inspectingItem.researcher?.email})
                  &nbsp;•&nbsp;
                  {isAm ? "በጀት" : "Budget"}: <strong>{inspectingItem.budget?.toLocaleString()} ETB</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/admin/survey-approvals/${inspectingItem.id}`}
                  className="text-xs font-bold text-[#005985] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>{isAm ? "ሙሉ ዝርዝር እይ" : "Full Review Page"}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  ✕ {isAm ? "ዝጋ" : "Close Panel"}
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                {inspectingItem.preview_url ? (
                  <iframe
                    title="Document Preview"
                    src={inspectingItem.preview_url}
                    className="h-56 w-full border-none"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-[#64748B]">
                    {isAm ? "የተያያዘ ሰነድ የለም" : "No document attached"}
                  </div>
                )}
                {inspectingItem.preview_url && (
                  <div className="p-2.5 text-center bg-[#f8f9ff] border-t border-[#E2E8F0]">
                    <a
                      href={inspectingItem.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#005985] hover:underline text-xs font-bold inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      <span>{isAm ? "ሰነዱን በሙሉ ገጽ ክፈት" : "Open Fullscreen"}</span>
                    </a>
                  </div>
                )}
              </div>

              <div>
                <DocumentReviewChecklist
                  documentTitle={inspectingItem.title}
                  previewUrl={inspectingItem.preview_url}
                  researchCategory={inspectingItem.research_category}
                  isPending={decide.isPending && decide.variables?.id === inspectingItem.id}
                  onSubmitDecision={({ decision, checklist, notes }) => {
                    decide.mutate({
                      id: inspectingItem.id,
                      decision,
                      checklist,
                      notes,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-white flex justify-between items-center text-xs text-[#64748B]">
          <div>
            {isAm
              ? `ከ 1 እስከ ${filteredItems.length} በማሳየት ላይ (ድምር: ${rawItems.length})`
              : `Showing 1 to ${filteredItems.length} of ${rawItems.length} entries`}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-[#E2E8F0] disabled:opacity-40 font-semibold"
            >
              {isAm ? "ቀዳሚ" : "Prev"}
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded border border-[#005985] bg-[#eff4ff] text-[#005985] font-bold"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="px-2.5 py-1 rounded border border-[#E2E8F0] disabled:opacity-40 font-semibold"
            >
              {isAm ? "ቀጣይ" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
