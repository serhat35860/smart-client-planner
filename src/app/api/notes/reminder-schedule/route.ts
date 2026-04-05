import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";

/** Not ve bekleyen görevler — istemci uyarı zamanını hesaplar (`at` = olay anı). */
export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notes, tasks] = await Promise.all([
    prisma.note.findMany({
      where: {
        workspaceId: ctx.workspace.id,
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
      where: { workspaceId: ctx.workspace.id, status: "PENDING" },
      select: {
        id: true,
        title: true,
        deadline: true,
        remindBeforeMinutes: true,
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
        at: t.deadline.toISOString(),
        remindBeforeMinutes: t.remindBeforeMinutes ?? 0,
        clientName: t.client.companyName
      }
    }))
  ].sort((a, b) => b.createdAtMs - a.createdAtMs);

  return NextResponse.json(merged.map((x) => x.item));
}
