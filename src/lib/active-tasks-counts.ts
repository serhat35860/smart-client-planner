import { prisma } from "@/lib/prisma";
import { pendingAttentionTaskWhere } from "@/lib/pending-attention-tasks";

/** Bekleyen, «tamamlanamayanlar» (not + gecikme) ve tamamlanmış sayıları. */
export async function getActiveTasksCounts(workspaceId: string) {
  const now = new Date();
  const [allPending, incompletePending, completedCount] = await Promise.all([
    prisma.task.count({ where: { workspaceId, status: "PENDING" } }),
    prisma.task.count({ where: pendingAttentionTaskWhere(workspaceId, now) }),
    prisma.task.count({ where: { workspaceId, status: "DONE" } })
  ]);
  return { allPending, incompletePending, completedCount };
}
