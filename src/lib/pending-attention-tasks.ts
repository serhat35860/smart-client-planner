import type { Prisma } from "@prisma/client";

/**
 * «Tamamlanamayanlar» süzgeci: bekleyen görevlerden yalnızca
 * tamamlanamama notu kayıtlı olanlar veya son tarihi geçmiş (gecikmiş) olanlar.
 */
export function pendingAttentionTaskWhere(workspaceId: string, now: Date): Prisma.TaskWhereInput {
  return {
    workspaceId,
    status: "PENDING",
    OR: [{ notCompletedReason: { not: null } }, { deadline: { lt: now } }]
  };
}
