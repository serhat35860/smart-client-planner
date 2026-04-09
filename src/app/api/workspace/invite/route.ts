import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireWorkspace } from "@/lib/workspace";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.workspaceInvite.create({
    data: {
      workspaceId: ctx.workspace.id,
      token,
      expiresAt,
      createdById: ctx.user.id
    }
  });
  await logAuditEvent({
    eventType: AuditEventType.WORKSPACE_INVITE_CREATED,
    actorUserId: ctx.user.id,
    workspaceId: ctx.workspace.id,
    entityType: "workspace_invite",
    ipAddress: getClientIp(req),
    userAgent: req.headers.get("user-agent")
  });

  return NextResponse.json({ token, expiresAt: expiresAt.toISOString() });
}
