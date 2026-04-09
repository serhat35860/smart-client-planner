import fs from "node:fs";
import path from "node:path";

function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const content = fs.readFileSync(filepath, "utf8");
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function resolveEnv() {
  const root = process.cwd();
  const env = parseEnvFile(path.join(root, ".env"));
  const envLocal = parseEnvFile(path.join(root, ".env.local"));
  return { ...env, ...envLocal, ...process.env };
}

const env = resolveEnv();
const requiredKeys = ["JWT_SECRET", "DATABASE_URL"];
const missing = requiredKeys.filter((key) => !env[key] || String(env[key]).trim().length === 0);

if (missing.length > 0) {
  console.error(
    `[dev-env] Missing required variables: ${missing.join(", ")}. ` +
      "Copy .env.example to .env and set values."
  );
  process.exit(1);
}

const jwtSecret = String(env.JWT_SECRET ?? "");
if (jwtSecret.includes("change-me")) {
  console.warn("[dev-env] JWT_SECRET uses default placeholder; replace it for shared/staging/production.");
}
if (jwtSecret.length < 32) {
  console.warn("[dev-env] JWT_SECRET should be at least 32 characters.");
}

const dbUrl = String(env.DATABASE_URL ?? "");

/** Yerelde şema SQLite; postgres URL genelde .env.local kalıntısı. CI/Vercel (Postgres) için muafiyet. */
const isPostgresUrl = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
const isCiOrVercel = process.env.VERCEL === "1" || process.env.CI === "true";
if (isPostgresUrl && !isCiOrVercel) {
  console.error(
    "[dev-env] DATABASE_URL postgresql/postgres ile tanımlı; bu repo Prisma şeması şu an SQLite kullanıyor.\n" +
      "  → .env.local içindeki DATABASE_URL satırını kaldırın veya yorumlayın.\n" +
      "  → Yerel için .env içinde DATABASE_URL=\"file:./dev.db\" (dosya: prisma/dev.db).\n" +
      "  → Üretim Postgres + Prisma provider geçişi için docs/deploy-setup.md bölümüne bakın.\n" +
      "[dev-env] Remove postgres DATABASE_URL from .env.local for local dev; use file:./dev.db in .env."
  );
  process.exit(1);
}
if (isPostgresUrl && isCiOrVercel) {
  console.warn(
    "[dev-env] Postgres DATABASE_URL (CI/Vercel). Şema hâlâ SQLite ise build/migrate uyumsuz olur; Postgres için şema geçişi gerekir."
  );
}

/** ./prisma/dev.db şema klasörüne göre prisma/prisma/dev.db üretir. */
const dbUrlNorm = dbUrl.trim().replaceAll("\\", "/");
if (dbUrlNorm === "file:./prisma/dev.db" || dbUrlNorm.endsWith("/prisma/prisma/dev.db")) {
  console.error(
    "[dev-env] DATABASE_URL=file:./prisma/dev.db yanlış yol (prisma/prisma/dev.db oluşur).\n" +
      "  → Bunun yerine: DATABASE_URL=\"file:./dev.db\" → prisma/dev.db\n" +
      "[dev-env] Use DATABASE_URL=file:./dev.db for prisma/dev.db."
  );
  process.exit(1);
}

if (!dbUrl.startsWith("file:")) {
  console.warn("[dev-env] DATABASE_URL looks unusual; expected file:... for SQLite.");
}

console.log("[dev-env] Environment validation passed.");
