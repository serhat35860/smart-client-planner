import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const standaloneStaticDir = path.join(standaloneRoot, ".next", "static");
const sourceStaticDir = path.join(projectRoot, ".next", "static");
const sourcePublicDir = path.join(projectRoot, "public");
const targetPublicDir = path.join(standaloneRoot, "public");

async function ensureStandaloneAssets() {
  await mkdir(standaloneStaticDir, { recursive: true });
  await cp(sourceStaticDir, standaloneStaticDir, { recursive: true });
  await cp(sourcePublicDir, targetPublicDir, { recursive: true });
}

ensureStandaloneAssets().then(
  () => {
    console.log("[desktop] Next standalone assets prepared.");
  },
  (error) => {
    console.error("[desktop] Failed to prepare standalone assets.");
    console.error(error);
    process.exit(1);
  }
);
