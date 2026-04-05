import { endOfDay, endOfMonth, endOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";

/** Bekleyen görevler: son tarih seçilen dönem sonuna kadar (dahil). Hafta Pazartesi başlar. */
export async function getPendingFollowupsCountsByPeriod(workspaceId: string) {
  const now = new Date();
  const dayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthEnd = endOfMonth(now);
  const base = { workspaceId, status: "PENDING" as const };
  const [daily, weekly, monthly] = await Promise.all([
    prisma.task.count({ where: { ...base, deadline: { lte: dayEnd } } }),
    prisma.task.count({ where: { ...base, deadline: { lte: weekEnd } } }),
    prisma.task.count({ where: { ...base, deadline: { lte: monthEnd } } })
  ]);
  return { daily, weekly, monthly };
}
