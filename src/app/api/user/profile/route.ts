import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";

const patchSchema = z
  .object({
    name: z.union([z.string().max(120), z.null()]).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).max(200).optional()
  })
  .superRefine((val, ctx) => {
    if (val.newPassword && !val.currentPassword?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["currentPassword"] });
    }
  });

export async function PATCH(req: Request) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  const bucket = checkRateLimit(`profile-patch:${ip}`, 30, 15 * 60 * 1000);
  if (!bucket.ok) return fail("too_many_requests", "Too many requests. Please try again later.", 429);

  const user = await requireUser();
  if (!user) return fail("unauthorized", "Authentication required.", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON.", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("invalid_payload", "Invalid payload.", 400);
  }

  const { name, currentPassword, newPassword } = parsed.data;
  const hasName = name !== undefined;
  const hasPassword = Boolean(newPassword?.length);

  if (!hasName && !hasPassword) {
    return fail("invalid_payload", "No changes provided.", 400);
  }

  const data: { name?: string | null; passwordHash?: string } = {};

  if (hasName) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    data.name = trimmed ? trimmed : null;
  }

  if (hasPassword) {
    const ok = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
    if (!ok) {
      return fail("invalid_current_password", "Current password is incorrect.", 400);
    }
    data.passwordHash = await bcrypt.hash(newPassword!, 10);
  }

  await prisma.user.update({
    where: { id: user.id },
    data
  });
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId: user.id },
    select: { workspaceId: true }
  });
  await logAuditEvent({
    eventType: hasPassword ? AuditEventType.USER_PASSWORD_CHANGED : AuditEventType.USER_PROFILE_UPDATED,
    actorUserId: user.id,
    workspaceId: membership?.workspaceId ?? null,
    ipAddress: ip,
    userAgent
  });

  return ok();
}
