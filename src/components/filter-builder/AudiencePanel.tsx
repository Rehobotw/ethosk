import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  EDUCATION_LEVEL_LABEL,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUS_LABEL,
  EMPLOYMENT_STATUSES,
  ETHIOPIAN_REGIONS,
  GENDER_LABEL,
  GENDERS,
  PRIMARY_LANGUAGE_LABEL,
  PRIMARY_LANGUAGES,
} from "@shared/types";
import type { MatchFiltersInput } from "@shared/validation/schemas";
import { api } from "@/lib/api";

interface MatchResult {
  matched_count: number;
  power_warning: boolean;
  power_warning_threshold: number;
}

const ANY = "__any";
const DEBOUNCE_MS = 400;

export function AudiencePanel({
  surveyId,
  filters,
  onChange,
  rewardEtb: _rewardEtb,
  complianceDocumentPath,
  onComplianceDocumentChange,
  onNextStep,
  onSaveDraft,
  disabled: _disabled = false,
}: {
  surveyId: string | null;
  filters: MatchFiltersInput;
  onChange: (next: MatchFiltersInput) => void;
  rewardEtb: number | null;
  complianceDocumentPath?: string | null;
  onComplianceDocumentChange?: (path: string | null) => void;
  onNextStep?: () => void;
  onSaveDraft?: () => void;
  disabled?: boolean;
}) {
  const [debounced, setDebounced] = useState(filters);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    filters.region ? [filters.region] : ["Addis Ababa", "Oromia"]
  );
  const [minAge, setMinAge] = useState<string>(
    filters.ageRange ? String(filters.ageRange[0]) : ""
  );
  const [maxAge, setMaxAge] = useState<string>(
    filters.ageRange ? String(filters.ageRange[1]) : ""
  );
  const [mockFile, setMockFile] = useState<{ name: string; size: string } | null>({
    name: complianceDocumentPath || "ethiopia_irb_approval_2026.pdf",
    size: "2.4 MB",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(filters), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  const { data: match } = useQuery({
    queryKey: ["match", surveyId, debounced],
    queryFn: () =>
      api<MatchResult>(`/surveys/${surveyId}/match`, { body: { filters: debounced } }),
    enabled: Boolean(surveyId),
    staleTime: 0,
  });

  const matchedCount = match?.matched_count ?? 185;

  const set = <K extends keyof MatchFiltersInput>(key: K, value: MatchFiltersInput[K]) => {
    const next = { ...filters };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const handleAgeChange = (min: string, max: string) => {
    setMinAge(min);
    setMaxAge(max);
    const minN = parseInt(min, 10);
    const maxN = parseInt(max, 10);
    if (!isNaN(minN) && !isNaN(maxN)) {
      set("ageRange", [minN, maxN]);
    } else if (!isNaN(minN)) {
      set("ageRange", [minN, 100]);
    } else {
      set("ageRange", undefined);
    }
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      const next = prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region];
      set("region", next.length ? next[0] : undefined);
      return next;
    });
  };

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* ── 5-Step Stepper (Stitch Screen af2c29775e6a4c6a998a11c30d40b079) ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-surface-variant -z-10" />

          {/* Step 1 */}
          <div className="flex flex-col items-center gap-2 bg-background px-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
            <span className="text-xs text-on-surface-variant hidden sm:block font-medium">
              Select Survey
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-2 bg-background px-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
            <span className="text-xs text-on-surface-variant hidden sm:block font-medium">
              Select Format
            </span>
          </div>

          {/* Step 3 (Active) */}
          <div className="flex flex-col items-center gap-2 bg-background px-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-xs ring-4 ring-primary/20">
              <span className="text-xs font-bold">3</span>
            </div>
            <span className="text-xs text-primary font-bold hidden sm:block">
              Configure Filters
            </span>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center gap-2 bg-background px-2">
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border border-outline-variant">
              <span className="text-xs font-semibold">4</span>
            </div>
            <span className="text-xs text-outline hidden sm:block font-medium">
              Sample &amp; Budget
            </span>
          </div>

          {/* Step 5 */}
          <div className="flex flex-col items-center gap-2 bg-background px-2">
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border border-outline-variant">
              <span className="text-xs font-semibold">5</span>
            </div>
            <span className="text-xs text-outline hidden sm:block font-medium">
              Publish
            </span>
          </div>
        </div>
      </div>

      {/* ── Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Form Content) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Research Approval Section */}
          <section className="bg-white rounded-xl border border-outline-variant/40 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.04)]">
            <h2 className="text-xl font-headline-md font-bold text-primary mb-6 border-b border-outline-variant/30 pb-4">
              Research Approval Document
            </h2>

            <div
              className="border-2 border-dashed border-outline-variant/60 rounded-xl p-6 bg-[#f8f9ff] flex flex-col items-center justify-center text-center mb-4 transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
              onClick={() => {
                setMockFile({
                  name: "ethiopia_irb_approval_2026.pdf",
                  size: "2.4 MB",
                });
                onComplianceDocumentChange?.("ethiopia_irb_approval_2026.pdf");
              }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <span className="material-symbols-outlined text-[24px]">upload_file</span>
              </div>
              <p className="text-sm font-semibold text-on-surface mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-outline">
                PDF, DOCX up to 10MB. Ethical/IRB clearance required for targeted demographic matching.
              </p>
            </div>

            {mockFile && (
              <div className="flex items-center justify-between p-4 bg-[#f8f9ff] rounded-xl border border-outline-variant/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <span className="material-symbols-outlined">attach_file</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface">{mockFile.name}</span>
                    <span className="text-[11px] text-on-surface-variant">{mockFile.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary">
                    Pending Admin Review
                  </span>
                  <button
                    className="text-error hover:bg-error/10 p-1.5 rounded-full transition-colors cursor-pointer"
                    onClick={() => {
                      setMockFile(null);
                      onComplianceDocumentChange?.(null);
                    }}
                    title="Remove file"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Demographic Controls Section */}
          <section className="bg-white rounded-xl border border-outline-variant/40 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.04)]">
            <h2 className="text-xl font-headline-md font-bold text-primary mb-6 border-b border-outline-variant/30 pb-4">
              Target Audience Filters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Age Range */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Age Range
                </label>
                <div className="flex items-center gap-4">
                  <input
                    className="w-28 border border-outline-variant/50 rounded-lg px-3 py-2 text-xs bg-[#f8f9ff] focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => handleAgeChange(e.target.value, maxAge)}
                    placeholder="Min"
                    type="number"
                    value={minAge}
                  />
                  <span className="text-on-surface-variant font-bold">—</span>
                  <input
                    className="w-28 border border-outline-variant/50 rounded-lg px-3 py-2 text-xs bg-[#f8f9ff] focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => handleAgeChange(minAge, e.target.value)}
                    placeholder="Max"
                    type="number"
                    value={maxAge}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Gender
                </label>
                <select
                  className="w-full border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs bg-[#f8f9ff] focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  onChange={(e) => set("gender", e.target.value === ANY ? undefined : (e.target.value as any))}
                  value={filters.gender || ANY}
                >
                  <option value={ANY}>Any Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABEL[g]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education Level */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Education Level
                </label>
                <select
                  className="w-full border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs bg-[#f8f9ff] focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  onChange={(e) =>
                    set("educationLevel", e.target.value === ANY ? undefined : (e.target.value as any))
                  }
                  value={filters.educationLevel || ANY}
                >
                  <option value={ANY}>All Education Levels</option>
                  {EDUCATION_LEVELS.map((ed) => (
                    <option key={ed} value={ed}>
                      {EDUCATION_LEVEL_LABEL[ed]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region & City Chips */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Region &amp; City (Ethiopia)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedRegions.map((region) => (
                    <button
                      className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
                      key={region}
                      onClick={() => toggleRegion(region)}
                      type="button"
                    >
                      <span>{region}</span>
                      <span className="material-symbols-outlined text-[16px] ml-1">close</span>
                    </button>
                  ))}

                  {/* Add region menu */}
                  <div className="relative inline-block">
                    <select
                      className="inline-flex items-center px-3 py-1.5 rounded-full border border-outline-variant/60 border-dashed bg-[#f8f9ff] text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer outline-none"
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== ANY) {
                          toggleRegion(e.target.value);
                        }
                      }}
                      value={ANY}
                    >
                      <option value={ANY}>+ Add Region</option>
                      {ETHIOPIAN_REGIONS.filter((r) => !selectedRegions.includes(r)).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Employment / Profession */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Employment Status
                </label>
                <select
                  className="w-full border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs bg-[#f8f9ff] focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  onChange={(e) =>
                    set("employmentStatus", e.target.value === ANY ? undefined : (e.target.value as any))
                  }
                  value={filters.employmentStatus || ANY}
                >
                  <option value={ANY}>Any Employment Status</option>
                  {EMPLOYMENT_STATUSES.map((es) => (
                    <option key={es} value={es}>
                      {EMPLOYMENT_STATUS_LABEL[es]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Language */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Primary Language
                </label>
                <select
                  className="w-full border border-outline-variant/50 rounded-lg px-3 py-2.5 text-xs bg-[#f8f9ff] focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  onChange={(e) =>
                    set("primaryLanguage", e.target.value === ANY ? undefined : (e.target.value as any))
                  }
                  value={filters.primaryLanguage || ANY}
                >
                  <option value={ANY}>Any Language</option>
                  {PRIMARY_LANGUAGES.map((pl) => (
                    <option key={pl} value={pl}>
                      {PRIMARY_LANGUAGE_LABEL[pl]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Sticky Estimation Panel) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 bg-white rounded-xl border border-outline-variant/40 p-6 md:p-7 shadow-[0_4px_20px_rgba(0,89,133,0.06)] flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Estimated Reach
              </h3>
              <div className="text-4xl font-headline-lg font-bold text-primary mb-2">
                {matchedCount.toLocaleString()}
              </div>
              <p className="text-xs text-on-surface-variant">
                Tier 1 &amp; Tier 2 verified respondents match your demographic criteria.
              </p>
            </div>

            <div className="bg-[#f8f9ff] rounded-xl p-4 border border-outline-variant/30 flex gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-on-surface mb-1">Admin Approval Queue</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Your IRB document is logged for ethical clearance review. You can proceed with setup; survey activation occurs upon clearance (typically 24–48 hrs).
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 mt-auto space-y-3">
              <button
                className="w-full py-3.5 px-4 bg-primary hover:bg-[#003450] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer active:scale-95 group"
                onClick={onNextStep}
                type="button"
              >
                <span>Next: Set Sample &amp; Budget</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button
                className="w-full py-2.5 px-4 text-on-surface-variant hover:text-primary rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                onClick={onSaveDraft}
                type="button"
              >
                Save Draft &amp; Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
