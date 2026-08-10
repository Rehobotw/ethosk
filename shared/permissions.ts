/**
 * Central permission matrix.
 *
 * Every gatable action in the system is a `Permission` string. Each `UserRole`
 * maps to the set of permissions it holds. Super-admins inherit every admin
 * permission by construction — there is no runtime "if super_admin then also
 * admin" branch that someone could forget to add.
 *
 * Researcher capabilities are further gated by `ResearcherVerificationLevel`
 * and `SubscriptionTier`, which are checked independently of the role-level
 * permission (a verified researcher with the "send_survey" permission still
 * cannot send if their wallet has no escrow).
 */

import type { UserRole } from "./types.js";

// ---------------------------------------------------------------------------
// Permission catalogue
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  // Respondent capabilities — gated by verification tier separately
  "respondent:view_profile",
  "respondent:fill_survey",
  "respondent:earn_rewards",
  "respondent:upload_documents",

  // Researcher capabilities
  "researcher:create_draft",
  "researcher:send_survey",
  "researcher:view_responses",
  "researcher:bulk_export",
  "researcher:manage_profile",

  // Admin capabilities
  "admin:review_documents",
  "admin:process_data_requests",
  "admin:view_audit_trail",

  // Super-admin exclusives
  "super_admin:manage_users",
  "super_admin:manage_admins",
  "super_admin:system_config",
  "super_admin:view_all_users",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ---------------------------------------------------------------------------
// Role → permission mapping
// ---------------------------------------------------------------------------

const RESPONDENT_PERMISSIONS: readonly Permission[] = [
  "respondent:view_profile",
  "respondent:fill_survey",
  "respondent:earn_rewards",
  "respondent:upload_documents",
] as const;

const RESEARCHER_PERMISSIONS: readonly Permission[] = [
  "researcher:create_draft",
  "researcher:send_survey",
  "researcher:view_responses",
  "researcher:manage_profile",
] as const;

const ADMIN_PERMISSIONS: readonly Permission[] = [
  "admin:review_documents",
  "admin:process_data_requests",
  "admin:view_audit_trail",
] as const;

const SUPER_ADMIN_PERMISSIONS: readonly Permission[] = [
  // Inherits everything admin can do
  ...ADMIN_PERMISSIONS,
  // Plus super-admin exclusives
  "super_admin:manage_users",
  "super_admin:manage_admins",
  "super_admin:system_config",
  "super_admin:view_all_users",
] as const;

/**
 * The definitive role → permissions map.
 *
 * Used server-side by `requirePermission()` middleware and client-side by
 * the `<RequirePermission>` guard component.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  respondent: RESPONDENT_PERMISSIONS,
  researcher: RESEARCHER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Does the given role hold the requested permission? */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Does the given role hold ALL of the requested permissions? */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.every((p) => rolePerms.includes(p));
}

/** Does the given role hold ANY of the requested permissions? */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.some((p) => rolePerms.includes(p));
}

/**
 * Whether `role` is considered to satisfy a `requiredRole` check.
 *
 * The key rule: `super_admin` satisfies any check for `admin`, because
 * super-admin is a strict superset of admin.
 */
export function roleSatisfies(role: UserRole, requiredRole: UserRole): boolean {
  if (role === requiredRole) return true;
  if (role === "super_admin" && requiredRole === "admin") return true;
  return false;
}

/**
 * Whether `role` satisfies ANY of the `requiredRoles`.
 */
export function roleSatisfiesAny(role: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.some((r) => roleSatisfies(role, r));
}

// ---------------------------------------------------------------------------
// Researcher-specific tier helpers
// ---------------------------------------------------------------------------

export type ResearcherVerificationLevel = "unverified" | "id_verified";
export type SubscriptionTier = "free" | "subscribed";

/** Free-tier limits enforced server-side. */
export const FREE_TIER_LIMITS = {
  /** Maximum number of active (non-closed) surveys a free researcher can have. */
  maxActiveSurveys: 3,
  /** Maximum responses per survey for a free researcher. */
  maxResponsesPerSurvey: 100,
} as const;

export function canResearcherSend(
  verificationLevel: ResearcherVerificationLevel,
): boolean {
  return verificationLevel === "id_verified";
}
