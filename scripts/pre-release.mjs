#!/usr/bin/env node
/**
 * Sürüm / installer öncesi: (Win) dev kilidi → .next temizliği → release:check → production build.
 * Ortam: DATABASE_URL ve JWT_SECRET yoksa CI ile uyumlu varsayılanlar kullanılır.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function run(cmd, args, extraEnv = {}) {
  console.log(`\n[pre-release] ${cmd} ${args.join(" ")}\n`);
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
    JWT_SECRET:
      process.env.JWT_SECRET ??
      "ci-local-jwt-secret-must-be-32-chars-min",
    ...extraEnv
  };
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false, env });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const stopLocks = path.join(root, "scripts", "stop-dev-locks.mjs");
const clearCache = path.join(root, "scripts", "clear-next-cache.mjs");

if (process.platform === "win32") {
  run(process.execPath, [stopLocks]);
}
run(process.execPath, [clearCache]);
run(npmCmd, ["run", "release:check"]);
run(npmCmd, ["run", "build"]);

console.log("\n[pre-release] Tüm adımlar tamam.\n");
