import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { loginWithEmailPassword } from "@/lib/auth";
import { defaultWorkspaceName } from "@/lib/workspace";
import { fail, ok } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
  name: z.string().max(120).optional().nullable(),
  inviteToken: z.string().min(10).max(200).optional().nullable()
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const bucket = checkRateLimit(`register:${ip}`, 15, 60 * 60 * 1000);
    if (!bucket.ok) {
      await logAuditEvent({ eventType: AuditEventType.AUTH_REGISTER_RATE_LIMITED, ipAddress: ip, userAgent });
      return fail("too_many_requests", "Too many registration attempts. Please try again later.", 429);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("invalid_json", "Request body must be valid JSON.", 400);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("invalid_payload", "Invalid payload.", 400);

    const email = parsed.data.email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return fail("conflict", "Email already registered.", 409);

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const name = parsed.data.name?.trim() || null;
    const inviteToken = parsed.data.inviteToken?.trim() || null;

    if (inviteToken) {
      const invite = await prisma.workspaceInvite.findUnique({
        where: { token: inviteToken },
        include: { workspace: true }
      });
      if (!invite || invite.expiresAt < new Date()) {
        return fail("invalid_payload", "Invalid or expired invite.", 400);
      }
      const user = await prisma.user.create({ data: { email, passwordHash, name } });
      await prisma.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId: user.id, role: "USER" }
      });
      await prisma.workspaceInvite.delete({ where: { id: invite.id } });
      await loginWithEmailPassword(email, parsed.data.password);
      await logAuditEvent({
        eventType: AuditEventType.AUTH_REGISTER_JOINED_WORKSPACE,
        actorUserId: user.id,
        workspaceId: invite.workspaceId,
        entityType: "workspace",
        entityId: invite.workspaceId,
        ipAddress: ip,
        userAgent
      });
      return ok();
    }

    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    const workspace = await prisma.workspace.create({
      data: {
        name: defaultWorkspaceName({ email, name }),
        members: { create: { userId: user.id, role: "ADMIN" } }
      }
    });
    await loginWithEmailPassword(email, parsed.data.password);
    await logAuditEvent({
      eventType: AuditEventType.AUTH_REGISTER_CREATED_WORKSPACE,
      actorUserId: user.id,
      workspaceId: workspace.id,
      entityType: "workspace",
      entityId: workspace.id,
      ipAddress: ip,
      userAgent
    });
    return ok();
  } catch (error) {
    console.error("[register] unexpected error", error);
    return fail("register_failed", "Registration failed.", 500);
  }
}
