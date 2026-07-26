/**
 * Finds the IPv4 connection string for this project.
 *
 * Supabase's direct host (`db.<ref>.supabase.co`) is IPv6-only. On a machine with
 * no IPv6 route it cannot be reached at all, so migrations have to go through
 * Supavisor at `aws-0-<region>.pooler.supabase.com`, which is dual-stack.
 *
 * The region is not derivable from the project ref, so this tries the plausible
 * ones and reports which accepts a connection. It prints the working host and
 * region only — never the password.
 */
import "../server/loadEnv.js";
import { Client } from "pg";

const raw = process.env.SUPABASE_DB_URL;

if (!raw) {
  console.error("SUPABASE_DB_URL is not set in .env.local.");
  process.exit(1);
}

const parsed = new URL(raw);
const projectRef = parsed.hostname.replace(/^db\./, "").replace(/\.supabase\.co$/, "");
const password = decodeURIComponent(parsed.password);

// The project's IPv6 address sits in an AWS Europe range, so European regions are
// tried first; the rest follow so this still works if that guess is wrong.
const REGIONS = [
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "eu-central-2",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ca-central-1",
  "sa-east-1",
];

console.log(`project ref: ${projectRef}\n`);

for (const region of REGIONS) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  // Session mode on 5432: transaction mode on 6543 cannot run DDL.
  const client = new Client({
    host,
    port: 5432,
    user: `postgres.${projectRef}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    const { rows } = await client.query<{ version: string }>("select version()");
    await client.end();

    console.log(`FOUND  ${region}`);
    console.log(`host   ${host}`);
    console.log(`user   postgres.${projectRef}`);
    console.log(`server ${rows[0]?.version?.slice(0, 40)}…`);
    console.log(
      `\nSet this in .env.local (password unchanged, still percent-encoded):\n` +
        `SUPABASE_DB_URL=postgresql://postgres.${projectRef}:<password>@${host}:5432/postgres`,
    );
    process.exit(0);
  } catch (error) {
    const message = (error as Error).message;
    // A wrong region refuses the tenant; anything else is worth showing.
    const terse = message.includes("Tenant or user not found")
      ? "not this region"
      : message.slice(0, 60);
    console.log(`  ${region.padEnd(16)} ${terse}`);
    await client.end().catch(() => {});
  }
}

console.error("\nNo region accepted the connection.");
process.exit(1);
