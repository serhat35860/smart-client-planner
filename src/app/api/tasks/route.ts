import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditEventType } from "@/lib/audit-event-types";
import { replaceTaskMentions } from "@/lib/replace-task-mentions";
import { requireWorkspace, workspaceTasksVisibleWhere } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";
import { readJsonBody } from "@/lib/read-json";

const colorSchema = z
  .string()
  .trim()
  .refine((v) => /^[a-z0-9_-]+$/i.test(v) || /^#[0-9a-f]{6}$/i.test(v), "Invalid color");

const createSchema = z.object({
  clientId: z.string().min(1).optional().nullable(),
  assigneeUserId: z.string().min(1).optional().nullable(),
  noteId: z.string().optional().nullable(),
  title: z.string().min(1),
  content: z.string().max(4000).optional().nullable(),
  deadline: z.string().datetime(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  color: colorSchema.default("yellow"),
  remindBeforeMinutes: z.number().int().min(0).max(10080).optional(),
  mentionedUserIds: z.array(z.string().min(1)).default([])
});

export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: workspaceTasksVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id),
    orderBy: { createdAt: "desc" },
    include: { client: true }
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(req);
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const parsed = createSchema.safeParse(body.body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, workspaceId: ctx.workspace.id }
    });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  if (parsed.data.assigneeUserId) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: ctx.workspace.id, userId: parsed.data.assigneeUserId, isActive: true }
    });
    if (!member) return NextResponse.json({ error: "Assignee not found" }, { status: 400 });
  }

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
        clientId: parsed.data.clientId ?? null,
        assigneeUserId: parsed.data.assigneeUserId ?? null,
        noteId: parsed.data.noteId,
        title: parsed.data.title,
        content: parsed.data.content?.trim() ? parsed.data.content.trim() : null,
        deadline: new Date(parsed.data.deadline),
        priority: parsed.data.priority,
        color: parsed.data.color,
        remindBeforeMinutes: parsed.data.remindBeforeMinutes ?? 15
      }
    });
    await replaceTaskMentions(tx, ctx.workspace.id, created.id, parsed.data.mentionedUserIds);
    return created;
  });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.TASK_CREATED,
    entityType: "task",
    entityId: task.id,
    metaJson: {
      clientId: task.clientId,
      assigneeUserId: task.assigneeUserId,
      mentionCount: parsed.data.mentionedUserIds.length
    },
    req
  });
  return NextResponse.json(task, { status: 201 });
}
