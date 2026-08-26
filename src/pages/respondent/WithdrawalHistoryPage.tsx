import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";

type WithdrawalStatus = "Completed" | "Processing" | "Rejected";

interface WithdrawalRecord {
  id: string;
  date: string;
  amount: string;
  destination: string;
  txn_ref: string;
  status: WithdrawalStatus;
}

const mockWithdrawals: WithdrawalRecord[] = [
  {
    id: "w-1",
    date: "Oct 24, 2023",
    amount: "1,000 ETB",
    destination: "CBE Bank - ...4412",
    txn_ref: "#TXN-99218",
    status: "Completed",
  },
  {
    id: "w-2",
    date: "Oct 20, 2023",
    amount: "500 ETB",
    destination: "Telebirr - ...8821",
    txn_ref: "#TXN-99105",
    status: "Processing",
  },
  {
    id: "w-3",
    date: "Oct 15, 2023",
    amount: "2,500 ETB",
    destination: "Dashn Bank - ...1109",
    txn_ref: "#TXN-98992",
    status: "Rejected",
  },
  {
    id: "w-4",
    date: "Oct 10, 2023",
    amount: "150 ETB",
    destination: "CBE Bank - ...4412",
    txn_ref: "#TXN-98750",
    status: "Completed",
  },
];

const STATUS_STYLES: Record<WithdrawalStatus, string> = {
  Completed:
    "bg-emerald-50 text-emerald-700 border-emerald-100",
  Processing:
    "bg-blue-50 text-blue-700 border-blue-100",
  Rejected:
    "bg-red-50 text-red-700 border-red-100",
};

export function WithdrawalHistoryPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = mockWithdrawals.filter((w) => {
    if (statusFilter !== "all" && w.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery && !w.txn_ref.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / 4));

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-['Inter',sans-serif] text-[#131b2e]">
      {/* ── Header Section ── */}
      <div className="flex flex-col gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate("/wallet")}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-xs font-semibold w-fit cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>{isAm ? "ወደ ዋሌት ተመለስ" : "Back to Wallet"}</span>
        </button>
        <h1 className="font-['Merriweather',serif] font-bold text-2xl md:text-3xl text-slate-900">
          {isAm ? "የመውጫ ታሪክ" : "Withdrawal History"}
        </h1>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAm ? "ጠቅላላ የተወሰደ" : "Total Withdrawn"}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">4,150</span>
            <span className="text-xs font-medium text-slate-500">ETB</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAm ? "በመጠባበቅ ላይ ያሉ" : "Pending Withdrawals"}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">500</span>
            <span className="text-xs font-medium text-slate-500">ETB</span>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 flex flex-col md:flex-row gap-3 justify-between items-center border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <div className="relative w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-700 focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] transition-all cursor-pointer"
              >
                <option value="all">{isAm ? "ሁሉም ሁኔታዎች" : "All Statuses"}</option>
                <option value="processing">{isAm ? "በሂደት ላይ" : "Processing"}</option>
                <option value="completed">{isAm ? "ተጠናቅቋል" : "Completed"}</option>
                <option value="rejected">{isAm ? "ተቀባይነት አላገኘም" : "Rejected"}</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">
                expand_more
              </span>
            </div>

            {/* Date Range */}
            <div className="relative w-full md:w-48">
              <input
                type="text"
                placeholder={isAm ? "የቀን ክልል" : "Date Range"}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985] transition-all"
              />
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">
                calendar_today
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder={isAm ? "ግብይት ቁ ይፈልጉ..." : "Search Txn ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-lg py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#005985] transition-all"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">
              search
            </span>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-5 font-semibold">{isAm ? "ቀን" : "Date"}</th>
                <th className="py-3 px-5 font-semibold">{isAm ? "መጠን" : "Amount"}</th>
                <th className="py-3 px-5 font-semibold">{isAm ? "መድረሻ" : "Destination"}</th>
                <th className="py-3 px-5 font-semibold">{isAm ? "የግብይት ማጣቀሻ" : "Transaction Ref"}</th>
                <th className="py-3 px-5 font-semibold">{isAm ? "ሁኔታ" : "Status"}</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-gray-100">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5">{w.date}</td>
                  <td className="py-3.5 px-5 font-medium text-slate-900">{w.amount}</td>
                  <td className="py-3.5 px-5 text-slate-600">{w.destination}</td>
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-500">{w.txn_ref}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${STATUS_STYLES[w.status]}`}
                    >
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    {isAm ? "ምንም ግብይት አልተገኘም" : "No withdrawals found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((w) => (
            <div key={w.id} className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">{w.date}</span>
                  <span className="text-base font-bold text-slate-900">{w.amount}</span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${STATUS_STYLES[w.status]}`}
                >
                  {w.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-sm text-slate-600">{w.destination}</span>
                <span className="font-mono text-xs text-slate-500">{w.txn_ref}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50/30">
          <span className="text-sm text-slate-500">
            {isAm
              ? `${filtered.length} ውጤቶች ከ ${mockWithdrawals.length} ይታያሉ`
              : `Showing 1-${filtered.length} of ${filtered.length} withdrawals`}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-slate-400 hover:bg-white disabled:opacity-50 transition-colors bg-white shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-xs font-bold shadow-xs cursor-pointer ${
                  currentPage === page
                    ? "border-[#005985] bg-[#005985] text-white"
                    : "border-gray-200 text-slate-700 hover:bg-gray-50 bg-white"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors bg-white shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
