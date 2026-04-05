import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { creatorSelect } from "@/lib/creator-preview";
import { nextEditedByOtherMember } from "@/lib/edited-by-other-member";
import { replaceNoteMentions } from "@/lib/replace-note-mentions";
import { requireWorkspace } from "@/lib/workspace";

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.note.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: { task: true }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  return NextResponse.json(note);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const result = await prisma.note.deleteMany({ where: { id, workspaceId: ctx.workspace.id } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
