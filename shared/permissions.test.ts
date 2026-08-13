import { describe, expect, it } from "vitest";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  roleSatisfies,
  roleSatisfiesAny,
  canResearcherSend,
  canResearcherExport,
} from "./permissions.js";

describe("permissions module", () => {
  it("hasPermission checks single permissions", () => {
    expect(hasPermission("respondent", "respondent:fill_survey")).toBe(true);
    expect(hasPermission("respondent", "researcher:send_survey")).toBe(false);
  });

  it("hasAllPermissions checks for all", () => {
    expect(hasAllPermissions("researcher", ["researcher:create_draft", "researcher:send_survey"])).toBe(
      true,
    );
    expect(
      hasAllPermissions("researcher", ["researcher:create_draft", "admin:review_documents"]),
    ).toBe(false);
  });

  it("hasAnyPermission checks for any", () => {
    expect(hasAnyPermission("admin", ["admin:review_documents", "researcher:send_survey"])).toBe(true);
    expect(hasAnyPermission("respondent", ["admin:review_documents", "researcher:send_survey"])).toBe(
      false,
    );
  });

  it("roleSatisfies allows exact match", () => {
    expect(roleSatisfies("respondent", "respondent")).toBe(true);
    expect(roleSatisfies("researcher", "researcher")).toBe(true);
    expect(roleSatisfies("admin", "admin")).toBe(true);
    expect(roleSatisfies("super_admin", "super_admin")).toBe(true);
  });

  it("roleSatisfies allows super_admin to pass admin checks", () => {
    expect(roleSatisfies("super_admin", "admin")).toBe(true);
    expect(roleSatisfies("admin", "super_admin")).toBe(false);
  });

  it("roleSatisfies rejects unrelated roles", () => {
    expect(roleSatisfies("respondent", "researcher")).toBe(false);
    expect(roleSatisfies("admin", "respondent")).toBe(false);
  });

  it("roleSatisfiesAny checks against an array", () => {
    expect(roleSatisfiesAny("researcher", ["respondent", "researcher"])).toBe(true);
    expect(roleSatisfiesAny("admin", ["respondent", "researcher"])).toBe(false);

    // super_admin inheritance applies here too
    expect(roleSatisfiesAny("super_admin", ["respondent", "admin"])).toBe(true);
  });

  it("canResearcherSend enforces ID verification", () => {
    expect(canResearcherSend("unverified")).toBe(false);
    expect(canResearcherSend("id_verified")).toBe(true);
  });

  it("canResearcherExport requires BOTH ID verification AND active subscription", () => {
    expect(canResearcherExport("unverified", "free")).toBe(false);
    expect(canResearcherExport("unverified", "subscribed")).toBe(false);
    expect(canResearcherExport("id_verified", "free")).toBe(false);
    expect(canResearcherExport("id_verified", "subscribed")).toBe(true);
  });
});

