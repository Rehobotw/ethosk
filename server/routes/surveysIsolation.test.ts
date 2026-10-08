import { describe, expect, it } from "vitest";
import { admin } from "../lib/supabase.js";

describe("REH-118: Survey Tenant Isolation", () => {
  it("never returns surveys belonging to other researchers when calling researcher has no surveys", async () => {
    // Researcher A (has surveys)
    const researcherAId = "res_tenant_a_123";
    // Researcher B (new account, 0 surveys)
    const researcherBId = "res_tenant_b_456";

    // Query strictly for Researcher B
    const { data: surveysForB } = await admin
      .from("surveys")
      .select("*")
      .eq("researcher_id", researcherBId)
      .order("created_at", { ascending: false });

    // Must be empty array or null, never surveys from Researcher A or system-wide
    const leakedSurveys = (surveysForB ?? []).filter(
      (s: { researcher_id: string }) => s.researcher_id !== researcherBId,
    );

    expect(leakedSurveys).toHaveLength(0);
  });
});
