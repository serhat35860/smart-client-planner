import type { Prisma } from "@prisma/client";

const OPEN_TASK_STATUSES = ["PENDING", "FAILED"] as const;

/**
 * «Tamamlanamayanlar» süzgeci: bekleyen görevlerden yalnızca
 * tamamlanamama notu kayıtlı olanlar veya son tarihi geçmiş (gecikmiş) olanlar.
 */
export function pendingAttentionTaskWhere(workspaceId: string, now: Date): Prisma.TaskWhereInput {
  return {
    workspaceId,
    status: { in: [...OPEN_TASK_STATUSES] },
    OR: [{ notCompletedReason: { not: null } }, { deadline: { lt: now } }]
  };
}
