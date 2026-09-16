/**
 * Reports whether the schema the code expects is actually present.
 *
 * Migrations here are often applied by hand through the Supabase SQL editor, so
 * "did that migration land?" is a real question with no local answer. A missing
 * column surfaces at runtime as a PostgREST error inside whatever feature touched
 * it — the survey builder reporting a missing `description`, say — which reads as
 * an application bug rather than an unapplied migration.
 *
 * Goes through the Data API rather than a direct connection, so it needs only the
 * service-role key and works when SUPABASE_DB_URL is unavailable.
 */
import "../server/loadEnv.js";
import { admin } from "../server/lib/supabase.js";

/** One representative selection per migration, newest last. */
const EXPECTATIONS: { feature: string; table: string; select: string }[] = [
  { feature: "users", table: "users", select: "id,role,verification_tier,email,email_verified,is_banned" },
  { feature: "surveys", table: "surveys", select: "id,title,status,reward_etb,description,escrow_etb,builder_type,research_category,compliance_required" },
  { feature: "survey_responses", table: "survey_responses", select: "id,fraud_flag,fraud_signals" },
  { feature: "respondent_match_view", table: "respondent_match_view", select: "user_id,tier_rank" },
  { feature: "respondent_profiles", table: "respondent_profiles", select: "gender,region,city,employment_status,occupation,education_level,primary_language" },
  { feature: "researcher_profiles", table: "researcher_profiles", select: "institution,verification_status,subscription_tier" },
  { feature: "researcher_deposits", table: "researcher_deposits", select: "id,amount_etb,method,reference,verification_status,sender_detail,idempotency_key" },
  { feature: "respondent_payouts", table: "respondent_payouts", select: "id,amount_etb,status" },
  { feature: "respondent_withdrawals", table: "respondent_withdrawals", select: "id,amount_etb,status,method,reference,verification_status" },
  { feature: "compliance_category_rules", table: "compliance_category_rules", select: "id,name,requires_document" },
  { feature: "notifications", table: "notifications", select: "id,user_id,title,type,is_read,event_key" },
  { feature: "researcher_wallet_view", table: "researcher_wallet_view", select: "researcher_id,available_etb" },
  { feature: "respondent_wallet_view", table: "respondent_wallet_view", select: "respondent_id,available_etb" },
];

const missing = new Set<string>();

for (const { feature, table, select } of EXPECTATIONS) {
  const { error } = await admin.from(table).select(select).limit(1);

  if (error) {
    missing.add(feature);
    console.log(`  MISSING  [${feature}] ${table}: ${error.message}`);
  } else {
    console.log(`  ok       [${feature}] ${table}`);
  }
}

if (missing.size === 0) {
  console.log("\nSchema matches what the code expects.");
} else {
  const list = [...missing].sort().join(", ");
  console.log(
    `\nSchema element(s) missing: ${list}\n` +
      "Run `npm run migrate`, or paste supabase/schema.sql into the Supabase SQL editor.",
  );
  process.exitCode = 1;
}
