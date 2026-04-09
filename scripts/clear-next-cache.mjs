#!/usr/bin/env node
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const nextDir = join(process.cwd(), ".next");
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("[clear-next-cache] .next kaldırıldı.");
} else {
  console.log("[clear-next-cache] .next yok, atlandı.");
}
