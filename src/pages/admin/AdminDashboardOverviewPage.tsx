import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";

interface AdminOverviewData {
  total_users: number;
  total_respondents: number;
  total_researchers: number;
  verified_respondents: number;
  tier1_count: number;
  tier2_count: number;
  active_surveys: number;
  pending_surveys: number;
  pending_documents: number;
  pending_researchers: number;
  total_volume_etb: number;
  subscription_revenue_etb: number;
  commission_revenue_etb: number;
  recent_queue_items: Array<{
    id: string;
    user_id: string;
    doc_type: string;
    status: string;
    created_at: string;
    users: {
      full_name: string;
      email: string;
      verification_tier: string;
    } | null;
  }>;
}

export function AdminDashboardOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api<AdminOverviewData>("/admin/overview"),
  });

  if (isLoading) return <LoadingBlock label="Loading Admin Operations Portal…" />;
  if (error) return <Notice tone="error">Failed to load platform operations overview.</Notice>;
  if (!data) return null;

  return (
    <div className="space-y-8 font-['Inter',sans-serif] text-[#181c1e]">
      {/* ── Page Title Area (Stitch Screen 4406e41c481449329fcd8e4e79ffddcc) ── */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-['Newsreader',serif] text-4xl md:text-5xl font-bold text-[#181c1e] mb-1 tracking-tight">
            Platform Overview
          </h1>
          <p className="text-base text-[#4b6078]">
            A unified view of Ethosk ecosystem activity.
          </p>
        </div>
      </div>

      {/* ── KPI Grid (Bento / Asymmetric style - 12 Columns) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* KPI 1: Total Users (Large Card - 4 cols) */}
        <div className="md:col-span-4 bg-white border border-[#c1c7d0] rounded-xl p-6 flex flex-col justify-between group hover:border-[#1d5d8a] transition-colors relative overflow-hidden shadow-xs">
          {/* Decorative gradient corner */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#cbe2fe]/30 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-xs font-semibold text-[#4b6078] uppercase mb-2 tracking-wider">
              Total Users
            </p>
            <h3 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#181c1e]">
              {data.total_users.toLocaleString()}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-[#c1c7d0]/50 flex gap-6">
            <div>
              <p className="text-[11px] text-[#4b6078]">Respondents</p>
              <p className="text-sm font-medium text-[#181c1e]">{data.total_respondents.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#4b6078]">Researchers</p>
              <p className="text-sm font-medium text-[#181c1e]">{data.total_researchers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* KPI 2: Verified Respondents (Large Card - 4 cols) */}
        <div className="md:col-span-4 bg-white border border-[#c1c7d0] rounded-xl p-6 flex flex-col justify-between group hover:border-[#1d5d8a] transition-colors relative overflow-hidden shadow-xs">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1d5d8a]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-xs font-semibold text-[#4b6078] uppercase mb-2 tracking-wider">
              Verified Respondents
            </p>
            <h3 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#00456d]">
              {data.verified_respondents.toLocaleString()}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-[#c1c7d0]/50 flex gap-6">
            <div>
              <p className="text-[11px] text-[#4b6078]">Tier 1</p>
              <p className="text-sm font-medium text-[#181c1e]">{data.tier1_count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#4b6078]">Tier 2</p>
              <p className="text-sm font-medium text-[#181c1e]">{data.tier2_count.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Nested Grid for Smaller KPIs (4 cols) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
          {/* KPI 3: Active Surveys */}
          <div className="bg-white border border-[#c1c7d0] rounded-xl p-4 flex flex-col justify-center group hover:border-[#1d5d8a] transition-colors shadow-xs">
            <p className="text-[11px] font-semibold text-[#4b6078] uppercase mb-1 tracking-wider">Active Surveys</p>
            <h3 className="font-['Newsreader',serif] text-2xl font-bold text-[#181c1e]">
              {data.active_surveys}
            </h3>
          </div>

          {/* KPI 4: Total Volume */}
          <div className="bg-white border border-[#c1c7d0] rounded-xl p-4 flex flex-col justify-center group hover:border-[#1d5d8a] transition-colors shadow-xs">
            <p className="text-[11px] font-semibold text-[#4b6078] uppercase mb-1 tracking-wider">Total Volume</p>
            <h3 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e]">
              {(data.total_volume_etb / 1000000).toFixed(1)}M <span className="text-xs text-[#4b6078] font-normal">ETB</span>
            </h3>
          </div>

          {/* KPI 5: Sub Revenue */}
          <div className="bg-white border border-[#c1c7d0] rounded-xl p-4 flex flex-col justify-center group hover:border-[#1d5d8a] transition-colors shadow-xs">
            <p className="text-[11px] font-semibold text-[#4b6078] uppercase mb-1 tracking-wider">Sub Revenue</p>
            <h3 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e]">
              {(data.subscription_revenue_etb / 1000).toFixed(1)}k <span className="text-xs text-[#4b6078] font-normal">ETB</span>
            </h3>
          </div>

          {/* KPI 6: Commission Rev */}
          <div className="bg-white border border-[#c1c7d0] rounded-xl p-4 flex flex-col justify-center group hover:border-[#1d5d8a] transition-colors shadow-xs">
            <p className="text-[11px] font-semibold text-[#4b6078] uppercase mb-1 tracking-wider">Commission Rev</p>
            <h3 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e]">
              {(data.commission_revenue_etb / 1000).toFixed(1)}k <span className="text-xs text-[#4b6078] font-normal">ETB</span>
            </h3>
          </div>
        </div>
      </div>

      {/* ── Pending Verification Queue Section (Stitch Screen 4406e41c481449329fcd8e4e79ffddcc) ── */}
      <div className="bg-white border border-[#c1c7d0] rounded-xl overflow-hidden shadow-xs mt-8">
        <div className="p-6 border-b border-[#c1c7d0] flex justify-between items-center bg-white">
          <div>
            <h3 className="font-['Newsreader',serif] text-xl font-bold text-[#181c1e]">
              Pending Verification Queue
            </h3>
            <p className="text-xs text-[#4b6078] mt-1">
              Review recently submitted identification documents.
            </p>
          </div>
          <Link
            to="/admin/review-queue"
            className="text-xs font-semibold text-[#00456d] border border-[#00456d] px-4 py-2 rounded-lg hover:bg-[#cde5ff] transition-colors"
          >
            View All
          </Link>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f4f7] border-b border-[#c1c7d0]">
                <th className="py-3 px-5 text-[11px] font-semibold text-[#4b6078] uppercase tracking-wider">
                  User / Applicant
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#4b6078] uppercase tracking-wider">
                  Role / Tier
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#4b6078] uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#4b6078] uppercase tracking-wider">
                  Document Type
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#4b6078] uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#c1c7d0]">
              {data.recent_queue_items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#4b6078]">
                    No pending documents in the queue.
                  </td>
                </tr>
              ) : (
                data.recent_queue_items.map((item) => {
                  const applicantInitials = (item.users?.full_name || "Applicant")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const isTier2 = item.users?.verification_tier === "tier_2";

                  return (
                    <tr className="hover:bg-[#f1f4f7]/50 transition-colors" key={item.id}>
                      <td className="py-3 px-5 font-medium text-[#181c1e]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#ebeef1] flex items-center justify-center text-[#4b6078] font-bold text-xs">
                            {applicantInitials}
                          </div>
                          <span>{item.users?.full_name || "Anonymous Applicant"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isTier2
                              ? "bg-[#1d5d8a] text-white"
                              : "bg-[#cbe2fe] text-[#4f657c]"
                          }`}
                        >
                          {isTier2 ? "Resp. Tier 2" : "Resp. Tier 1"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-[#4b6078]">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2 text-[#00456d]">
                          <span className="material-symbols-outlined text-[18px]">
                            {item.doc_type === "kebele_id" ? "badge" : "description"}
                          </span>
                          <span className="capitalize">{item.doc_type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Link
                          to="/admin/review-queue"
                          className="text-[#00456d] hover:text-[#1d5d8a] p-1 inline-flex items-center"
                          title="Review Document"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
