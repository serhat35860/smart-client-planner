import type { Prisma } from "@prisma/client";

/** Yalnızca aynı workspace üyeleri etiketlenebilir. */
export async function replaceNoteMentions(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  noteId: string,
  userIds: string[]
) {
  const unique = [...new Set(userIds)];
  await tx.noteUserMention.deleteMany({ where: { noteId } });
  if (unique.length === 0) return;
  const members = await tx.workspaceMember.findMany({
    where: { workspaceId, userId: { in: unique } },
    select: { userId: true }
  });
  const allowed = new Set(members.map((m) => m.userId));
  const filtered = unique.filter((id) => allowed.has(id));
  if (filtered.length === 0) return;
  await tx.noteUserMention.createMany({
    data: filtered.map((userId) => ({ noteId, userId }))
  });
}
