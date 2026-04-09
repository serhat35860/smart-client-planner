import { NextResponse } from "next/server";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWorkspace, workspaceNotesVisibleWhere, workspaceTasksVisibleWhere } from "@/lib/workspace";

const OPEN_TASK_STATUSES: TaskStatus[] = ["PENDING", "FAILED"];

/** Not ve bekleyen görevler — istemci uyarı zamanını hesaplar (`at` = olay anı). */
export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const visibleNoteWhere = workspaceNotesVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id);
  const visibleTaskWhere = workspaceTasksVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id);

  const [notes, tasks] = await Promise.all([
    prisma.note.findMany({
      where: {
        ...visibleNoteWhere,
        nextActionDate: { not: null }
      },
      select: {
        id: true,
        title: true,
        content: true,
        nextActionDate: true,
        remindBeforeMinutes: true,
        createdAt: true,
        client: { select: { companyName: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.task.findMany({
      where: { ...visibleTaskWhere, status: { in: OPEN_TASK_STATUSES } },
      select: {
        id: true,
        title: true,
        deadline: true,
        remindBeforeMinutes: true,
        assigneeUserId: true,
        acceptedAt: true,
        createdAt: true,
        client: { select: { companyName: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const merged = [
    ...notes.map((n) => ({
      createdAtMs: n.createdAt.getTime(),
      item: {
        kind: "note" as const,
        id: n.id,
        title: n.title,
        content: n.content,
        at: n.nextActionDate!.toISOString(),
        remindBeforeMinutes: n.remindBeforeMinutes ?? 0,
        clientName: n.client?.companyName ?? null
      }
    })),
    ...tasks.map((t) => ({
      createdAtMs: t.createdAt.getTime(),
      item: {
        kind: "task" as const,
        id: t.id,
        title: t.title,
        content: "",
        at:
          t.assigneeUserId === ctx.user.id && !t.acceptedAt
            ? t.createdAt.toISOString()
            : t.deadline.toISOString(),
        remindBeforeMinutes:
          t.assigneeUserId === ctx.user.id && !t.acceptedAt ? 0 : (t.remindBeforeMinutes ?? 0),
        clientName: t.client?.companyName ?? null,
        assignmentPrompt: Boolean(t.assigneeUserId === ctx.user.id && !t.acceptedAt)
      }
    }))
  ].sort((a, b) => b.createdAtMs - a.createdAtMs);

  return NextResponse.json(merged.map((x) => x.item));
}
