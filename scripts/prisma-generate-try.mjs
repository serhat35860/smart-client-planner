/**
 * Windows'ta başka Node/Electron/antivirüs Prisma DLL'ini kilitlediğinde
 * `prisma generate` EPERM ile düşer; `npm run dev` hiç başlamaz.
 * Bu script başarısızlıkta uyarı verir ve çıkış 0 ile devam edilir (mevcut client ile çoğu zaman yeterli).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const enginePath = path.join(
  root,
  "node_modules",
  ".prisma",
  "client",
  "query_engine-windows.dll.node"
);

const result = spawnSync("npx", ["prisma", "generate"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env }
});

if (result.status === 0) {
  process.exit(0);
}

console.error("\n[prisma] generate başarısız (çoğunlukla EPERM: DLL kilitli — başka Node/Electron/antivirüs).");
console.error("  → Tüm Node / Electron / npm run dev süreçlerini kapatıp tekrar deneyin.");
console.error("  → Sonra: npx prisma generate");
console.error("  → Geliştirme: npm run dev:bare  (generate atlanır)\n");

if (!existsSync(enginePath)) {
  console.error("[prisma] Engine dosyası yok; build/dev çalışmayabilir. Kilidi kaldırıp npx prisma generate çalıştırın.\n");
  process.exit(1);
}

process.exit(0);
