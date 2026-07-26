/**
 * Applies the SQL files in `supabase/migrations` in filename order.
 *
 * Every migration runs inside a transaction and is recorded in a
 * `schema_migrations` table, so re-running this applies only what is new. The
 * files are also written to be idempotent on their own, which means a migration
 * interrupted halfway can simply be run again.
 *
 * Uses `SUPABASE_DB_URL` — the direct Postgres connection — because schema
 * changes cannot go through the Data API.
 */
import "../server/loadEnv.js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error(
    "Set SUPABASE_DB_URL in .env.local. It is the direct connection string from\n" +
      "Supabase → Project Settings → Database. Percent-encode any special\n" +
      "characters in the password (@ becomes %40).",
  );
  process.exit(1);
}

// Supabase terminates unencrypted connections, and the pooler presents a
// certificate that does not match the host it is reached on.
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main(): Promise<void> {
  await client.connect();

  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const { rows } = await client.query<{ filename: string }>("select filename from schema_migrations");
  const applied = new Set(rows.map((row) => row.filename));

  const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql")).sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  let ran = 0;

  for (const filename of files) {
    if (applied.has(filename)) {
      console.log(`  skip   ${filename}`);
      continue;
    }

    const sql = await readFile(path.join(MIGRATIONS_DIR, filename), "utf8");

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [filename]);
      await client.query("commit");
      console.log(`  applied ${filename}`);
      ran += 1;
    } catch (error) {
      await client.query("rollback");
      throw new Error(`${filename} failed: ${(error as Error).message}`);
    }
  }

  console.log(ran === 0 ? "\nSchema already up to date." : `\nApplied ${ran} migration(s).`);
}

main()
  .catch((error) => {
    console.error(`\nMigration failed: ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => client.end());
