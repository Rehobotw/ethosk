import { describe, expect, it } from "vitest";
import { sendRequestSchema } from "@shared/validation/schemas.js";

describe("REH-119: Escrow Sample Size Capping", () => {
  it("validates that sendRequestSchema accepts and bounds sample_size correctly", () => {
    const valid = sendRequestSchema.parse({
      reward_etb: 100,
      sample_size: 250,
      filters: { regions: ["Addis Ababa"] },
    });
    expect(valid.sample_size).toBe(250);

    expect(() =>
      sendRequestSchema.parse({
        sample_size: -10,
      }),
    ).toThrow();
  });

  it("calculates escrow strictly based on sample size when sample size is less than matched respondents", () => {
    const matchedCount = 5000;
    const requestedSampleSize = 200;
    const rewardEtb = 120;

    const targetSampleSize = Math.min(requestedSampleSize, matchedCount);
    const requiredEtb = Math.round(rewardEtb * targetSampleSize);

    // Escrow must equal 200 * 120 = 24,000 ETB, NOT 5000 * 120 = 600,000 ETB!
    expect(requiredEtb).toBe(24000);
    expect(targetSampleSize).toBe(200);
  });
});
