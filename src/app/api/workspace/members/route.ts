import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireWorkspace, workspaceMembersVisibleWhere } from "@/lib/workspace";
import { fail, ok } from "@/lib/api-response";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";

const createSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/i),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  role: z.enum(["ADMIN", "USER"]).optional(),
  name: z.string().max(120).optional().nullable()
});

/** Çalışma alanı üyeleri (ekip sayfası / yönetim). Üye rolü yalnızca kendi kaydını görür. Etiketleme: `GET /api/workspace/mention-candidates`. */
export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.workspaceMember.findMany({
    where: workspaceMembersVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id),
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role
    }))
  });
}

/** Owner: çalışma alanına doğrudan yeni üye kullanıcı oluşturur. */
export async function POST(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return fail("unauthorized", "Authentication required.", 401);
  if (!canManageWorkspace(ctx.role)) return fail("forbidden", "Only admin can create members.", 403);
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON.", 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return fail("invalid_payload", "Invalid payload.", 400);

  const email = parsed.data.email.toLowerCase().trim();
  const username = parsed.data.username.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const name = parsed.data.name?.trim() || null;
  const role = parsed.data.role ?? "USER";

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) return fail("conflict", "Email already registered.", 409);
  const existingByUsername = await prisma.user.findUnique({ where: { username } });
  if (existingByUsername) return fail("conflict_username", "Username already registered.", 409);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      name
    }
  });
  await prisma.workspaceMember.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: user.id,
      role,
      isActive: true
    }
  });
  await logAuditEvent({
    eventType: AuditEventType.WORKSPACE_MEMBER_CREATED,
    actorUserId: ctx.user.id,
    workspaceId: ctx.workspace.id,
    entityType: "workspace_member",
    entityId: user.id,
    ipAddress: ip,
    userAgent,
    metaJson: { role }
  });

  return ok({ userId: user.id });
}
