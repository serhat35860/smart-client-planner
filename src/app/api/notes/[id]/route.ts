import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const colorSchema = z
  .string()
  .regex(/^([a-z]+|#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))$/);

const patchSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  nextActionDate: z.string().datetime().nullable().optional(),
  remindBeforeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  color: colorSchema.default("yellow"),
  clientId: z.union([z.string().min(1), z.null()]).optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
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
        where: { id: parsed.data.clientId, userId: user.id }
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

  await prisma.$transaction(async (tx) => {
    await tx.note.update({
      where: { id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        color: parsed.data.color,
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
      await tx.task.update({
        where: { id: existing.task.id },
        data: { clientId: nextClientId }
      });
    }
  });

  await prisma.noteTag.deleteMany({ where: { noteId: id } });
  for (const tagName of parsed.data.tags) {
    const normalized = tagName.trim().toLowerCase();
    if (!normalized) continue;
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: normalized } },
      update: {},
      create: { userId: user.id, name: normalized }
    });
    await prisma.noteTag.create({ data: { noteId: id, tagId: tag.id } });
  }

  const note = await prisma.note.findFirst({
    where: { id },
    include: { tags: { include: { tag: true } } }
  });
  return NextResponse.json(note);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const result = await prisma.note.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
