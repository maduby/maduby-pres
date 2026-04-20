#!/usr/bin/env node
/**
 * One-off: push selected env vars from .env.local to Vercel Production.
 * Run from repo root: node scripts/sync-vercel-production-env.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = parseEnv(join(root, ".env.local"));

// Must match the `id` of the row in Supabase Table Editor (production deck).
env.NEXT_PUBLIC_AUDIENCE_URL =
  env.NEXT_PUBLIC_AUDIENCE_URL || "https://whois.duby.io";

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_DECK_SESSION_ID",
  "NEXT_PUBLIC_AUDIENCE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PRESENTER_SECRET",
];

/** @type {Record<string, boolean>} */
const sensitive = {
  SUPABASE_SERVICE_ROLE_KEY: true,
  PRESENTER_SECRET: true,
};

function vercelBase() {
  return ["--non-interactive", "env"];
}

/** @param {string[]} args */
function vercel(args) {
  const r = spawnSync("vercel", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

for (const key of keys) {
  const val = env[key];
  if (val === undefined || val === "") {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
  vercel([...vercelBase(), "rm", key, "production", "--yes"]);
  const addArgs = [
    ...vercelBase(),
    "add",
    key,
    "production",
    "--value",
    val,
    "--yes",
  ];
  if (sensitive[key]) addArgs.push("--sensitive");
  const status = vercel(addArgs);
  if (status !== 0) process.exit(status);
  console.error(`OK: ${key}`);
}

console.error("Done. Redeploy production so NEXT_PUBLIC_* are baked into the build.");
