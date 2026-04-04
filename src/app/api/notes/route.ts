import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  clientId: z.union([z.string().min(1), z.null()]).optional(),
  title: z.string().optional().nullable(),
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  nextActionDate: z.string().datetime().optional().nullable(),
  remindBeforeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  color: z
    .string()
    .regex(/^([a-z]+|#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))$/)
    .default("yellow")
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const clientId = parsed.data.clientId ?? null;
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  const nextActionDate = parsed.data.nextActionDate ? new Date(parsed.data.nextActionDate) : null;
  const note = await prisma.note.create({
    data: {
      userId: user.id,
      clientId,
      title: parsed.data.title,
      content: parsed.data.content,
      color: parsed.data.color,
      nextActionDate,
      remindBeforeMinutes:
        nextActionDate !== null ? (parsed.data.remindBeforeMinutes ?? null) : null
    }
  });

  for (const tagName of parsed.data.tags) {
    const normalized = tagName.trim().toLowerCase();
    if (!normalized) continue;
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: normalized } },
      update: {},
      create: { userId: user.id, name: normalized }
    });
    await prisma.noteTag.create({ data: { noteId: note.id, tagId: tag.id } });
  }

  return NextResponse.json(note, { status: 201 });
}
