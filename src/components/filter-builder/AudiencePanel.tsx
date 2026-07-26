import { useEffect, useMemo, useState } from "react";
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
  type ResearcherWallet,
} from "@shared/types";
import { describeFilters } from "@shared/matching/buildQuery";
import type { MatchFiltersInput } from "@shared/validation/schemas";
import { Field, Icon, Input, Notice, Select, Spinner } from "../ui";
import { api } from "@/lib/api";

interface FilterOptions {
  universities: string[];
  departments: string[];
  years: number[];
  regions: string[];
  cities: string[];
  occupations: string[];
}

interface MatchResult {
  matched_count: number;
  power_warning: boolean;
  power_warning_threshold: number;
}

const ANY = "__any";

/** Debounce so a filter change costs one query, not one per keystroke (§15.3). */
const DEBOUNCE_MS = 400;

export function AudiencePanel({
  surveyId,
  filters,
  onChange,
  rewardEtb,
  disabled = false,
}: {
  surveyId: string | null;
  filters: MatchFiltersInput;
  onChange: (next: MatchFiltersInput) => void;
  rewardEtb: number | null;
  disabled?: boolean;
}) {
  const [debounced, setDebounced] = useState(filters);
  // Academic filters are collapsed by default: most studies are not about
  // students, and leading with university framed the whole panel as academic.
  const [showAcademic, setShowAcademic] = useState(
    Boolean(filters.university || filters.department || filters.yearRange),
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(filters), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  const { data: options } = useQuery({
    queryKey: ["filter-options"],
    queryFn: () => api<FilterOptions>("/surveys/meta/filter-options"),
    staleTime: 60_000,
  });

  const { data: match, isFetching } = useQuery({
    queryKey: ["match", surveyId, debounced],
    queryFn: () =>
      api<MatchResult>(`/surveys/${surveyId}/match`, { body: { filters: debounced } }),
    enabled: Boolean(surveyId),
    // The live count is the load-bearing number on this screen; never serve a
    // stale one after the filters change.
    staleTime: 0,
  });

  const { data: walletData } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  const matchedCount = match?.matched_count ?? 0;
  const totalBudget = useMemo(
    () => (rewardEtb ? matchedCount * rewardEtb : 0),
    [matchedCount, rewardEtb],
  );

  const available = walletData?.wallet.available_etb ?? 0;
  const underfunded = totalBudget > available;
  const activeFilters = describeFilters(filters);

  /** Every control writes through here so "any" consistently means "remove the filter". */
  const set = <K extends keyof MatchFiltersInput>(key: K, value: MatchFiltersInput[K]) => {
    const next = { ...filters };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const selectValue = (value: string | undefined) => value ?? ANY;
  const fromSelect = (raw: string) => (raw === ANY ? undefined : raw);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
      <div className="mb-stack-sm flex items-center gap-stack-sm">
        <Icon className="text-primary" name="groups" />
        <h2 className="font-headline-md text-title-sm text-primary">Audience</h2>
      </div>
      <p className="mb-stack-md font-body-sm text-[12px] text-on-surface-variant">
        Leave a filter on “Any” to reach the whole verified panel. Nothing here is required.
      </p>

      <div className="space-y-stack-md">
        <FilterGroup title="People">
          <div className="grid grid-cols-2 gap-stack-sm">
            <Field label="Age from">
              <Input
                disabled={disabled}
                max={100}
                min={15}
                onChange={(event) =>
                  set("ageRange", updateRange(filters.ageRange, 0, event.target.value, [15, 100]))
                }
                placeholder="Any"
                type="number"
                value={filters.ageRange?.[0] ?? ""}
              />
            </Field>
            <Field label="Age to">
              <Input
                disabled={disabled}
                max={100}
                min={15}
                onChange={(event) =>
                  set("ageRange", updateRange(filters.ageRange, 1, event.target.value, [15, 100]))
                }
                placeholder="Any"
                type="number"
                value={filters.ageRange?.[1] ?? ""}
              />
            </Field>
          </div>

          <Field label="Gender">
            <Select
              disabled={disabled}
              onChange={(event) =>
                set("gender", fromSelect(event.target.value) as MatchFiltersInput["gender"])
              }
              value={selectValue(filters.gender)}
            >
              <option value={ANY}>Any</option>
              {GENDERS.filter((value) => value !== "prefer_not_to_say").map((value) => (
                <option key={value} value={value}>
                  {GENDER_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Main language">
            <Select
              disabled={disabled}
              onChange={(event) =>
                set(
                  "primaryLanguage",
                  fromSelect(event.target.value) as MatchFiltersInput["primaryLanguage"],
                )
              }
              value={selectValue(filters.primaryLanguage)}
            >
              <option value={ANY}>Any</option>
              {PRIMARY_LANGUAGES.map((value) => (
                <option key={value} value={value}>
                  {PRIMARY_LANGUAGE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
        </FilterGroup>

        <FilterGroup title="Place">
          <Field label="Region">
            <Select
              disabled={disabled}
              onChange={(event) => set("region", fromSelect(event.target.value))}
              value={selectValue(filters.region)}
            >
              <option value={ANY}>Anywhere in Ethiopia</option>
              {ETHIOPIAN_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="City or town">
            <Select
              disabled={disabled}
              onChange={(event) => set("city", fromSelect(event.target.value))}
              value={selectValue(filters.city)}
            >
              <option value={ANY}>Any</option>
              {options?.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </Field>
        </FilterGroup>

        <FilterGroup title="Work and education">
          <Field label="Situation">
            <Select
              disabled={disabled}
              onChange={(event) =>
                set(
                  "employmentStatus",
                  fromSelect(event.target.value) as MatchFiltersInput["employmentStatus"],
                )
              }
              value={selectValue(filters.employmentStatus)}
            >
              <option value={ANY}>Any</option>
              {EMPLOYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {EMPLOYMENT_STATUS_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Occupation">
            <Select
              disabled={disabled}
              onChange={(event) => set("occupation", fromSelect(event.target.value))}
              value={selectValue(filters.occupation)}
            >
              <option value={ANY}>Any</option>
              {options?.occupations.map((occupation) => (
                <option key={occupation} value={occupation}>
                  {occupation}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Highest education">
            <Select
              disabled={disabled}
              onChange={(event) =>
                set(
                  "educationLevel",
                  fromSelect(event.target.value) as MatchFiltersInput["educationLevel"],
                )
              }
              value={selectValue(filters.educationLevel)}
            >
              <option value={ANY}>Any</option>
              {EDUCATION_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {EDUCATION_LEVEL_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
        </FilterGroup>

        {/* Student-specific, and only in the way when a study is not about students. */}
        <div className="border-t border-outline-variant pt-stack-md">
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowAcademic((open) => !open)}
            type="button"
          >
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Students only
            </span>
            <Icon
              className="text-[18px] text-on-surface-variant"
              name={showAcademic ? "expand_less" : "expand_more"}
            />
          </button>

          {showAcademic ? (
            <div className="mt-stack-sm space-y-stack-sm">
              <Field label="University / institution">
                <Select
                  disabled={disabled}
                  onChange={(event) => set("university", fromSelect(event.target.value))}
                  value={selectValue(filters.university)}
                >
                  <option value={ANY}>Any institution</option>
                  {options?.universities.map((university) => (
                    <option key={university} value={university}>
                      {university}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Department">
                <Select
                  disabled={disabled}
                  onChange={(event) => set("department", fromSelect(event.target.value))}
                  value={selectValue(filters.department)}
                >
                  <option value={ANY}>Any department</option>
                  {options?.departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Academic year">
                <Select
                  disabled={disabled}
                  onChange={(event) => {
                    if (event.target.value === ANY) {
                      set("yearRange", undefined);
                      return;
                    }
                    const year = Number(event.target.value);
                    set("yearRange", [year, year]);
                  }}
                  value={filters.yearRange ? String(filters.yearRange[0]) : ANY}
                >
                  <option value={ANY}>Any</option>
                  {(options?.years ?? [1, 2, 3, 4, 5, 6, 7, 8]).map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}
        </div>

        <FilterGroup title="Quality">
          <Field
            hint="Higher tiers are smaller but better evidenced."
            label="Minimum verification tier"
          >
            <Select
              disabled={disabled}
              onChange={(event) =>
                set(
                  "minVerificationTier",
                  event.target.value as MatchFiltersInput["minVerificationTier"],
                )
              }
              value={filters.minVerificationTier}
            >
              <option value="1_id_verified">Tier 1 — ID verified</option>
              <option value="2_attribute_verified">Tier 2 — Attribute verified</option>
              <option value="3_institution_attested">Tier 3 — Institution attested</option>
            </Select>
          </Field>
        </FilterGroup>

        {/* Matched count */}
        <div className="border-t border-outline-variant pt-stack-md">
          <div className="mb-stack-sm flex items-end justify-between">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Matched respondents
            </span>
            <span className="flex items-center gap-stack-sm font-headline-md text-headline-md text-primary">
              {isFetching ? <Spinner className="h-4 w-4" /> : null}
              {surveyId ? matchedCount : "—"}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-surface-container">
            <div
              className="h-1 rounded-full bg-status-review transition-all duration-300"
              style={{ width: `${Math.min(100, matchedCount / 5)}%` }}
            />
          </div>

          {activeFilters.length > 0 ? (
            <div className="mt-stack-sm flex flex-wrap gap-1">
              {activeFilters.map((part) => (
                <span
                  className="rounded-full bg-surface-container-high px-2 py-0.5 font-body-sm text-[11px] capitalize text-on-surface-variant"
                  key={part}
                >
                  {part}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-stack-sm font-body-sm text-[12px] text-on-surface-variant">
              No filters — everyone at this tier or above.
            </p>
          )}

          {!surveyId ? (
            <p className="mt-stack-sm font-body-sm text-[12px] text-on-surface-variant">
              Save the draft to see a live matched count.
            </p>
          ) : null}
        </div>

        {/* An impossible-to-miss inline banner, not a small icon (§15.3). */}
        {match?.power_warning ? (
          <Notice tone="warning" title="Low statistical power">
            Only {matchedCount} respondent{matchedCount === 1 ? "" : "s"} match these filters, below
            the threshold of {match.power_warning_threshold}. You can still send, but the result will
            not support strong claims. Consider widening the filters or lowering the tier requirement.
          </Notice>
        ) : null}

        {rewardEtb ? (
          <div className="rounded-xl bg-secondary-container p-stack-md text-on-secondary-container">
            <div className="mb-base flex items-center justify-between">
              <span className="font-label-caps text-[11px] font-bold uppercase">
                Cost per response
              </span>
              <span className="font-title-sm text-body-md">{rewardEtb.toFixed(2)} ETB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[11px] font-bold uppercase">Total budget</span>
              <span className="font-headline-md text-title-sm">
                {totalBudget.toLocaleString()} ETB
              </span>
            </div>
            <div className="mt-stack-sm flex items-center justify-between border-t border-on-secondary-container/20 pt-stack-sm">
              <span className="font-label-caps text-[11px] font-bold uppercase">
                Your balance
              </span>
              <span className="font-title-sm text-body-md">{available.toLocaleString()} ETB</span>
            </div>
          </div>
        ) : null}

        {underfunded && surveyId ? (
          <Notice tone="error" title="Not enough funds to send">
            This audience costs {totalBudget.toLocaleString()} ETB and your balance is{" "}
            {available.toLocaleString()} ETB. Add {(totalBudget - available).toLocaleString()} ETB
            from the Wallet, narrow the audience, or lower the reward.
          </Notice>
        ) : null}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-stack-sm">
      <legend className="mb-base font-label-caps text-label-caps uppercase text-primary">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Edits one end of a numeric range.
 *
 * Clearing either end drops the whole filter, because half a range is not a
 * meaningful constraint and silently substituting a bound would target people the
 * researcher did not ask for.
 */
function updateRange(
  current: [number, number] | undefined,
  index: 0 | 1,
  raw: string,
  [min, max]: [number, number],
): [number, number] | undefined {
  if (raw === "") return undefined;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return current;

  const clamped = Math.min(max, Math.max(min, parsed));
  const base = current ?? [min, max];
  const next: [number, number] = [base[0], base[1]];
  next[index] = clamped;
  return next;
}
