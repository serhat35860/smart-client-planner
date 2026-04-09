import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canEditOwnedResource, canViewByCreatorOrMention } from "@/lib/access-policy";
import { creatorSelect } from "@/lib/creator-preview";
import { nextEditedByOtherMember } from "@/lib/edited-by-other-member";
import { AuditEventType } from "@/lib/audit-event-types";
import { replaceNoteMentions } from "@/lib/replace-note-mentions";
import { requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";
import { readJsonBody } from "@/lib/read-json";

const colorSchema = z
  .string()
  .regex(/^([a-z]+|#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))$/);

const patchSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  mentionedUserIds: z.array(z.string().min(1)).optional(),
  nextActionDate: z.string().datetime().nullable().optional(),
  remindBeforeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  color: colorSchema.default("yellow"),
  clientId: z.union([z.string().min(1), z.null()]).optional()
});

function notePatchMetaKeys(body: z.infer<typeof patchSchema>) {
  const keys: string[] = [];
  if (body.title !== undefined) keys.push("title");
  if (body.content !== undefined) keys.push("content");
  if (body.tags !== undefined) keys.push("tags");
  if (body.mentionedUserIds !== undefined) keys.push("mentionedUserIds");
  if (body.nextActionDate !== undefined) keys.push("nextActionDate");
  if (body.remindBeforeMinutes !== undefined) keys.push("remindBeforeMinutes");
  if (body.color !== undefined) keys.push("color");
  if (body.clientId !== undefined) keys.push("clientId");
  return keys;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await readJsonBody(req);
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const parsed = patchSchema.safeParse(body.body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.note.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: { task: true, mentions: { select: { userId: true } } }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const canView = canViewByCreatorOrMention({
    role: ctx.role,
    currentUserId: ctx.user.id,
    createdByUserId: existing.createdByUserId,
    mentionedUserIds: existing.mentions.map((m) => m.userId)
  });
  if (!canView) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditOwnedResource(ctx.role, existing.createdByUserId, ctx.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let nextClientId: string | null | undefined = undefined;
  if (parsed.data.clientId !== undefined) {
    if (parsed.data.clientId === null) {
      if (existing.task) {
        return NextResponse.json({ error: "Cannot unlink client while note is linked to a task" }, { status: 400 });
      }
      nextClientId = null;
    } else {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, workspaceId: ctx.workspace.id }
      });
      if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });
      nextClientId = parsed.data.clientId;
    }
  }

  const nextActionDate =
    parsed.data.nextActionDate === undefined
      ? undefined
      : parsed.data.nextActionDate
        ? new Date(parsed.data.nextActionDate)
        : null;

  const noteEditedByOther = nextEditedByOtherMember(
    existing.editedByOtherMember,
    existing.createdByUserId,
    existing.updatedByUserId,
    ctx.user.id
  );

  await prisma.$transaction(async (tx) => {
    await tx.note.update({
      where: { id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        color: parsed.data.color,
        updatedByUserId: ctx.user.id,
        editedByOtherMember: noteEditedByOther,
        ...(nextActionDate !== undefined
          ? {
              nextActionDate,
              remindBeforeMinutes:
                nextActionDate !== null
                  ? (parsed.data.remindBeforeMinutes !== undefined
                      ? parsed.data.remindBeforeMinutes
                      : undefined)
                  : null
            }
          : parsed.data.remindBeforeMinutes !== undefined
            ? existing.nextActionDate
              ? { remindBeforeMinutes: parsed.data.remindBeforeMinutes }
              : {}
            : {}),
        ...(nextClientId !== undefined ? { clientId: nextClientId } : {})
      }
    });
    if (nextClientId !== undefined && nextClientId !== null && existing.task) {
      const t = existing.task;
      await tx.task.update({
        where: { id: existing.task.id },
        data: {
          clientId: nextClientId,
          updatedByUserId: ctx.user.id,
          editedByOtherMember: nextEditedByOtherMember(
            t.editedByOtherMember,
            t.createdByUserId,
            t.updatedByUserId,
            ctx.user.id
          )
        }
      });
    }
  });

  await prisma.noteTag.deleteMany({ where: { noteId: id } });
  for (const tagName of parsed.data.tags) {
    const normalized = tagName.trim().toLowerCase();
    if (!normalized) continue;
    const tag = await prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId: ctx.workspace.id, name: normalized } },
      update: {},
      create: { workspaceId: ctx.workspace.id, name: normalized, createdByUserId: ctx.user.id }
    });
    await prisma.noteTag.create({ data: { noteId: id, tagId: tag.id } });
  }

  if (parsed.data.mentionedUserIds !== undefined) {
    await prisma.$transaction((tx) =>
      replaceNoteMentions(tx, ctx.workspace.id, id, parsed.data.mentionedUserIds!)
    );
  }

  const note = await prisma.note.findFirst({
    where: { id },
    include: {
      tags: { include: { tag: { select: { name: true, createdBy: { select: creatorSelect } } } } },
      mentions: { include: { user: { select: { id: true, name: true, email: true } } } },
      createdBy: { select: creatorSelect },
      updatedBy: { select: creatorSelect }
    }
  });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.NOTE_UPDATED,
    entityType: "note",
    entityId: id,
    metaJson: { keys: notePatchMetaKeys(parsed.data) },
    req
  });
  return NextResponse.json(note);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.note.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    select: { createdByUserId: true, title: true, mentions: { select: { userId: true } } }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const canView = canViewByCreatorOrMention({
    role: ctx.role,
    currentUserId: ctx.user.id,
    createdByUserId: existing.createdByUserId,
    mentionedUserIds: existing.mentions.map((m) => m.userId)
  });
  if (!canView) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditOwnedResource(ctx.role, existing.createdByUserId, ctx.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.note.deleteMany({ where: { id, workspaceId: ctx.workspace.id } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.NOTE_DELETED,
    entityType: "note",
    entityId: id,
    metaJson: { title: existing.title },
    req
  });
  return NextResponse.json({ ok: true });
}
