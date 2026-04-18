import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canEditTaskFieldSet, canViewByCreatorOrMention } from "@/lib/access-policy";
import { nextEditedByOtherMember } from "@/lib/edited-by-other-member";
import { AuditEventType } from "@/lib/audit-event-types";
import { replaceTaskMentions } from "@/lib/replace-task-mentions";
import { requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";
import { readJsonBody } from "@/lib/read-json";

const colorSchema = z
  .string()
  .trim()
  .refine((v) => /^[a-z0-9_-]+$/i.test(v) || /^#[0-9a-f]{6}$/i.test(v), "Invalid color");

const updateSchema = z
  .object({
    status: z.enum(["PENDING", "DONE", "FAILED"]).optional(),
    acceptTask: z.boolean().optional(),
    notCompletedReason: z.union([z.string().max(2000), z.null()]).optional(),
    completionNotes: z.union([z.string().max(4000), z.null()]).optional(),
    title: z.string().min(1).max(500).optional(),
    content: z.union([z.string().max(4000), z.null()]).optional(),
    deadline: z.string().datetime().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    color: colorSchema.optional(),
    clientId: z.union([z.string().min(1), z.null()]).optional(),
    assigneeUserId: z.union([z.string().min(1), z.null()]).optional(),
    remindBeforeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
    mentionedUserIds: z.array(z.string().min(1)).optional()
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.notCompletedReason !== undefined ||
      d.completionNotes !== undefined ||
      d.title !== undefined ||
      d.content !== undefined ||
      d.deadline !== undefined ||
      d.priority !== undefined ||
      d.color !== undefined ||
      d.clientId !== undefined ||
      d.assigneeUserId !== undefined ||
      d.acceptTask !== undefined ||
      d.remindBeforeMinutes !== undefined ||
      d.mentionedUserIds !== undefined,
    { message: "At least one field required" }
  );

function taskPatchMetaKeys(d: z.infer<typeof updateSchema>) {
  const keys: (keyof z.infer<typeof updateSchema>)[] = [
    "status",
    "acceptTask",
    "notCompletedReason",
    "completionNotes",
    "title",
    "content",
    "deadline",
    "priority",
    "color",
    "clientId",
    "assigneeUserId",
    "remindBeforeMinutes",
    "mentionedUserIds"
  ];
  return keys.filter((k) => d[k] !== undefined).map(String);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(req);
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const raw = body.body;
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: { mentions: { select: { userId: true } } }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const canView = canViewByCreatorOrMention({
    role: ctx.role,
    currentUserId: ctx.user.id,
    createdByUserId: existing.createdByUserId,
    mentionedUserIds: existing.mentions.map((m) => m.userId)
  });
  if (!canView) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    status,
    notCompletedReason,
    completionNotes,
    title,
    content,
    deadline,
    priority,
    color,
    clientId,
    assigneeUserId,
    acceptTask,
    remindBeforeMinutes,
    mentionedUserIds
  } = parsed.data;

  const forbiddenFieldUpdate =
    title !== undefined ||
    content !== undefined ||
    deadline !== undefined ||
    priority !== undefined ||
    color !== undefined ||
    clientId !== undefined ||
    assigneeUserId !== undefined ||
    remindBeforeMinutes !== undefined ||
    mentionedUserIds !== undefined;
  if (
    !canEditTaskFieldSet({
      role: ctx.role,
      currentUserId: ctx.user.id,
      createdByUserId: existing.createdByUserId,
      wantsStructuralUpdate: forbiddenFieldUpdate
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (completionNotes !== undefined && status !== "DONE") {
    return NextResponse.json({ error: "completionNotes only with status DONE" }, { status: 400 });
  }

  if (clientId !== undefined && clientId !== null) {
    const c = await prisma.client.findFirst({ where: { id: clientId, workspaceId: ctx.workspace.id } });
    if (!c) return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }

  if (assigneeUserId !== undefined && assigneeUserId !== null) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: ctx.workspace.id, userId: assigneeUserId, isActive: true }
    });
    if (!member) return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
  }

  const data: {
    status?: "PENDING" | "DONE" | "FAILED";
    notCompletedReason?: string | null;
    completionNotes?: string | null;
    title?: string;
    content?: string | null;
    deadline?: Date;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    color?: string;
    clientId?: string | null;
    assigneeUserId?: string | null;
    acceptedAt?: Date | null;
    remindBeforeMinutes?: number | null;
    updatedByUserId?: string;
    editedByOtherMember?: boolean;
  } = {};

  if (acceptTask) {
    if (existing.assigneeUserId !== ctx.user.id) {
      return NextResponse.json({ error: "Only assignee can accept task" }, { status: 403 });
    }
    data.acceptedAt = new Date();
  }

  if (status === "DONE") {
    data.status = "DONE";
    data.notCompletedReason = null;
    let notes: string | null = null;
    if (completionNotes !== undefined) {
      notes =
        completionNotes === null || completionNotes.trim() === "" ? null : completionNotes.trim();
    }
    data.completionNotes = notes;
  } else if (status === "PENDING") {
    data.status = "PENDING";
    data.completionNotes = null;
  } else if (status === "FAILED") {
    data.status = "FAILED";
    data.completionNotes = null;
  }

  if (notCompletedReason !== undefined && status !== "DONE") {
    const normalized =
      notCompletedReason === null
        ? null
        : notCompletedReason.trim() === ""
          ? null
          : notCompletedReason.trim();
    if (normalized !== null && existing.status !== "PENDING" && existing.status !== "FAILED") {
      return NextResponse.json({ error: "Reason only for pending/failed tasks" }, { status: 400 });
    }
    if (status === undefined || status === "PENDING" || status === "FAILED") {
      data.notCompletedReason = normalized;
    }
  }

  if (title !== undefined) data.title = title.trim();
  if (content !== undefined) data.content = content === null ? null : content.trim() === "" ? null : content.trim();
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (priority !== undefined) data.priority = priority;
  if (color !== undefined) data.color = color;
  if (clientId !== undefined) data.clientId = clientId;
  if (assigneeUserId !== undefined) {
    data.assigneeUserId = assigneeUserId;
    if (assigneeUserId !== existing.assigneeUserId) data.acceptedAt = null;
  }
  if (remindBeforeMinutes !== undefined) data.remindBeforeMinutes = remindBeforeMinutes;

  const hasTaskUpdates = Object.keys(data).length > 0;
  const hasMentionUpdates = mentionedUserIds !== undefined;

  if (!hasTaskUpdates && !hasMentionUpdates) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const taskEditedByOther = nextEditedByOtherMember(
    existing.editedByOtherMember,
    existing.createdByUserId,
    existing.updatedByUserId,
    ctx.user.id
  );

  if (hasTaskUpdates) {
    data.updatedByUserId = ctx.user.id;
    data.editedByOtherMember = taskEditedByOther;
    const result = await prisma.task.updateMany({
      where: { id, workspaceId: ctx.workspace.id },
      data
    });
    if (result.count !== 1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else if (hasMentionUpdates) {
    const result = await prisma.task.updateMany({
      where: { id, workspaceId: ctx.workspace.id },
      data: { updatedByUserId: ctx.user.id, editedByOtherMember: taskEditedByOther }
    });
    if (result.count !== 1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (hasMentionUpdates) {
    await prisma.$transaction((tx) => replaceTaskMentions(tx, ctx.workspace.id, id, mentionedUserIds));
  }

  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.TASK_UPDATED,
    entityType: "task",
    entityId: id,
    metaJson: { keys: taskPatchMetaKeys(parsed.data) },
    req
  });

  return NextResponse.json({ ok: true });
}
