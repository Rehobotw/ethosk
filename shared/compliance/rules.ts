/**
 * Research Legal & Ethical Compliance Rules (Spec v4 §7.4 item 1, §5, §7.1)
 *
 * Config/data-driven compliance rule engine for evaluating whether a declared
 * research category requires an approval/clearance document.
 */

export interface ComplianceCategoryRule {
  id: string;
  name: string;
  requires_document: boolean;
  description: string;
}

/**
 * Starter list of compliance category rules (v4 §7.4 item 1).
 * Used as default/fallback when database records are loaded or in offline mode.
 */
export const STARTER_COMPLIANCE_RULES: readonly ComplianceCategoryRule[] = [
  {
    id: "human_subjects",
    name: "Human-subjects research",
    requires_document: true,
    description: "Studies involving interaction with human participants or identifiable private data require IRB / ethical clearance.",
  },
  {
    id: "health_medical",
    name: "Health/medical studies",
    requires_document: true,
    description: "Health and medical studies require formal medical or health research ethics committee clearance.",
  },
  {
    id: "minors",
    name: "Studies involving minors",
    requires_document: true,
    description: "Studies involving minors (<18) require institutional and ethical compliance clearance.",
  },
  {
    id: "financial_data",
    name: "Financial-data collection",
    requires_document: true,
    description: "Financial data collection studies require institutional regulatory and data privacy clearance.",
  },
  {
    id: "market_consumer",
    name: "Market & Consumer Research",
    requires_document: false,
    description: "General consumer preference, brand perception, and market trends research.",
  },
  {
    id: "social_science",
    name: "Social Science & Public Opinion",
    requires_document: false,
    description: "General public sentiment, sociological inquiries, and non-sensitive social research.",
  },
  {
    id: "education_academic",
    name: "General Education & Academic Feedback",
    requires_document: false,
    description: "Course evaluations, academic feedback, and pedagogical methodology surveys.",
  },
  {
    id: "product_usability",
    name: "Product Usability & UI/UX Testing",
    requires_document: false,
    description: "Software usability, user interface feedback, and product experience studies.",
  },
  {
    id: "agriculture_rural",
    name: "Agriculture & Rural Development",
    requires_document: false,
    description: "Agricultural practices, rural development surveys, and farming technique feedback.",
  },
  {
    id: "other",
    name: "General / Other Research",
    requires_document: false,
    description: "Other non-sensitive research topics.",
  },
] as const;

export interface ComplianceEvaluationResult {
  compliance_required: boolean;
  rule_triggered: string | null;
  rule_name: string | null;
  description: string | null;
}

/**
 * Evaluates a research category against active compliance rules.
 * Matches either by rule id (e.g. 'health_medical') or by rule name (e.g. 'Health/medical studies').
 */
export function evaluateCategoryCompliance(
  category: string | null | undefined,
  rules: readonly ComplianceCategoryRule[] = STARTER_COMPLIANCE_RULES,
): ComplianceEvaluationResult {
  if (!category || !category.trim()) {
    return {
      compliance_required: false,
      rule_triggered: null,
      rule_name: null,
      description: null,
    };
  }

  const normalized = category.trim().toLowerCase();

  const matchedRule = rules.find(
    (r) =>
      r.id.toLowerCase() === normalized ||
      r.name.toLowerCase() === normalized ||
      r.id.replace(/_/g, " ").toLowerCase() === normalized,
  );

  if (matchedRule && matchedRule.requires_document) {
    return {
      compliance_required: true,
      rule_triggered: matchedRule.id,
      rule_name: matchedRule.name,
      description: matchedRule.description,
    };
  }

  return {
    compliance_required: false,
    rule_triggered: null,
    rule_name: matchedRule?.name ?? category,
    description: matchedRule?.description ?? null,
  };
}
