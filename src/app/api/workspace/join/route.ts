import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";

const schema = z.object({ token: z.string().min(10).max(200) });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  const bucket = checkRateLimit(`workspace-join:${ip}`, 20, 60 * 60 * 1000);
  if (!bucket.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "already_in_workspace" }, { status: 409 });
  }

  const invite = await prisma.workspaceInvite.findUnique({ where: { token: parsed.data.token.trim() } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: user.id, role: "USER" }
    }),
    prisma.workspaceInvite.delete({ where: { id: invite.id } })
  ]);
  await logAuditEvent({
    eventType: AuditEventType.WORKSPACE_JOINED,
    actorUserId: user.id,
    workspaceId: invite.workspaceId,
    entityType: "workspace",
    entityId: invite.workspaceId,
    ipAddress: ip,
    userAgent
  });

  return NextResponse.json({ ok: true });
}
