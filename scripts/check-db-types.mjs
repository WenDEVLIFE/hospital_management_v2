#!/usr/bin/env node
/**
 * Generates database types from the linked Supabase project and compares them
 * with the committed copy. Used by CI to fail on schema drift.
 *
 *   node scripts/check-db-types.mjs          # verify (default)
 *   node scripts/check-db-types.mjs --write  # regenerate the committed file
 *
 * Target selection: SUPABASE_PROJECT_REF (CI) or the linked project (local).
 * Authentication: SUPABASE_ACCESS_TOKEN in CI, stored CLI login locally.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUTPUT = resolve(process.cwd(), "types/database.generated.ts");
const writeMode = process.argv.includes("--write");

function resolveCli() {
  const probe = spawnSync("supabase", ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  return probe.status === 0 ? ["supabase"] : ["npx", "supabase"];
}

function generate() {
  const target = process.env.SUPABASE_PROJECT_REF
    ? ["--project-id", process.env.SUPABASE_PROJECT_REF]
    : ["--linked"];

  const [binary, ...prefix] = resolveCli();

  try {
    return execFileSync(
      binary,
      [...prefix, "gen", "types", "typescript", ...target, "--schema", "public"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
        shell: process.platform === "win32",
        maxBuffer: 64 * 1024 * 1024,
      }
    ).replace(/\r\n/g, "\n");
  } catch {
    console.error(
      "Could not generate database types. Check SUPABASE_ACCESS_TOKEN, " +
        "SUPABASE_PROJECT_REF, and network access."
    );
    process.exit(1);
  }
}

const generated = generate();

if (writeMode) {
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, generated, "utf8");
  console.log(`Wrote ${OUTPUT}`);
  process.exit(0);
}

if (!existsSync(OUTPUT)) {
  console.error(`Missing ${OUTPUT}. Run "npm run db:types" and commit the result.`);
  process.exit(1);
}

const committed = readFileSync(OUTPUT, "utf8").replace(/\r\n/g, "\n");

if (committed === generated) {
  console.log("Database types are in sync with the remote schema.");
  process.exit(0);
}

const current = committed.split("\n");
const fresh = generated.split("\n");
let line = 0;

while (line < current.length && line < fresh.length && current[line] === fresh[line]) {
  line += 1;
}

console.error(`Database types are out of date at line ${line + 1}.`);
console.error(`  committed: ${JSON.stringify(current[line] ?? "<end of file>")}`);
console.error(`  generated: ${JSON.stringify(fresh[line] ?? "<end of file>")}`);
console.error('Run "npm run db:types" and commit types/database.generated.ts.');
process.exit(1);
