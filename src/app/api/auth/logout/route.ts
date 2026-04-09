import { logout, requireUser } from "@/lib/auth";
import { ok } from "@/lib/api-response";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await requireUser();
  let workspaceId: string | null = null;
  if (user) {
    const m = await prisma.workspaceMember.findUnique({
      where: { userId: user.id },
      select: { workspaceId: true }
    });
    workspaceId = m?.workspaceId ?? null;
  }
  await logout();
  await logAuditEvent({
    eventType: AuditEventType.AUTH_LOGOUT,
    actorUserId: user?.id ?? null,
    workspaceId,
    ipAddress: getClientIp(req),
    userAgent: req.headers.get("user-agent")
  });
  return ok();
}
