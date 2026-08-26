import { describe, expect, it } from "vitest";
import {
  STARTER_COMPLIANCE_RULES,
  evaluateCategoryCompliance,
  type ComplianceCategoryRule,
} from "./rules.js";

describe("Research Legal & Ethical Compliance Rules Engine (§7.4 item 1, §5, §7.1)", () => {
  it("contains all 4 starter categories that require compliance clearance documents", () => {
    const requiredRules = STARTER_COMPLIANCE_RULES.filter((r) => r.requires_document);
    const requiredIds = requiredRules.map((r) => r.id);

    expect(requiredIds).toContain("human_subjects");
    expect(requiredIds).toContain("health_medical");
    expect(requiredIds).toContain("minors");
    expect(requiredIds).toContain("financial_data");
    expect(requiredRules.length).toBe(4);
  });

  it("auto-determines compliance_required = true for 'Human-subjects research'", () => {
    const resId = evaluateCategoryCompliance("human_subjects");
    expect(resId.compliance_required).toBe(true);
    expect(resId.rule_triggered).toBe("human_subjects");
    expect(resId.rule_name).toBe("Human-subjects research");

    const resName = evaluateCategoryCompliance("Human-subjects research");
    expect(resName.compliance_required).toBe(true);
    expect(resName.rule_triggered).toBe("human_subjects");
  });

  it("auto-determines compliance_required = true for 'Health/medical studies'", () => {
    const resId = evaluateCategoryCompliance("health_medical");
    expect(resId.compliance_required).toBe(true);
    expect(resId.rule_triggered).toBe("health_medical");

    const resName = evaluateCategoryCompliance("Health/medical studies");
    expect(resName.compliance_required).toBe(true);
    expect(resName.rule_triggered).toBe("health_medical");
  });

  it("auto-determines compliance_required = true for 'Studies involving minors'", () => {
    const resId = evaluateCategoryCompliance("minors");
    expect(resId.compliance_required).toBe(true);
    expect(resId.rule_triggered).toBe("minors");

    const resName = evaluateCategoryCompliance("Studies involving minors");
    expect(resName.compliance_required).toBe(true);
    expect(resName.rule_triggered).toBe("minors");
  });

  it("auto-determines compliance_required = true for 'Financial-data collection'", () => {
    const resId = evaluateCategoryCompliance("financial_data");
    expect(resId.compliance_required).toBe(true);
    expect(resId.rule_triggered).toBe("financial_data");

    const resName = evaluateCategoryCompliance("Financial-data collection");
    expect(resName.compliance_required).toBe(true);
    expect(resName.rule_triggered).toBe("financial_data");
  });

  it("auto-determines compliance_required = false for non-restricted categories", () => {
    const categories = [
      "market_consumer",
      "Market & Consumer Research",
      "social_science",
      "education_academic",
      "product_usability",
      "agriculture_rural",
      "other",
    ];

    for (const cat of categories) {
      const res = evaluateCategoryCompliance(cat);
      expect(res.compliance_required).toBe(false);
      expect(res.rule_triggered).toBeNull();
    }
  });

  it("handles custom dynamic rule configuration amendments (living list requirement)", () => {
    const customRules: ComplianceCategoryRule[] = [
      ...STARTER_COMPLIANCE_RULES,
      {
        id: "biometric_data",
        name: "Biometric Data Collection",
        requires_document: true,
        description: "Requires national privacy commissioner authorization.",
      },
    ];

    const res = evaluateCategoryCompliance("biometric_data", customRules);
    expect(res.compliance_required).toBe(true);
    expect(res.rule_triggered).toBe("biometric_data");
    expect(res.rule_name).toBe("Biometric Data Collection");
  });

  it("returns clean fallback for empty / missing category", () => {
    expect(evaluateCategoryCompliance(null).compliance_required).toBe(false);
    expect(evaluateCategoryCompliance("").compliance_required).toBe(false);
    expect(evaluateCategoryCompliance(undefined).compliance_required).toBe(false);
  });
});
