import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nextEditedByOtherMember } from "@/lib/edited-by-other-member";
import { replaceTaskMentions } from "@/lib/replace-task-mentions";
import { requireWorkspace } from "@/lib/workspace";

const updateSchema = z
  .object({
    status: z.enum(["PENDING", "DONE"]).optional(),
    notCompletedReason: z.union([z.string().max(2000), z.null()]).optional(),
    completionNotes: z.union([z.string().max(4000), z.null()]).optional(),
    title: z.string().min(1).max(500).optional(),
    deadline: z.string().datetime().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    clientId: z.string().min(1).optional(),
    remindBeforeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
    mentionedUserIds: z.array(z.string().min(1)).optional()
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.notCompletedReason !== undefined ||
      d.completionNotes !== undefined ||
      d.title !== undefined ||
      d.deadline !== undefined ||
      d.priority !== undefined ||
      d.clientId !== undefined ||
      d.remindBeforeMinutes !== undefined ||
      d.mentionedUserIds !== undefined,
    { message: "At least one field required" }
  );

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await req.json();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { id } = await params;

  const existing = await prisma.task.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    status,
    notCompletedReason,
    completionNotes,
    title,
    deadline,
    priority,
    clientId,
    remindBeforeMinutes,
    mentionedUserIds
  } = parsed.data;

  if (completionNotes !== undefined && status !== "DONE") {
    return NextResponse.json({ error: "completionNotes only with status DONE" }, { status: 400 });
  }

  if (clientId !== undefined) {
    const c = await prisma.client.findFirst({ where: { id: clientId, workspaceId: ctx.workspace.id } });
    if (!c) return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }

  const data: {
    status?: "PENDING" | "DONE";
    notCompletedReason?: string | null;
    completionNotes?: string | null;
    title?: string;
    deadline?: Date;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    clientId?: string;
    remindBeforeMinutes?: number | null;
    updatedByUserId?: string;
    editedByOtherMember?: boolean;
  } = {};

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
  }

  if (notCompletedReason !== undefined && status !== "DONE") {
    const normalized =
      notCompletedReason === null
        ? null
        : notCompletedReason.trim() === ""
          ? null
          : notCompletedReason.trim();
    if (normalized !== null && existing.status !== "PENDING") {
      return NextResponse.json({ error: "Reason only for pending tasks" }, { status: 400 });
    }
    if (status === undefined || status === "PENDING") {
      data.notCompletedReason = normalized;
    }
  }

  if (title !== undefined) data.title = title.trim();
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (priority !== undefined) data.priority = priority;
  if (clientId !== undefined) data.clientId = clientId;
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

  return NextResponse.json({ ok: true });
}
