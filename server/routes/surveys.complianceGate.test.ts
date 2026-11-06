import { describe, expect, it } from "vitest";

// Unit test the compliance gate logic independently.
// The full integration test would require a running Supabase instance, so we
// test the decision function in isolation here.

function complianceDocumentGate(
  input: { compliance_required?: boolean; compliance_document_path?: string | null },
  survey: { compliance_required: boolean | null; compliance_document_path: string | null },
): { blocked: boolean; reason?: string } {
  const effectiveComplianceRequired =
    input.compliance_required !== undefined
      ? input.compliance_required
      : (survey.compliance_required ?? false);

  const effectiveDocPath =
    input.compliance_document_path !== undefined
      ? input.compliance_document_path
      : survey.compliance_document_path;

  if (effectiveComplianceRequired && !effectiveDocPath) {
    return {
      blocked: true,
      reason:
        "COMPLIANCE_DOCUMENT_REQUIRED: This research category requires an ethics/IRB clearance document.",
    };
  }
  return { blocked: false };
}

describe("REH-129: compliance document gate logic", () => {
  it("blocks when compliance_required=true and no document on survey or input", () => {
    const result = complianceDocumentGate(
      { compliance_required: true, compliance_document_path: null },
      { compliance_required: true, compliance_document_path: null },
    );
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("COMPLIANCE_DOCUMENT_REQUIRED");
  });

  it("allows when compliance_required=true and document path in input", () => {
    const result = complianceDocumentGate(
      { compliance_required: true, compliance_document_path: "uploads/irb_approval.pdf" },
      { compliance_required: true, compliance_document_path: null },
    );
    expect(result.blocked).toBe(false);
  });

  it("allows when compliance_required=true and document already on survey record", () => {
    const result = complianceDocumentGate(
      { compliance_required: true },
      { compliance_required: true, compliance_document_path: "uploads/existing_irb.pdf" },
    );
    expect(result.blocked).toBe(false);
  });

  it("allows when compliance_required=false (no doc needed)", () => {
    const result = complianceDocumentGate(
      { compliance_required: false },
      { compliance_required: false, compliance_document_path: null },
    );
    expect(result.blocked).toBe(false);
  });

  it("allows when input overrides survey compliance_required to false", () => {
    // researcher explicitly says no compliance required for this category
    const result = complianceDocumentGate(
      { compliance_required: false },
      { compliance_required: true, compliance_document_path: null },
    );
    expect(result.blocked).toBe(false);
  });

  it("blocks when survey.compliance_required=true but input omits it and no doc", () => {
    // input does not pass compliance_required - inherits from survey
    const result = complianceDocumentGate(
      {},
      { compliance_required: true, compliance_document_path: null },
    );
    expect(result.blocked).toBe(true);
  });
});
