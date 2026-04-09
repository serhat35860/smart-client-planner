import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type AuditParams = {
  eventType: string;
  actorUserId?: string | null;
  workspaceId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metaJson?: unknown;
};

export async function logAuditEvent(input: AuditParams) {
  try {
    const metaJsonValue =
      input.metaJson === undefined
        ? undefined
        : input.metaJson === null
          ? Prisma.JsonNull
          : (input.metaJson as Prisma.InputJsonValue);

    await prisma.auditEvent.create({
      data: {
        eventType: input.eventType,
        actorUserId: input.actorUserId ?? null,
        workspaceId: input.workspaceId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metaJson: metaJsonValue
      }
    });
  } catch {
    // Auditing should never break user flows.
  }
}
