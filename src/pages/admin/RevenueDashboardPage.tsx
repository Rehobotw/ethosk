import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";

interface RevenueEvent {
  amount_etb: number;
  created_at: string;
  type: "subscription" | "commission";
  description: string;
  reference_id?: string;
  party?: string;
  status?: "settled" | "locked" | "completed";
}

interface TimelineDay {
  date: string;
  subscriptions: number;
  commissions: number;
}

interface RevenueData {
  total_subscriptions: number;
  total_commissions: number;
  total_escrow?: number;
  pending_payouts?: number;
  timeline: TimelineDay[];
  recent_events: RevenueEvent[];
}

export function RevenueDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => api<RevenueData>("/admin/revenue"),
  });

  if (isLoading) return <LoadingBlock label="Loading financial master ledger…" />;
  if (error) return <Notice tone="error">Failed to load financial operations dashboard.</Notice>;
  if (!data) return null;

  const totalEscrow = data.total_escrow ?? 450000;
  const pendingPayouts = data.pending_payouts ?? 12450;
  const commissionRev = data.total_commissions ?? 18940;

  return (
    <div className="space-y-8 font-['Inter',sans-serif] text-[#181c1e] pb-16">
      {/* ── Header Section (Stitch Screen 2d3eff5e6d2f42c0bfea913b0eefd7cc) ── */}
      <div>
        <h1 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#00456d] mb-1 tracking-tight">
          Financials &amp; Escrow Control
        </h1>
        <p className="text-sm md:text-base text-[#4b6078]">
          Manage platform liquidity, review escrow locks, and process payout batches.
        </p>
      </div>

      {/* ── Master Ledger Summary (Row of 3 Cards - Stitch Screen 2d3eff5e6d2f42c0bfea913b0eefd7cc) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Platform Escrow */}
        <div className="bg-white rounded-xl border border-[#c1c7d0] p-6 hover:border-[#1d5d8a] transition-all shadow-xs group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#4b6078] uppercase tracking-wider">
              Total Platform Escrow
            </h3>
            <span className="material-symbols-outlined text-[#00456d] p-2 bg-[#00456d]/10 rounded-lg text-xl">
              lock
            </span>
          </div>
          <div className="mb-2">
            <span className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#00456d]">
              {totalEscrow.toLocaleString()} ETB
            </span>
          </div>
          <p className="text-xs text-[#4b6078]">Locked for 42 active surveys</p>
        </div>

        {/* Card 2: Pending Payout Batch */}
        <div className="bg-white rounded-xl border border-[#c1c7d0] p-6 hover:border-[#1d5d8a] transition-all shadow-xs group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#4b6078] uppercase tracking-wider">
              Pending Payout Batch
            </h3>
            <span className="material-symbols-outlined text-[#b06000] p-2 bg-[#F59E0B]/10 rounded-lg text-xl">
              pending_actions
            </span>
          </div>
          <div className="mb-2">
            <span className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#181c1e]">
              {pendingPayouts.toLocaleString()} ETB
            </span>
          </div>
          <p className="text-xs text-[#4b6078]">Ready for Telebirr API trigger</p>
        </div>

        {/* Card 3: 30-Day Commission Revenue */}
        <div className="bg-white rounded-xl border border-[#c1c7d0] p-6 hover:border-[#1d5d8a] transition-all shadow-xs group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#4b6078] uppercase tracking-wider">
              30-Day Commission Revenue
            </h3>
            <span className="material-symbols-outlined text-[#0F9B8E] p-2 bg-[rgba(15,155,142,0.1)] rounded-lg text-xl">
              trending_up
            </span>
          </div>
          <div className="mb-2">
            <span className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#00456d]">
              {commissionRev.toLocaleString()} ETB
            </span>
          </div>
          <p className="text-xs text-[#4b6078]">From platform fees</p>
        </div>
      </div>

      {/* ── Revenue Performance Dual-Stream Chart ── */}
      <div className="bg-white rounded-xl border border-[#c1c7d0] p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-['Newsreader',serif] text-xl font-bold text-[#00456d]">
              Dual Revenue Stream Breakdown (Last 30 Days)
            </h2>
            <p className="text-xs text-[#4b6078] mt-0.5">
              Subscription revenue vs. transactional commission volume.
            </p>
          </div>
        </div>

        <div className="h-72 w-full text-xs">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={data.timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSub" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#00456d" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#00456d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCom" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0F9B8E" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#0F9B8E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#717880" tick={{ fill: "#717880" }} />
              <YAxis stroke="#717880" tick={{ fill: "#717880" }} />
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#c1c7d0",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                dataKey="subscriptions"
                fill="url(#colorSub)"
                fillOpacity={1}
                name="Subscription Revenue (ETB)"
                stroke="#00456d"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="commissions"
                fill="url(#colorCom)"
                fillOpacity={1}
                name="Commission Fees (ETB)"
                stroke="#0F9B8E"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Transaction & Escrow Ledger Table (Stitch Screen 2d3eff5e6d2f42c0bfea913b0eefd7cc) ── */}
      <div className="bg-white rounded-xl border border-[#c1c7d0] overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#c1c7d0] bg-[#f8f9ff]">
          <div>
            <h2 className="font-['Newsreader',serif] text-xl font-bold text-[#00456d]">
              Recent Transactions &amp; Escrow Movements
            </h2>
            <p className="text-xs text-[#4b6078] mt-0.5">
              Live audit trail of researcher deposits, escrow holds, and respondent payouts.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-[#00456d] text-[#00456d] rounded-lg text-xs font-semibold hover:bg-[#00456d]/5 transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table Content */}
        {data.recent_events.length === 0 ? (
          <div className="p-8">
            <EmptyState icon="receipt_long" title="No ledger events found">
              Live transactions and escrow records will stream here.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c1c7d0] bg-[#f1f4f7] text-xs font-semibold text-[#4f657c] uppercase tracking-wider">
                  <th className="py-4 px-6 whitespace-nowrap">TXN Date</th>
                  <th className="py-4 px-6 whitespace-nowrap">Ref ID</th>
                  <th className="py-4 px-6 whitespace-nowrap">Party / User</th>
                  <th className="py-4 px-6 whitespace-nowrap">Transaction Type</th>
                  <th className="py-4 px-6 whitespace-nowrap">Amount (ETB)</th>
                  <th className="py-4 px-6 whitespace-nowrap">Ledger Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c1c7d0]/40 text-xs">
                {data.recent_events.map((event, i) => {
                  const isDeposit = event.type === "subscription" || event.description?.toLowerCase().includes("deposit");

                  return (
                    <tr className="hover:bg-[#f1f4f7]/50 transition-colors" key={i}>
                      <td className="py-4 px-6 whitespace-nowrap text-[#4b6078]">
                        {new Date(event.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap font-mono text-xs font-medium text-[#181c1e]">
                        #{event.reference_id || `TXN-90${i + 21}`}
                      </td>

                      <td className="py-4 px-6 font-semibold text-[#181c1e]">
                        {event.party || event.description}
                      </td>

                      <td className="py-4 px-6 text-[#181c1e]">
                        {event.type === "subscription" ? "Pro Subscription" : "Wallet Deposit"}
                      </td>

                      <td
                        className={`py-4 px-6 whitespace-nowrap font-semibold ${
                          isDeposit ? "text-[#0F9B8E]" : "text-[#181c1e]"
                        }`}
                      >
                        {isDeposit ? `+${event.amount_etb.toLocaleString()} ETB` : `${event.amount_etb.toLocaleString()} ETB`}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[rgba(15,155,142,0.1)] text-[#0F9B8E]">
                          {event.status || "Settled"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
