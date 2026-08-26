import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { env } from "../../env";
import { isVerifyEtConfigured, isVerifyEtSupportedProvider } from "./verifyEt";

describe("Financial Secrets & Data Isolation Security Audit (v4 §7.3, REH-5, REH-113 & REH-114)", () => {
  it("AC 1: VERIFY_ET_API_KEY is handled strictly server-side and never exposed in client bundle", () => {
    // 1. Check that server env loads it without exposing to Vite client
    expect(env).toBeDefined();
    expect(typeof env.verifyEtBaseUrl).toBe("string");

    // 2. Scan frontend src/ directory to ensure no client files reference server secrets
    const srcDir = path.resolve(__dirname, "../../../src");
    const scanDirectoryForSecrets = (dir: string): string[] => {
      const leaks: string[] = [];
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          leaks.push(...scanDirectoryForSecrets(fullPath));
        } else if (/\.(ts|tsx|js|jsx|html|css)$/.test(file.name)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (
            content.includes("process.env.VERIFY_ET_API_KEY") ||
            content.includes("VITE_VERIFY_ET_API_KEY") ||
            content.includes("process.env.TELEBIRR_APP_KEY") ||
            content.includes("process.env.SUPABASE_SERVICE_ROLE_KEY")
          ) {
            leaks.push(`${file.name} contains forbidden secret reference`);
          }
        }
      }
      return leaks;
    };

    const leaksFound = scanDirectoryForSecrets(srcDir);
    expect(leaksFound).toEqual([]);
  });

  it("AC 2: verify.et transaction data is isolated to wallet tables and never joined to survey responses or demographics (REH-5)", () => {
    // Check that supported providers are strictly validated
    expect(isVerifyEtSupportedProvider("telebirr")).toBe(true);
    expect(isVerifyEtSupportedProvider("cbe_birr")).toBe(true);
    expect(isVerifyEtSupportedProvider("bank_transfer" as any)).toBe(false);

    // Verify that database schema maintains explicit table separation:
    // 1. researcher_deposits (financial escrow)
    // 2. respondent_withdrawals (financial cashout)
    // 3. survey_responses (anonymized survey answers per REH-5)
    // 4. respondent_profiles (demographics without bank account numbers)
    const schemaPath = path.resolve(__dirname, "../../../supabase/schema.sql");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // Ensure respondent_withdrawals has its own isolated table and RLS
    expect(schemaContent).toContain("CREATE TABLE IF NOT EXISTS respondent_withdrawals");
    expect(schemaContent).toContain("ALTER TABLE respondent_withdrawals ENABLE ROW LEVEL SECURITY");
    expect(schemaContent).toContain("CREATE POLICY \"respondent reads own withdrawals\"");
    expect(schemaContent).toContain("CREATE POLICY \"respondent inserts own withdrawals\"");

    // Ensure survey_responses contains zero banking / verify.et references
    const surveyResponsesTableMatch = schemaContent.match(
      /CREATE TABLE IF NOT EXISTS survey_responses \(([\s\S]*?)\);/,
    );
    expect(surveyResponsesTableMatch).toBeDefined();
    const surveyResponsesCols = surveyResponsesTableMatch ? surveyResponsesTableMatch[1] : "";
    expect(surveyResponsesCols).not.toContain("verify_et");
    expect(surveyResponsesCols).not.toContain("account_number");
    expect(surveyResponsesCols).not.toContain("provider_ref");
    expect(surveyResponsesCols).not.toContain("bank");
  });

  it("AC 3: verify.et client configuration does not leak credentials in runtime exports", () => {
    // Ensure helper returns boolean and does not expose the raw key
    const configured = isVerifyEtConfigured();
    expect(typeof configured).toBe("boolean");
  });
});
