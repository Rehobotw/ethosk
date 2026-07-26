/**
 * Pre-deploy guard from §17.3: confirms the service-role key never appears
 * anywhere that could ship to the browser bundle.
 *
 * The blueprint expresses this as a grep over app/. The React build's client
 * boundary is `src/`, so that is what this checks, plus the shared code that both
 * sides import.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const CLIENT_DIRS = ["src", "shared"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const FORBIDDEN = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE",
  "service_role",
  // The server-only Supabase module; importing it from src/ would bundle the key.
  "server/lib/supabase",
];

function walk(dir: string): string[] {
  const entries: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      entries.push(...walk(path));
    } else if (EXTENSIONS.has(extname(path))) {
      entries.push(path);
    }
  }
  return entries;
}

const violations: { file: string; line: number; text: string; term: string }[] = [];

for (const dir of CLIENT_DIRS) {
  let files: string[];
  try {
    files = walk(dir);
  } catch {
    continue;
  }

  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((text, index) => {
      for (const term of FORBIDDEN) {
        if (text.includes(term)) {
          violations.push({ file, line: index + 1, text: text.trim(), term });
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error("Service-role references found in client-reachable code:\n");
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}  [${violation.term}]`);
    console.error(`    ${violation.text}\n`);
  }
  console.error("The service-role key bypasses Row-Level Security and must stay server-side.");
  process.exit(1);
}

console.log("OK — no service-role references in src/ or shared/.");
