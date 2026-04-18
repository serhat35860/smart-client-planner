import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  additionalContactsForPrisma,
  sanitizeAdditionalContactsInput
} from "@/lib/client-additional-contacts";
import { nextClientFileNumber } from "@/lib/client-file-number";
import { AuditEventType } from "@/lib/audit-event-types";
import { canManageWorkspace, requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";
import { readJsonBody } from "@/lib/read-json";

const contactPair = z.object({
  name: z.string().max(200),
  phone: z.string().max(80).optional(),
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
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const mentionedUserId = (url.searchParams.get("mentionedUserId") ?? "").trim() || null;
  const yearQ = /^\d{4}$/.test(q) ? Number.parseInt(q, 10) : null;
  const yearStart = yearQ ? new Date(Date.UTC(yearQ, 0, 1, 0, 0, 0)) : null;
  const yearEnd = yearQ ? new Date(Date.UTC(yearQ + 1, 0, 1, 0, 0, 0)) : null;

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      ...(q
        ? {
            OR: [
              { companyName: { contains: q } },
              { contactPerson: { contains: q } },
              { fileNumber: { contains: q } },
              ...(yearQ && yearStart && yearEnd
                ? [{ createdAt: { gte: yearStart, lt: yearEnd } }, { fileNumber: { startsWith: `${yearQ}-` } }]
                : [])
            ]
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
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await readJsonBody(req);
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const parsed = schema.safeParse(body.body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { additionalContacts: extraRaw, ...rest } = parsed.data;
  const extra = sanitizeAdditionalContactsInput(extraRaw ?? []);
  let client: { id: string; companyName: string; fileNumber: string | null };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      client = await prisma.$transaction(async (tx) => {
        const fileNumber = await nextClientFileNumber(tx, ctx.workspace.id);
        return tx.client.create({
          data: {
            ...rest,
            fileNumber,
            additionalContacts: additionalContactsForPrisma(extra),
            workspaceId: ctx.workspace.id,
            createdByUserId: ctx.user.id
          },
          select: { id: true, companyName: true, fileNumber: true }
        });
      });
      break;
    } catch (error) {
      const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!duplicate || attempt === 2) throw error;
    }
  }
  if (!client!) return NextResponse.json({ error: "Could not create client" }, { status: 500 });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.CLIENT_CREATED,
    entityType: "client",
    entityId: client!.id,
    metaJson: { companyName: client!.companyName, fileNumber: client!.fileNumber },
    req
  });
  return NextResponse.json(client, { status: 201 });
}
