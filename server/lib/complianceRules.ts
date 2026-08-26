import { admin } from "./supabase.js";
import { STARTER_COMPLIANCE_RULES, type ComplianceCategoryRule } from "@shared/compliance/rules.js";

/**
 * Loads compliance category rules from the database table (compliance_category_rules),
 * with graceful fallback to STARTER_COMPLIANCE_RULES if the table has not yet been migrated.
 */
export async function getComplianceCategoryRules(): Promise<ComplianceCategoryRule[]> {
  try {
    const { data, error } = await admin
      .from("compliance_category_rules")
      .select("id, name, requires_document, description")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return [...STARTER_COMPLIANCE_RULES];
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      requires_document: Boolean(row.requires_document),
      description: row.description || "",
    }));
  } catch {
    return [...STARTER_COMPLIANCE_RULES];
  }
}
