import { logAuditEvent } from "@/lib/audit-log";
import type { WorkspaceContext } from "@/lib/workspace";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Records an auditable action in the current workspace (multi-user / compliance trail).
 * Always sets `workspaceId` and `actorUserId` from context; optionally captures IP/UA from the request.
 */
export async function logWorkspaceActivity(
  ctx: WorkspaceContext,
  input: {
    eventType: string;
    entityType?: string | null;
    entityId?: string | null;
    metaJson?: unknown;
    req?: Request | null;
  }
) {
  const req = input.req ?? null;
  const ipAddress = req ? getClientIp(req) : null;
  const userAgent = req?.headers.get("user-agent") ?? null;
  await logAuditEvent({
    eventType: input.eventType,
    actorUserId: ctx.user.id,
    workspaceId: ctx.workspace.id,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    ipAddress,
    userAgent,
    metaJson: input.metaJson
  });
}
