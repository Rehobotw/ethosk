import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function RawDataExportPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [exportFormat, setExportFormat] = useState<"csv" | "spss" | "excel">("csv");
  const [dateRange, setDateRange] = useState("Full Study");
  const [responseQuality, setResponseQuality] = useState("All Valid Responses");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
      {/* ── Researcher Top Header ── */}
      <header className="bg-white border-b border-[#c0c7d0]/40 sticky top-0 z-30">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="font-bold text-xl text-[#005985]">
              Ethosk
            </Link>
            <span className="text-xs text-[#50616b] font-medium pl-3 border-l border-[#c0c7d0]">
              {isAm ? "የመረጃ ኤክስፖርት" : "Raw Data Export"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-[#005985] hover:underline"
            >
              {isAm ? "ወደ ዳሽቦርድ" : "Back to Dashboard"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Canvas ── */}
      <main className="flex-1 p-4 md:p-8 flex justify-center items-center">
        <div className="w-full max-w-[680px] my-6">
          <div className="bg-white rounded-2xl border border-[#c0c7d0]/60 shadow-xs p-6 md:p-8 flex flex-col gap-6">
            {/* Export Card Header */}
            <div className="flex justify-between items-start border-b border-[#c0c7d0]/40 pb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#131b2e] tracking-tight">
                  {isAm ? "ጥሬ መረጃ ኤክስፖርት" : "Raw Data Export"}
                </h1>
                <p className="text-xs md:text-sm text-[#50616b] mt-1 leading-relaxed">
                  {isAm
                    ? "የጥናት መረጃዎን ለውጫዊ ትንተና በመደበኛ የስታቲስቲክስ ቅርጸቶች ያዘጋጁ እና ያውርዱ።"
                    : "Configure and download your survey data for external analysis in standard statistical formats."}
                </p>
              </div>
              <span className="bg-[#eff4ff] text-[#005985] text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-[#c0c7d0]/40 shrink-0">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{isAm ? "ፕሮ ደረጃ" : "Included in Pro Tier"}</span>
              </span>
            </div>

            {/* Format Selection Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#131b2e]">
                {isAm ? "የኤክስፖርት ቅርጸት" : "Export Format"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("csv")}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    exportFormat === "csv"
                      ? "border-[#005985] bg-[#eff4ff] ring-2 ring-[#005985]/20 font-bold"
                      : "border-[#c0c7d0]/60 bg-white hover:border-[#005985]"
                  }`}
                >
                  <span className="text-xs font-bold text-[#131b2e]">CSV</span>
                  <span className="text-[11px] text-[#50616b]">
                    {isAm ? "አጠቃላይ (Universal)" : "Universal"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("spss")}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    exportFormat === "spss"
                      ? "border-[#005985] bg-[#eff4ff] ring-2 ring-[#005985]/20 font-bold"
                      : "border-[#c0c7d0]/60 bg-white hover:border-[#005985]"
                  }`}
                >
                  <span className="text-xs font-bold text-[#131b2e]">SPSS (.sav)</span>
                  <span className="text-[11px] text-[#50616b]">
                    {isAm ? "ስታቲስቲክሳዊ" : "Statistical"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("excel")}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    exportFormat === "excel"
                      ? "border-[#005985] bg-[#eff4ff] ring-2 ring-[#005985]/20 font-bold"
                      : "border-[#c0c7d0]/60 bg-white hover:border-[#005985]"
                  }`}
                >
                  <span className="text-xs font-bold text-[#131b2e]">Excel (.xlsx)</span>
                  <span className="text-[11px] text-[#50616b]">
                    {isAm ? "ስፕሬድሺት" : "Spreadsheet"}
                  </span>
                </button>
              </div>
            </div>

            {/* Data Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#131b2e]">
                  {isAm ? "የቀን ክልል" : "Date Range"}
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#c0c7d0] bg-white text-xs text-[#131b2e] focus:outline-none focus:border-[#005985]"
                >
                  <option value="Full Study">{isAm ? "ሙሉ ጥናት" : "Full Study"}</option>
                  <option value="Last 30 Days">{isAm ? "ያለፉት 30 ቀናት" : "Last 30 Days"}</option>
                  <option value="Last 7 Days">{isAm ? "ያለፉት 7 ቀናት" : "Last 7 Days"}</option>
                  <option value="Custom Range">{isAm ? "የተለየ ክልል..." : "Custom Range..."}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#131b2e]">
                  {isAm ? "የምላሽ ጥራት" : "Response Quality"}
                </label>
                <select
                  value={responseQuality}
                  onChange={(e) => setResponseQuality(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#c0c7d0] bg-white text-xs text-[#131b2e] focus:outline-none focus:border-[#005985]"
                >
                  <option value="All Valid Responses">
                    {isAm ? "ሁሉም ህጋዊ ምላሾች" : "All Valid Responses"}
                  </option>
                  <option value="Verified Tier 2 Only">
                    {isAm ? "የተረጋገጡ ደረጃ 2 ብቻ" : "Verified Tier 2 Only"}
                  </option>
                  <option value="Include Flagged Responses">
                    {isAm ? "የተጠረጠሩ ምላሾችን ጨምሮ" : "Include Flagged Responses"}
                  </option>
                </select>
              </div>
            </div>

            {/* Export Preview Box */}
            <div className="bg-[#faf8ff] rounded-xl p-4 flex items-center justify-between border border-[#c0c7d0]/60">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#005985] text-2xl">
                  database
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">
                    {isAm ? "ግምታዊ መጠን" : "Estimated Export Size"}
                  </span>
                  <span className="text-[11px] text-[#50616b]">~2.4 MB</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#131b2e]">312</span>
                <span className="text-[11px] text-[#50616b] block">
                  {isAm ? "የተገኙ መዝገቦች" : "Records found"}
                </span>
              </div>
            </div>

            {/* Export Success Notification */}
            {exportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">
                  check_circle
                </span>
                <span>
                  {isAm
                    ? "ፋይሉ በተሳካ ሁኔታ ተዘጋጅቶ ማውረድ ጀምሯል!"
                    : "Export generated successfully! Download started."}
                </span>
              </div>
            )}

            {/* Download Action */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-gradient-to-br from-[#005985] to-[#2872a1] text-white hover:opacity-95 transition-all rounded-xl py-3.5 text-xs md:text-sm font-bold flex justify-center items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isExporting ? "sync" : "download"}
              </span>
              <span>
                {isExporting
                  ? isAm
                    ? "በማዘጋጀት ላይ..."
                    : "Generating Export..."
                  : isAm
                  ? "ማውረጃ አዘጋጅ እና አውርድ"
                  : "Generate & Download Export"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
