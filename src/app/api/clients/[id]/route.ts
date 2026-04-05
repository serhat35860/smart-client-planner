import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  additionalContactsForPrisma,
  sanitizeAdditionalContactsInput
} from "@/lib/client-additional-contacts";
import { requireWorkspace } from "@/lib/workspace";
import { noteCardInclude } from "@/lib/note-include";

const contactPair = z.object({
  name: z.string().max(200),
  phone: z.string().max(80),
  jobTitle: z.string().max(120).optional()
});

const updateSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  sector: z.string().optional().nullable(),
  generalNotes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "PASSIVE", "POTENTIAL"]),
  additionalContacts: z.array(contactPair).max(20).optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: {
      notes: {
        include: noteCardInclude,
        orderBy: { createdAt: "desc" }
      },
      tasks: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { additionalContacts: extraRaw, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(extraRaw !== undefined
      ? { additionalContacts: additionalContactsForPrisma(sanitizeAdditionalContactsInput(extraRaw)) }
      : {})
  };

  const updated = await prisma.client.updateMany({
    where: { id, workspaceId: ctx.workspace.id },
    data
  });
  return NextResponse.json({ ok: updated.count === 1 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.client.deleteMany({ where: { id, workspaceId: ctx.workspace.id } });
  return NextResponse.json({ ok: true });
}
