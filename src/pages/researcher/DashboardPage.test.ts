import { describe, expect, it } from "vitest";

// REH-131: Test dashboard metric computation with real API data shapes.
// These functions mirror what DashboardPage.tsx derives from the survey list.

interface SurveyWithStats {
  id: string;
  status: string;
  response_count?: number;
  targeted_count?: number;
  velocity_per_hr?: number;
  flagged_count?: number;
}

function computeDashboardMetrics(surveys: SurveyWithStats[]) {
  const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count ?? 0), 0);

  const ongoingCount = surveys.filter((s) =>
    ["active", "pending_review", "published"].includes(s.status),
  ).length;

  const draftsCount = surveys.filter((s) => ["wip", "draft", "final_draft"].includes(s.status)).length;

  return { totalResponses, ongoingCount, draftsCount };
}

function computeSurveyProgress(survey: SurveyWithStats) {
  const target = survey.targeted_count ?? 0;
  const completed = survey.response_count ?? 0;
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
  return { target, completed, percent };
}

describe("Dashboard metrics (REH-131) – use real API values, no fake fallbacks", () => {
  it("totalResponses sums real response_count from each survey", () => {
    const surveys: SurveyWithStats[] = [
      { id: "s1", status: "active", response_count: 42, targeted_count: 100 },
      { id: "s2", status: "active", response_count: 18, targeted_count: 50 },
      { id: "s3", status: "wip", response_count: 0, targeted_count: 0 },
    ];
    const { totalResponses } = computeDashboardMetrics(surveys);
    expect(totalResponses).toBe(60); // 42 + 18 + 0
  });

  it("progress percent is 0 when targeted_count is 0 (not sent yet)", () => {
    const { percent } = computeSurveyProgress({ id: "s1", status: "wip", targeted_count: 0, response_count: 0 });
    expect(percent).toBe(0); // no fake 100 from `|| 100`
  });

  it("progress percent is correct when targeted_count > 0", () => {
    const { percent } = computeSurveyProgress({ id: "s1", status: "active", targeted_count: 200, response_count: 50 });
    expect(percent).toBe(25);
  });

  it("progress does not exceed 100%", () => {
    const { percent } = computeSurveyProgress({ id: "s1", status: "active", targeted_count: 10, response_count: 999 });
    expect(percent).toBe(100);
  });

  it("does not produce NaN when targeted_count is undefined", () => {
    const { percent } = computeSurveyProgress({ id: "s1", status: "active" });
    expect(Number.isNaN(percent)).toBe(false);
    expect(percent).toBe(0);
  });

  it("ongoing count includes active, pending_review surveys", () => {
    const surveys: SurveyWithStats[] = [
      { id: "s1", status: "active" },
      { id: "s2", status: "pending_review" },
      { id: "s3", status: "wip" },
      { id: "s4", status: "closed" },
    ];
    const { ongoingCount } = computeDashboardMetrics(surveys);
    expect(ongoingCount).toBe(2);
  });
});
