/**
 * Hafif sürüm öncesi kontrol (CPU/RAM dostu): Prisma, TypeScript, lint, birim testler.
 * — `next build` ve `electron:build` / `desktop:build` BURADA YOK: arka arkaya tam derleme
 *   bazı makinelerde sistemi kilitleyebiliyor. EXE için ayrı, müsait zamanda çalıştırın:
 *     npm run desktop:build
 * Tam web derlemesi: npm run build veya CI.
 */
import { spawnSync } from "node:child_process";

const root = process.cwd();

function run(label, command, args, env = {}) {
  console.log(`\n[release-check] ${label}…`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      CI: "true",
      JWT_SECRET: process.env.JWT_SECRET || "ci-local-jwt-secret-must-be-32-chars-min",
      DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
      ...env
    }
  });
  if (result.status !== 0) {
    console.error(`[release-check] FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

run("Prisma validate", "npx", ["prisma", "validate"]);
run("TypeScript (tsc --noEmit)", "npx", ["tsc", "--noEmit"]);
run("ESLint", "npm", ["run", "lint"]);
run("Vitest", "npx", ["vitest", "run"]);

console.log(
  "\n[release-check] Tamam. Ağır adımlar atlandı: production build ve EXE paketleme için sırayla (gerekirse makine boşken):\n" +
    "  npm run build\n" +
    "  npm run desktop:build"
);
