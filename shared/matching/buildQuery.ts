import {
  TIER_RANK,
  type EducationLevel,
  type EmploymentStatus,
  type Gender,
  type PrimaryLanguage,
  type VerificationTier,
} from "../types.js";

/**
 * Audience filters, in the order the builder presents them.
 *
 * The academic three (`university`, `department`, `yearRange`) are optional like
 * everything else. A study of market traders in Dire Dawa sets `region` and
 * `employmentStatus` and leaves them untouched.
 */
export interface MatchFilters {
  ageRange?: [number, number];
  gender?: Gender;
  primaryLanguage?: PrimaryLanguage;
  region?: string;
  city?: string;
  employmentStatus?: EmploymentStatus;
  occupation?: string;
  educationLevel?: EducationLevel;
  university?: string;
  department?: string;
  yearRange?: [number, number];
  minVerificationTier?: "1_id_verified" | "2_attribute_verified" | "3_institution_attested";
}

export interface BuiltQuery {
  sql: string;
  params: unknown[];
}

/**
 * Every filter is one column and one operator, so both query builders below can
 * be driven from the same table instead of repeating the predicate list twice.
 */
const EQUALITY_FILTERS: {
  key: keyof MatchFilters;
  column: string;
}[] = [
  { key: "gender", column: "gender" },
  { key: "primaryLanguage", column: "primary_language" },
  { key: "region", column: "region" },
  { key: "city", column: "city" },
  { key: "employmentStatus", column: "employment_status" },
  { key: "occupation", column: "occupation" },
  { key: "educationLevel", column: "education_level" },
  { key: "university", column: "university" },
  { key: "department", column: "department" },
];

const RANGE_FILTERS: {
  key: "ageRange" | "yearRange";
  column: string;
}[] = [
  { key: "ageRange", column: "age" },
  { key: "yearRange", column: "year" },
];

/**
 * Turns a filter object into a parameterized query against
 * `respondent_match_view` — never `respondent_profiles` directly, so a
 * researcher can only ever reach the columns matching actually needs (§17.1).
 *
 * Every value is bound as a placeholder; nothing from the filter object is
 * interpolated into the SQL string.
 */
export function buildMatchQuery(filters: MatchFilters): BuiltQuery {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const bind = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  const minTier = filters.minVerificationTier || "1_id_verified";
  clauses.push(`tier_rank >= ${bind(TIER_RANK[minTier])}`);

  for (const { key, column } of EQUALITY_FILTERS) {
    const value = filters[key];
    if (value !== undefined) clauses.push(`${column} = ${bind(value)}`);
  }

  for (const { key, column } of RANGE_FILTERS) {
    const range = filters[key];
    if (!range) continue;
    const [low, high] = normalizeRange(range);
    clauses.push(`${column} >= ${bind(low)}`);
    clauses.push(`${column} <= ${bind(high)}`);
  }

  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  return {
    sql: `SELECT user_id FROM respondent_match_view${where}`,
    params,
  };
}

/** Count variant of the same predicate, used by the live match endpoint. */
export function buildMatchCountQuery(filters: MatchFilters): BuiltQuery {
  const query = buildMatchQuery(filters);
  return {
    sql: query.sql.replace(/^SELECT user_id FROM/, "SELECT count(*)::int AS count FROM"),
    params: query.params,
  };
}

/** A researcher may enter a range backwards; treat it as the same range. */
function normalizeRange([a, b]: [number, number]): [number, number] {
  return a <= b ? [a, b] : [b, a];
}

/**
 * Mirrors `buildMatchQuery` for the Supabase JavaScript client, which the
 * server uses in practice. Kept beside `buildMatchQuery` so the SQL form and the
 * client form can be diffed against each other and unit-tested together.
 */
export interface SupabaseMatchFilter {
  column: string;
  op: "eq" | "gte" | "lte";
  value: unknown;
}

export function buildSupabaseMatchFilters(filters: MatchFilters = {}): SupabaseMatchFilter[] {
  const minTier = filters.minVerificationTier || "1_id_verified";
  const out: SupabaseMatchFilter[] = [
    { column: "tier_rank", op: "gte", value: TIER_RANK[minTier] },
  ];

  for (const { key, column } of EQUALITY_FILTERS) {
    const value = filters[key];
    if (value !== undefined) out.push({ column, op: "eq", value });
  }

  for (const { key, column } of RANGE_FILTERS) {
    const range = filters[key];
    if (!range) continue;
    const [low, high] = normalizeRange(range);
    out.push({ column, op: "gte", value: low });
    out.push({ column, op: "lte", value: high });
  }

  return out;
}

/** Tier comparison used when checking a respondent against a survey's filters. */
export function meetsMinimumTier(tier: VerificationTier, minimum: VerificationTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minimum];
}

/** Human-readable summary of an audience, for the send confirmation and dashboard. */
export function describeFilters(filters: MatchFilters): string[] {
  const parts: string[] = [];

  if (filters.ageRange) {
    const [low, high] = normalizeRange(filters.ageRange);
    parts.push(low === high ? `Age ${low}` : `Age ${low}–${high}`);
  }
  if (filters.gender) parts.push(filters.gender.replace(/_/g, " "));
  if (filters.region) parts.push(filters.region);
  if (filters.city) parts.push(filters.city);
  if (filters.employmentStatus) parts.push(filters.employmentStatus.replace(/_/g, " "));
  if (filters.occupation) parts.push(filters.occupation);
  if (filters.educationLevel) parts.push(filters.educationLevel.replace(/_/g, " "));
  if (filters.primaryLanguage) parts.push(filters.primaryLanguage.replace(/_/g, " "));
  if (filters.university) parts.push(filters.university);
  if (filters.department) parts.push(filters.department);
  if (filters.yearRange) {
    const [low, high] = normalizeRange(filters.yearRange);
    parts.push(low === high ? `Year ${low}` : `Years ${low}–${high}`);
  }

  return parts;
}
