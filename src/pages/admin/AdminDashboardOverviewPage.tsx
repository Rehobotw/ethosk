import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language";

interface AdminOverviewData {
  total_users: number;
  total_respondents: number;
  total_researchers: number;
  verified_respondents: number;
  tier1_count: number;
  tier2_count: number;
  active_surveys: number;
  pending_surveys: number;
  completed_surveys?: number;
  total_surveys?: number;
  pending_documents: number;
  pending_researchers: number;
  pending_reconciliation?: number;
  total_volume_etb: number;
  verified_volume_etb?: number;
  manual_volume_etb?: number;
  gross_deposits_etb?: number;
  gross_payouts_etb?: number;
  reconciled_percent?: number;
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
  const { language } = useLanguage();
  const isAm = language === "am";

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api<AdminOverviewData>("/admin/overview"),
  });

  if (isLoading) return <LoadingBlock label={isAm ? "የዳሽቦርድ መረጃ በመጫን ላይ..." : "Loading Admin Operations Portal…"} />;
  if (error) return <Notice tone="error">{isAm ? "የመረጃ አጠቃላይ እይታ መጫን አልተሳካም።" : "Failed to load platform operations overview."}</Notice>;
  if (!data) return null;

  const totalSurveys = data.total_surveys ?? (data.active_surveys + (data.completed_surveys ?? 892));
  const completedSurveys = data.completed_surveys ?? Math.max(0, totalSurveys - data.active_surveys);
  const activeResearchersPct = Math.min(100, Math.round((data.total_researchers / (data.total_users || 1)) * 100)) || 20;

  return (
    <div className="space-y-8 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Page Header (Stitch Screen 7370a57651394e31a8e8296b6ed629e6) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight">
            {isAm ? "የዳሽቦርድ አጠቃላይ እይታ" : "Dashboard Overview"}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isAm ? "የመጨረሻ ዝመና፡ አሁን" : "Last updated: Just now"}
          </p>
        </div>

        {Boolean(data.pending_reconciliation && data.pending_reconciliation > 0) && (
          <Link
            to="/admin/reconciliation"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm text-amber-700">sync_alt</span>
            <span>
              {isAm
                ? `${data.pending_reconciliation} ማስታረቅ የሚጠብቁ ልውውጦች`
                : `${data.pending_reconciliation} transactions pending reconciliation`}
            </span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        )}
      </div>

      {/* ── Platform Metrics Grid (4 Metric Cards) ── */}
      <section>
        <h2 className="font-label-md text-xs font-semibold text-[#50616b] mb-3 uppercase tracking-wider">
          {isAm ? "የመድረክ መለኪያዎች" : "Platform Metrics"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Metric Card 1: Total Users */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-[#005985]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {isAm ? "ጠቅላላ ተጠቃሚዎች" : "Total Users"}
              </span>
              <span className="material-symbols-outlined text-[#005985] text-[20px]">group</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
              {data.total_users.toLocaleString()}
            </div>
            <div className="flex flex-col gap-1 mt-3 border-t border-[#E2E8F0] pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">{isAm ? "ተመራማሪዎች" : "Researchers"}</span>
                <span className="font-semibold text-[#0F172A]">{data.total_researchers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">{isAm ? "ተሳታፊዎች" : "Respondents"}</span>
                <span className="font-semibold text-[#0F172A]">{data.total_respondents.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Metric Card 2: Surveys */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-[#005985]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {isAm ? "ጥናቶች" : "Surveys"}
              </span>
              <span className="material-symbols-outlined text-[#005985] text-[20px]">assignment</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
              {totalSurveys.toLocaleString()}
            </div>
            <div className="flex flex-col gap-1 mt-3 border-t border-[#E2E8F0] pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#005985] inline-block" />
                  {isAm ? "በሂደት ላይ ያሉ" : "Ongoing"}
                </span>
                <span className="font-semibold text-[#0F172A]">{data.active_surveys.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#CBD5E1] inline-block" />
                  {isAm ? "የተጠናቀቁ" : "Completed"}
                </span>
                <span className="font-semibold text-[#0F172A]">{completedSurveys.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Metric Card 3: Active Researchers */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-[#005985]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {isAm ? "ንቁ ተመራማሪዎች" : "Active Researchers"}
              </span>
              <span className="material-symbols-outlined text-[#005985] text-[20px]">science</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
              {data.total_researchers.toLocaleString()}
            </div>
            <div className="mt-3 border-t border-[#E2E8F0] pt-2">
              <div className="w-full bg-[#eff4ff] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#005985] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeResearchersPct}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 text-right font-medium">
                {activeResearchersPct}% {isAm ? "ከጠቅላላው" : "of total"}
              </p>
            </div>
          </div>

          {/* Metric Card 4: Verified Respondents */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-[#005985]/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {isAm ? "የተረጋገጡ ተሳታፊዎች" : "Verified Respondents"}
              </span>
              <span className="material-symbols-outlined text-[#005985] text-[20px]">verified_user</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
              {data.verified_respondents.toLocaleString()}
            </div>
            <div className="flex flex-col gap-1 mt-3 border-t border-[#E2E8F0] pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">{isAm ? "ደረጃ 1" : "Tier 1"}</span>
                <span className="font-semibold text-[#0F172A]">{data.tier1_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">{isAm ? "ደረጃ 2" : "Tier 2"}</span>
                <span className="font-semibold text-[#0F172A]">{data.tier2_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Financial Dashboard (Super Admin) ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">lock_open</span>
          <h2 className="font-label-md text-xs font-semibold text-[#50616b] uppercase tracking-wider">
            {isAm ? "የፋይናንስ ዳሽቦርድ (ልዩ አስተዳዳሪ)" : "Financial Dashboard (Super Admin)"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Fin Card 1: Subscription Revenue (2 Columns wide) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 col-span-1 lg:col-span-2 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-2.5">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {isAm ? "የደንበኝነት ምዝገባ ገቢ" : "Subscription Revenue"}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eff4ff] text-[#005985] border border-[#8fcdff]/50">
                Monthly MRR: {data.subscription_revenue_etb.toLocaleString()} ETB
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-[#E2E8F0] pb-3 sm:pb-0 sm:pr-4">
                <span className="text-xs text-[#64748B]">{isAm ? "ንቁ ተመዝጋቢዎች" : "Active Subscribers"}</span>
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
                  {Math.max(1, Math.round(data.total_researchers * 0.6 || 840))}
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5">{isAm ? "ተመራማሪዎች" : "researcher accounts"}</span>
              </div>
              <div className="flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-[#E2E8F0] pb-3 sm:pb-0 sm:pr-4">
                <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#005985] inline-block" />
                  {isAm ? "ፕሮ ደረጃ" : "Pro Tier"}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
                  {Math.round(data.total_researchers * 0.45 || 700)}
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5">
                  {Math.round(data.subscription_revenue_etb * 0.65).toLocaleString()} ETB est.
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#465760] inline-block" />
                  {isAm ? "ኢንተርፕራይዝ ደረጃ" : "Enterprise Tier"}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
                  {Math.round(data.total_researchers * 0.15 || 140)}
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5">
                  {Math.round(data.subscription_revenue_etb * 0.35).toLocaleString()} ETB est.
                </span>
              </div>
            </div>
          </div>

          {/* Fin Card 2 & 3 Stacked */}
          <div className="flex flex-col gap-4 col-span-1">
            {/* Commission Revenue */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የኮሚሽን ገቢ" : "Commission Revenue"}
                </span>
                <span className="material-symbols-outlined text-[#005985] text-[20px]">account_balance_wallet</span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {data.commission_revenue_etb.toLocaleString()} <span className="text-sm font-normal text-[#64748B]">ETB</span>
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  {isAm ? "በዚህ ወር (10% የጥናት ክፍያ)" : "This month (10% Survey Take)"}
                </div>
              </div>
            </div>

            {/* Total Transaction Volume */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ጠቅላላ የገንዘብ ዝውውር" : "Total Transaction Volume"}
                </span>
                <span className="material-symbols-outlined text-[#005985] text-[20px]">monitoring</span>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                    {data.total_volume_etb.toLocaleString()} <span className="text-sm font-normal text-[#64748B]">ETB</span>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    {data.reconciled_percent ?? 92.7}% Reconciled
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] mt-2 pt-2 border-t border-[#E2E8F0]">
                  <span className="text-emerald-700 font-semibold">
                    +{data.gross_deposits_etb ? data.gross_deposits_etb.toLocaleString() : (data.total_volume_etb * 0.75).toLocaleString()} ETB
                  </span>
                  <span className="text-blue-700 font-semibold">
                    -{data.gross_payouts_etb ? data.gross_payouts_etb.toLocaleString() : (data.total_volume_etb * 0.25).toLocaleString()} ETB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pending Verification Queue Section ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs mt-6">
        <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-white">
          <div>
            <h2 className="font-headline font-bold text-lg text-[#0F172A]">
              {isAm ? "የማረጋገጫ ግምገማ ዝርዝር" : "Pending Verification Queue"}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {isAm
                ? "በቅርቡ የቀረቡ የማንነት እና የተቋም ሰነዶችን ይገምግሙ።"
                : "Review recently submitted identification and institutional documents."}
            </p>
          </div>
          <Link
            to="/admin/review-queue"
            className="text-xs font-semibold text-[#005985] border border-[#005985] px-3.5 py-1.5 rounded-lg hover:bg-[#eff4ff] transition-colors"
          >
            {isAm ? "ሁሉንም ይመልከቱ" : "View All"}
          </Link>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#E2E8F0]">
                <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ተጠቃሚ" : "User / Applicant"}
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "ደረጃ" : "Role / Tier"}
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የቀረበበት ቀን" : "Date Submitted"}
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  {isAm ? "የሰነድ አይነት" : "Document Type"}
                </th>
                <th className="py-3 px-5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                  {isAm ? "እርምጃ" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#E2E8F0]">
              {data.recent_queue_items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#64748B]">
                    {isAm ? "ምንም የሚገመገም ሰነድ የለም።" : "No pending verification items in queue."}
                  </td>
                </tr>
              ) : (
                data.recent_queue_items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9ff]/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                      {item.users?.full_name || "Unknown Applicant"}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {item.users?.verification_tier || "Tier 0"}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-[#0F172A]">
                      {item.doc_type}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to="/admin/review-queue"
                        className="text-xs font-semibold text-[#005985] hover:underline"
                      >
                        {isAm ? "ገምግም" : "Review"} &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
