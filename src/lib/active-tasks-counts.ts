import { prisma } from "@/lib/prisma";
import { pendingAttentionTaskWhere } from "@/lib/pending-attention-tasks";
import type { WorkspaceRole } from "@prisma/client";
import { workspaceTasksVisibleWhere } from "@/lib/workspace";

/** Bekleyen, «tamamlanamayanlar» (not + gecikme) ve tamamlanmış sayıları. */
export async function getActiveTasksCounts(workspaceId: string, role: WorkspaceRole, userId: string) {
  const now = new Date();
  const visibleBase = workspaceTasksVisibleWhere(workspaceId, role, userId);
  const [allPending, incompletePending, completedCount] = await Promise.all([
    prisma.task.count({ where: { ...visibleBase, status: "PENDING" } }),
    prisma.task.count({ where: { ...pendingAttentionTaskWhere(workspaceId, now), ...visibleBase } }),
    prisma.task.count({ where: { ...visibleBase, status: "DONE" } })
  ]);
  return { allPending, incompletePending, completedCount };
}
