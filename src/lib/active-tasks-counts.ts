import { prisma } from "@/lib/prisma";

/** Bekleyen görevler: tümü ve tamamlanamadı nedeni kayıtlı olanlar. */
export async function getActiveTasksCounts(userId: string) {
  const [allPending, incompletePending] = await Promise.all([
    prisma.task.count({ where: { userId, status: "PENDING" } }),
    prisma.task.count({
      where: {
        userId,
        status: "PENDING",
        notCompletedReason: { not: null }
      }
    })
  ]);
  return { allPending, incompletePending };
}
