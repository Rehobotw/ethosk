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
const EXPECTATIONS: { migration: string; table: string; select: string }[] = [
  { migration: "0001", table: "users", select: "id,role,verification_tier,email,email_verified" },
  { migration: "0001", table: "surveys", select: "id,title,status,reward_etb" },
  { migration: "0001", table: "survey_responses", select: "id,fraud_flag,fraud_signals" },
  { migration: "0001", table: "respondent_match_view", select: "user_id,tier_rank" },
  { migration: "0002", table: "surveys", select: "description,escrow_etb" },
  {
    migration: "0002",
    table: "respondent_profiles",
    select: "gender,region,city,employment_status,occupation,education_level,primary_language",
  },
  { migration: "0002", table: "researcher_profiles", select: "institution" },
  { migration: "0002", table: "researcher_deposits", select: "id,amount_etb,method,reference" },
  { migration: "0002", table: "respondent_payouts", select: "id,amount_etb,status" },
  { migration: "0002", table: "researcher_wallet_view", select: "researcher_id,available_etb" },
  { migration: "0002", table: "respondent_wallet_view", select: "respondent_id,available_etb" },
];

const missing = new Set<string>();

for (const { migration, table, select } of EXPECTATIONS) {
  const { error } = await admin.from(table).select(select).limit(1);

  if (error) {
    missing.add(migration);
    console.log(`  MISSING  [${migration}] ${table}: ${error.message}`);
  } else {
    console.log(`  ok       [${migration}] ${table}`);
  }
}

if (missing.size === 0) {
  console.log("\nSchema matches what the code expects.");
} else {
  const list = [...missing].sort().join(", ");
  console.log(
    `\nMigration(s) not applied: ${list}\n` +
      "Run `npm run migrate`, or paste the matching file from supabase/migrations\n" +
      "into the Supabase SQL editor. Each one is idempotent.",
  );
  process.exitCode = 1;
}
