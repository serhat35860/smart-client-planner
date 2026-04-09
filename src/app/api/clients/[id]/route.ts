import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  additionalContactsForPrisma,
  sanitizeAdditionalContactsInput
} from "@/lib/client-additional-contacts";
import { AuditEventType } from "@/lib/audit-event-types";
import { canManageWorkspace, requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";
import { noteCardInclude } from "@/lib/note-include";
import { readJsonBody } from "@/lib/read-json";

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
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await readJsonBody(req);
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const parsed = updateSchema.safeParse(body.body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { additionalContacts: extraRaw, ...rest } = parsed.data;
  const data = {
    ...rest,
    updatedByUserId: ctx.user.id,
    ...(extraRaw !== undefined
      ? { additionalContacts: additionalContactsForPrisma(sanitizeAdditionalContactsInput(extraRaw)) }
      : {})
  };

  const updated = await prisma.client.updateMany({
    where: { id, workspaceId: ctx.workspace.id },
    data
  });
  if (updated.count === 1) {
    await logWorkspaceActivity(ctx, {
      eventType: AuditEventType.CLIENT_UPDATED,
      entityType: "client",
      entityId: id,
      metaJson: { keys: Object.keys(data).filter((k) => k !== "updatedByUserId") },
      req
    });
  }
  return NextResponse.json({ ok: updated.count === 1 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.client.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    select: { companyName: true }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.client.deleteMany({ where: { id, workspaceId: ctx.workspace.id } });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.CLIENT_DELETED,
    entityType: "client",
    entityId: id,
    metaJson: { companyName: existing.companyName },
    req
  });
  return NextResponse.json({ ok: true });
}
