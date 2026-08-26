import { describe, expect, it } from "vitest";
import {
  isVerifyEtSupportedProvider,
  verifyTransaction,
  VERIFY_ET_SUPPORTED_PROVIDERS,
} from "./verifyEt.js";

describe("verify.et Transaction Reconciliation Service (v4 §4.6.1, §3.5, §7.4 item 12)", () => {
  it("supports all required Ethiopian payment rails and banks", () => {
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("telebirr");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("cbe");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("cbe_birr");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("boa");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("dashen");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("awash");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("siinqee");
    expect(VERIFY_ET_SUPPORTED_PROVIDERS).toContain("kaafi_ebirr");

    expect(isVerifyEtSupportedProvider("telebirr")).toBe(true);
    expect(isVerifyEtSupportedProvider("cbe")).toBe(true);
    expect(isVerifyEtSupportedProvider("bank_transfer")).toBe(false);
  });

  it("verifies matching transaction references in sandbox stub mode", async () => {
    const res = await verifyTransaction({
      provider: "telebirr",
      reference: "FT26123490X12",
      expectedAmount: 5000,
      senderDetail: "*8901",
    });

    expect(res.status).toBe("MATCH");
    expect(res.verified).toBe(true);
    expect(res.actualAmount).toBe(5000);
    expect(res.claimedAmount).toBe(5000);
    expect(res.providerRef).toBe("VET-FT26123490X12");
  });

  it("verifies matching CBE transaction references", async () => {
    const res = await verifyTransaction({
      provider: "cbe",
      reference: "CBE-TX-998822",
      expectedAmount: 10000,
      senderDetail: "10002345678",
    });

    expect(res.status).toBe("MATCH");
    expect(res.verified).toBe(true);
    expect(res.actualAmount).toBe(10000);
  });

  it("detects and flags mismatched deposit amounts (MISMATCH)", async () => {
    const res = await verifyTransaction({
      provider: "telebirr",
      reference: "MISMATCH-FT9900",
      expectedAmount: 5000,
    });

    expect(res.status).toBe("MISMATCH");
    expect(res.verified).toBe(false);
    expect(res.actualAmount).toBe(2500);
    expect(res.claimedAmount).toBe(5000);
    expect(res.message).toContain("does not match claimed deposit");
  });

  it("returns NOT_FOUND for unverified/missing transaction references", async () => {
    const res = await verifyTransaction({
      provider: "cbe",
      reference: "FAIL-INVALID-000",
      expectedAmount: 2000,
    });

    expect(res.status).toBe("NOT_FOUND");
    expect(res.verified).toBe(false);
    expect(res.message).toContain("was not found");
  });

  it("soft-fails unsupported providers into manual review queue", async () => {
    const res = await verifyTransaction({
      provider: "bank_transfer",
      reference: "WIRE-REF-9922",
      expectedAmount: 50000,
    });

    expect(res.status).toBe("UNSUPPORTED_PROVIDER");
    expect(res.verified).toBe(false);
    expect(res.requiresManualReview).toBe(true);
    expect(res.message).toContain("manual administrative reconciliation");
  });
});
