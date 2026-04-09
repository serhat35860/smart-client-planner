#!/usr/bin/env node
/**
 * Windows: belirtilen portta LISTENING olan süreçleri sonlandırır (varsayılan 3022 = Next dev).
 * Prisma query_engine EPERM kilitlerini giderir; IDE Node süreçlerine dokunmaz.
 */
import { execSync, spawnSync } from "node:child_process";
import process from "node:process";

const port = process.env.DEV_NEXT_PORT ?? "3022";

function stopWindowsByNetstat() {
  const out = execSync("netstat -ano", { encoding: "utf8" });
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes(`:${port}`) || !/LISTENING/i.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) pids.add(last);
  }
  if (pids.size === 0) {
    console.log(`[stop-dev-locks] Port ${port} üzerinde dinleyen süreç yok.`);
    return;
  }
  for (const pid of pids) {
    console.log(`[stop-dev-locks] taskkill /PID ${pid} /T /F`);
    spawnSync("taskkill", ["/PID", pid, "/T", "/F"], { stdio: "inherit" });
  }
}

function main() {
  if (process.platform !== "win32") {
    console.log("[stop-dev-locks] Windows dışında atlandı; dev sürecini elle durdurun.");
    process.exit(0);
    return;
  }
  try {
    stopWindowsByNetstat();
  } catch (e) {
    console.warn("[stop-dev-locks]", e?.message ?? e);
    process.exitCode = 1;
    return;
  }
  console.log("[stop-dev-locks] Tamam.");
}

main();
