import { describe, expect, it } from "vitest";
import { NAV_PATHS, isNavActive } from "./researcherNav";

/**
 * The property that matters is not which item is active but that exactly one is.
 * Two highlighted items tell the researcher nothing about where they are, and the
 * nested `/researcher/surveys/new` path makes that easy to reintroduce.
 */
function activeCount(pathname: string): number {
  return NAV_PATHS.filter((to) => isNavActive(pathname, to)).length;
}

describe("isNavActive", () => {
  it.each([
    "/researcher",
    "/researcher/surveys",
    "/researcher/surveys/new",
    "/researcher/surveys/new/manual",
    "/researcher/surveys/new/import",
    "/researcher/surveys/new/ai",
    "/researcher/surveys/abc-123/edit",
    "/researcher/surveys/abc-123/dashboard",
    "/researcher/wallet",
    "/researcher/settings",
  ])("highlights exactly one item on %s", (pathname) => {
    expect(activeCount(pathname)).toBe(1);
  });

  it("does not highlight the survey list while creating a new survey", () => {
    expect(isNavActive("/researcher/surveys/new", "/researcher/surveys")).toBe(false);
    expect(isNavActive("/researcher/surveys/new", "/researcher/surveys/new")).toBe(true);
  });

  it("highlights the survey list when editing or reviewing one", () => {
    expect(isNavActive("/researcher/surveys/abc/edit", "/researcher/surveys")).toBe(true);
    expect(isNavActive("/researcher/surveys/abc/dashboard", "/researcher/surveys")).toBe(true);
  });

  it("keeps the dashboard exact, so it does not claim every researcher page", () => {
    expect(isNavActive("/researcher", "/researcher")).toBe(true);
    expect(isNavActive("/researcher/wallet", "/researcher")).toBe(false);
    expect(isNavActive("/researcher/surveys", "/researcher")).toBe(false);
  });

  it("highlights the Survey Builder for /surveys/new sub-routes (manual, import, ai)", () => {
    for (const sub of ["/researcher/surveys/new/manual", "/researcher/surveys/new/import", "/researcher/surveys/new/ai"]) {
      expect(isNavActive(sub, "/researcher/surveys/new")).toBe(true);
      expect(isNavActive(sub, "/researcher/surveys")).toBe(false);
    }
  });
});
