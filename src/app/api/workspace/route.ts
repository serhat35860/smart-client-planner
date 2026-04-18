import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditEventType } from "@/lib/audit-event-types";
import { requireWorkspace, workspaceMembersVisibleWhere } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";
import { readJsonBody } from "@/lib/read-json";

export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.workspaceMember.findMany({
    where: workspaceMembersVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id),
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({
    name: ctx.workspace.name,
    role: ctx.role,
    members: members.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role
    }))
  });
}

const patchSchema = z.object({ name: z.string().min(1).max(120) });

export async function PATCH(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await readJsonBody(req);
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const parsed = patchSchema.safeParse(body.body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const previousName = ctx.workspace.name;
  const nextName = parsed.data.name.trim();
  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: { name: nextName }
  });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.WORKSPACE_RENAMED,
    entityType: "workspace",
    entityId: ctx.workspace.id,
    metaJson: { from: previousName, to: nextName },
    req
  });
  return NextResponse.json({ ok: true });
}
