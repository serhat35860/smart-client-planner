import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { replaceTaskMentions } from "@/lib/replace-task-mentions";
import { requireWorkspace } from "@/lib/workspace";

const createSchema = z.object({
  clientId: z.string().min(1),
  noteId: z.string().optional().nullable(),
  title: z.string().min(1),
  deadline: z.string().datetime(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  remindBeforeMinutes: z.number().int().min(0).max(10080).optional(),
  mentionedUserIds: z.array(z.string().min(1)).default([])
});

export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "desc" },
    include: { client: true }
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, workspaceId: ctx.workspace.id }
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });

  if (parsed.data.noteId) {
    const note = await prisma.note.findFirst({
      where: { id: parsed.data.noteId, workspaceId: ctx.workspace.id }
    });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 400 });
  }

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        workspaceId: ctx.workspace.id,
        createdByUserId: ctx.user.id,
        clientId: parsed.data.clientId,
        noteId: parsed.data.noteId,
        title: parsed.data.title,
        deadline: new Date(parsed.data.deadline),
        priority: parsed.data.priority,
        remindBeforeMinutes: parsed.data.remindBeforeMinutes ?? 15
      }
    });
    await replaceTaskMentions(tx, ctx.workspace.id, created.id, parsed.data.mentionedUserIds);
    return created;
  });
  return NextResponse.json(task, { status: 201 });
}
