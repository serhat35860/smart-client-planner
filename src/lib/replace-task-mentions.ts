import type { Prisma } from "@prisma/client";

export async function replaceTaskMentions(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  taskId: string,
  userIds: string[]
) {
  const unique = [...new Set(userIds)];
  await tx.taskUserMention.deleteMany({ where: { taskId } });
  if (unique.length === 0) return;
  const members = await tx.workspaceMember.findMany({
    where: { workspaceId, userId: { in: unique } },
    select: { userId: true }
  });
  const allowed = new Set(members.map((m) => m.userId));
  const filtered = unique.filter((id) => allowed.has(id));
  if (filtered.length === 0) return;
  await tx.taskUserMention.createMany({
    data: filtered.map((userId) => ({ taskId, userId }))
  });
}
