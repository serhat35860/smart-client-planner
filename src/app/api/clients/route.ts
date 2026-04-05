import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  additionalContactsForPrisma,
  sanitizeAdditionalContactsInput
} from "@/lib/client-additional-contacts";
import { requireWorkspace } from "@/lib/workspace";

const contactPair = z.object({
  name: z.string().max(200),
  phone: z.string().max(80),
  jobTitle: z.string().max(120).optional()
});

const schema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  sector: z.string().optional().nullable(),
  generalNotes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "PASSIVE", "POTENTIAL"]),
  additionalContacts: z.array(contactPair).max(20).optional()
});

export async function GET(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const mentionedUserId = (url.searchParams.get("mentionedUserId") ?? "").trim() || null;

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      ...(q
        ? {
            OR: [{ companyName: { contains: q } }, { contactPerson: { contains: q } }]
          }
        : {}),
      ...(mentionedUserId
        ? {
            notes: {
              some: {
                mentions: { some: { userId: mentionedUserId } }
              }
            }
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { notes: true, tasks: true } } }
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { additionalContacts: extraRaw, ...rest } = parsed.data;
  const extra = sanitizeAdditionalContactsInput(extraRaw ?? []);
  const client = await prisma.client.create({
    data: {
      ...rest,
      additionalContacts: additionalContactsForPrisma(extra),
      workspaceId: ctx.workspace.id,
      createdByUserId: ctx.user.id
    }
  });
  return NextResponse.json(client, { status: 201 });
}
