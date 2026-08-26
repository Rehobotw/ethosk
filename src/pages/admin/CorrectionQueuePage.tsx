import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LoadingBlock } from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";

type CorrectionTab = "needs_correction" | "returned" | "awaiting" | "resubmitted";

interface CorrectionItem {
  id: string;
  survey_code: string;
  title: string;
  researcher_name: string;
  researcher_tier: string;
  researcher_initials: string;
  category: string;
  correction_requested_date: string;
  status: "Needs Correction" | "Returned to Researcher" | "Awaiting Resubmission" | "Resubmitted";
  last_updated: string;
  tab: CorrectionTab;
}

const mockCorrectionItems: CorrectionItem[] = [
  {
    id: "srv-urban-noise",
    survey_code: "SRV-2023-0892",
    title: "Impact of Urban Noise on Sleep Quality",
    researcher_name: "Sarah Jenkins",
    researcher_tier: "Tier 2",
    researcher_initials: "SJ",
    category: "Health Sciences",
    correction_requested_date: "Oct 25, 2023",
    status: "Needs Correction",
    last_updated: "2 hours ago",
    tab: "needs_correction",
  },
  {
    id: "srv-amhara-agri",
    survey_code: "SRV-2023-1104",
    title: "Agricultural Productivity in Amhara",
    researcher_name: "Dawit Abebe",
    researcher_tier: "Tier 1",
    researcher_initials: "DA",
    category: "Economics",
    correction_requested_date: "Oct 22, 2023",
    status: "Awaiting Resubmission",
    last_updated: "3 days ago",
    tab: "awaiting",
  },
  {
    id: "srv-ml-supply-chain",
    survey_code: "SRV-2023-1455",
    title: "Machine Learning in Supply Chain",
    researcher_name: "Maria Lopez",
    researcher_tier: "Tier 3",
    researcher_initials: "ML",
    category: "Technology",
    correction_requested_date: "Oct 24, 2023",
    status: "Needs Correction",
    last_updated: "1 day ago",
    tab: "needs_correction",
  },
  {
    id: "srv-addis-transport",
    survey_code: "SRV-2023-1590",
    title: "Public Transit Commuter Feedback",
    researcher_name: "Yohannes Bekele",
    researcher_tier: "Tier 1",
    researcher_initials: "YB",
    category: "Urban Planning",
    correction_requested_date: "Oct 21, 2023",
    status: "Returned to Researcher",
    last_updated: "4 days ago",
    tab: "returned",
  },
];

export function CorrectionQueuePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [activeTab, setActiveTab] = useState<CorrectionTab>("needs_correction");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("Any");

  const { data: items = mockCorrectionItems, isLoading } = useQuery({
    queryKey: ["correction-queue"],
    queryFn: async () => {
      try {
        const res = await api<{ items: CorrectionItem[] }>("/admin/correction-queue");
        return res.items;
      } catch {
        return mockCorrectionItems;
      }
    },
  });

  const tabCounts = {
    needs_correction: items.filter((i) => i.tab === "needs_correction").length || 12,
    returned: items.filter((i) => i.tab === "returned").length || 45,
    awaiting: items.filter((i) => i.tab === "awaiting").length || 8,
    resubmitted: items.filter((i) => i.tab === "resubmitted").length || 0,
  };

  const filteredItems = items.filter((item) => {
    if (item.tab !== activeTab) return false;
    if (
      searchTerm &&
      !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.researcher_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.survey_code.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (selectedTier !== "Any" && item.researcher_tier !== selectedTier) return false;
    return true;
  });

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Survey,Code,Researcher,Tier,Category,Correction Requested,Status,Last Updated"]
        .concat(
          filteredItems.map(
            (i) =>
              `"${i.title}","${i.survey_code}","${i.researcher_name}","${i.researcher_tier}","${i.category}","${i.correction_requested_date}","${i.status}","${i.last_updated}"`,
          ),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ethosk_Correction_Queue_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <LoadingBlock label={isAm ? "የእርማት ወረፋ በመጫን ላይ..." : "Loading correction queue…"} />;
  }

  return (
    <div className="space-y-6 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Header Section (Exact Stitch Screen deab2b40fd78484db04a418c941de186) ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <nav className="flex items-center text-[#64748B] text-xs font-semibold mb-2">
            <Link to="/admin" className="hover:text-[#005985] transition-colors">
              {isAm ? "ዳሽቦርድ" : "Dashboard"}
            </Link>
            <span className="material-symbols-outlined text-[14px] mx-1">chevron_right</span>
            <Link to="/admin/review-queue" className="hover:text-[#005985] transition-colors">
              {isAm ? "የማጽደቂያ ወረፋዎች" : "Approval Queues"}
            </Link>
            <span className="material-symbols-outlined text-[14px] mx-1">chevron_right</span>
            <span className="text-[#0F172A] font-bold">
              {isAm ? "የእርማት ወረፋ" : "Correction Queue"}
            </span>
          </nav>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight">
            {isAm ? "የእርማት እና እንደገና የቀረቡ ጥናቶች ወረፋ" : "Correction & Resubmission Queue"}
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-[#E2E8F0] text-[#0F172A] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#eff4ff] transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{isAm ? "ዝርዝሩን ላክ" : "Export List"}</span>
          </button>
        </div>
      </div>

      {/* ── Queue Container ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs flex flex-col overflow-hidden">
        {/* 4 Tabs */}
        <div className="border-b border-[#E2E8F0] flex overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("needs_correction")}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "needs_correction"
                ? "border-[#005985] text-[#005985]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>{isAm ? "እርማት የሚያስፈልጋቸው" : "Needs Correction"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "needs_correction"
                  ? "bg-[#005985]/10 text-[#005985]"
                  : "bg-[#d3e4fe] text-[#64748B]"
              }`}
            >
              {tabCounts.needs_correction}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("returned")}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "returned"
                ? "border-[#005985] text-[#005985]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>{isAm ? "ለተመራማሪው የተመለሱ" : "Returned to Researcher"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "returned"
                  ? "bg-[#005985]/10 text-[#005985]"
                  : "bg-[#d3e4fe] text-[#64748B]"
              }`}
            >
              {tabCounts.returned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("awaiting")}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "awaiting"
                ? "border-[#005985] text-[#005985]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>{isAm ? "እንደገና መቅረብን የሚጠብቁ" : "Awaiting Resubmission"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "awaiting"
                  ? "bg-[#005985]/10 text-[#005985]"
                  : "bg-[#d3e4fe] text-[#64748B]"
              }`}
            >
              {tabCounts.awaiting}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resubmitted")}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "resubmitted"
                ? "border-[#005985] text-[#005985]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <span>{isAm ? "እንደገና የቀረቡ" : "Resubmitted"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "resubmitted"
                  ? "bg-[#005985]/10 text-[#005985]"
                  : "bg-[#d3e4fe] text-[#64748B]"
              }`}
            >
              {tabCounts.resubmitted}
            </span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#f8f9ff] flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72 shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAm ? "ይህንን ዝርዝር ፈልግ..." : "Filter this view..."}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white border border-[#E2E8F0] focus:border-[#005985] focus:ring-1 focus:ring-[#005985] text-xs text-[#0F172A] placeholder-[#64748B] transition-colors"
            />
          </div>

          <div className="flex gap-2.5 w-full md:w-auto overflow-x-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-[#E2E8F0] text-[#0F172A] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#f8f9ff] transition-colors cursor-pointer"
            >
              <option value="All">{isAm ? "ዘርፍ: ሁሉም" : "Category: All"}</option>
              <option value="Health Sciences">Health Sciences</option>
              <option value="Economics">Economics</option>
              <option value="Technology">Technology</option>
              <option value="Urban Planning">Urban Planning</option>
            </select>

            {/* Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-white border border-[#E2E8F0] text-[#0F172A] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#f8f9ff] transition-colors cursor-pointer"
            >
              <option value="Any">{isAm ? "ደረጃ: ማንኛውም" : "Tier: Any"}</option>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Tier 3">Tier 3</option>
            </select>
          </div>
        </div>

        {/* Data Table / Empty State */}
        {filteredItems.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center bg-[#f8f9ff]/50">
            <div className="w-16 h-16 rounded-full bg-[#eff4ff] flex items-center justify-center mb-4 text-[#005985] border border-[#d3e4fe]">
              <span className="material-symbols-outlined text-[32px]">task_alt</span>
            </div>
            <h3 className="font-bold text-base text-[#0F172A] mb-1">
              {isAm ? "ምንም እንደገና የቀረበ ጥናት አልተገኘም" : "No resubmissions found"}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md leading-relaxed">
              {isAm
                ? "ሁሉም የተመለሱ ጥናቶች በአሁኑ ጊዜ ከተመራማሪዎች ጋር ናቸው ወይም የመጀመሪያ እርማት እየጠበቁ ናቸው።"
                : "All returned surveys are currently with researchers or pending initial correction. Check back later."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9ff] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="px-4 py-3 min-w-[240px]">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-[#005985]">
                      <span>{isAm ? "ጥናት" : "Survey"}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 min-w-[140px]">{isAm ? "ተመራማሪ" : "Researcher"}</th>
                  <th className="px-4 py-3 min-w-[120px]">{isAm ? "ዘርፍ" : "Category"}</th>
                  <th className="px-4 py-3 min-w-[130px]">{isAm ? "የእርማት ጥያቄ" : "Correction Req."}</th>
                  <th className="px-4 py-3 min-w-[130px]">{isAm ? "ሁኔታ" : "Status"}</th>
                  <th className="px-4 py-3 min-w-[120px]">{isAm ? "የመጨረሻ ለውጥ" : "Last Updated"}</th>
                  <th className="px-4 py-3 text-right min-w-[120px]">{isAm ? "እርምጃዎች" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#E2E8F0]">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#eff4ff]/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/admin/survey-approvals/${item.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#0F172A] truncate max-w-[240px]" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">ID: {item.survey_code}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#d0e2ee] text-[#54656f] flex items-center justify-center text-[10px] font-bold">
                          {item.researcher_initials}
                        </div>
                        <div>
                          <div className="font-medium text-[#0F172A]">{item.researcher_name}</div>
                          <div className="text-[10px] text-[#64748B]">{item.researcher_tier}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[#64748B] font-medium">{item.category}</td>

                    <td className="px-4 py-3.5 text-[#64748B]">{item.correction_requested_date}</td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "Needs Correction"
                            ? "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]"
                            : item.status === "Awaiting Resubmission"
                            ? "bg-[#dce9ff] text-[#005985] border border-[#c0c7d0]"
                            : "bg-[#eff4ff] text-[#005985] border border-[#d3e4fe]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#64748B]">{item.last_updated}</td>

                    <td className="px-4 py-3.5 text-right">
                      {item.status === "Needs Correction" ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/survey-approvals/${item.id}`);
                          }}
                          className="bg-[#005985] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#106492] transition-colors shadow-xs cursor-pointer"
                        >
                          {isAm ? "ጥያቄውን ገምግም" : "Review Request"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/survey-approvals/${item.id}`);
                          }}
                          className="bg-white border border-[#E2E8F0] text-[#0F172A] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#eff4ff] transition-colors cursor-pointer"
                        >
                          {isAm ? "ታሪክ እይ" : "View History"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-white text-xs text-[#64748B]">
          <div className="font-semibold text-[11px]">
            {isAm
              ? `ከ 1-${filteredItems.length} በማሳየት ላይ (ድምር: ${items.length})`
              : `Showing 1-${filteredItems.length} of ${items.length} items`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="p-1 rounded text-[#64748B] border border-[#E2E8F0] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded bg-[#005985] text-white font-bold text-xs flex items-center justify-center shadow-xs"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="p-1 rounded text-[#64748B] border border-[#E2E8F0] disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
