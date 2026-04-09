import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireWorkspace } from "@/lib/workspace";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";

const patchSchema = z.object({
  name: z.union([z.string().max(120), z.null()]).optional(),
  email: z.string().email().optional(),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/i)
    .optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(6).max(200).optional()
});

type RouteCtx = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const wctx = await requireWorkspace();
  if (!wctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(wctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId: targetUserId } = await ctx.params;
  if (!targetUserId) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const target = await prisma.workspaceMember.findFirst({
    where: { workspaceId: wctx.workspace.id, userId: targetUserId },
    include: { user: { select: { id: true, name: true, email: true, username: true } } }
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    userId: target.user.id,
    name: target.user.name,
    email: target.user.email,
    username: target.user.username,
    role: target.role,
    isActive: target.isActive
  });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const wctx = await requireWorkspace();
  if (!wctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(wctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const { userId: targetUserId } = await ctx.params;
  if (!targetUserId) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const target = await prisma.workspaceMember.findFirst({
    where: { workspaceId: wctx.workspace.id, userId: targetUserId },
    include: { user: { select: { id: true } } }
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, email, username, role, isActive, newPassword } = parsed.data;
  if (
    name === undefined &&
    email === undefined &&
    username === undefined &&
    role === undefined &&
    isActive === undefined &&
    newPassword === undefined
  ) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  if (isActive === false && targetUserId === wctx.user.id) {
    return NextResponse.json({ error: "cannot_deactivate_self" }, { status: 400 });
  }

  const effectiveRole = role ?? target.role;
  const effectiveActive = isActive ?? target.isActive;
  const isTargetAdminNow = target.role === "ADMIN";
  const isTargetAdminNext = effectiveRole === "ADMIN";

  if (isTargetAdminNow && (!isTargetAdminNext || !effectiveActive)) {
    const activeAdminCount = await prisma.workspaceMember.count({
      where: { workspaceId: wctx.workspace.id, role: "ADMIN", isActive: true }
    });
    if (activeAdminCount <= 1) {
      return NextResponse.json({ error: "last_admin_guard" }, { status: 400 });
    }
  }

  const userData: {
    name?: string | null;
    email?: string;
    username?: string | null;
    passwordHash?: string;
  } = {};
  if (name !== undefined) {
    const nextName = typeof name === "string" ? (name.trim() ? name.trim() : null) : null;
    userData.name = nextName;
  }
  if (email !== undefined) {
    const nextEmail = email.toLowerCase().trim();
    const clash = await prisma.user.findFirst({
      where: { email: nextEmail, id: { not: targetUserId } },
      select: { id: true }
    });
    if (clash) return NextResponse.json({ error: "conflict_email" }, { status: 409 });
    userData.email = nextEmail;
  }
  if (username !== undefined) {
    const nextUsername = username.toLowerCase().trim();
    const clash = await prisma.user.findFirst({
      where: { username: nextUsername, id: { not: targetUserId } },
      select: { id: true }
    });
    if (clash) return NextResponse.json({ error: "conflict_username" }, { status: 409 });
    userData.username = nextUsername;
  }
  if (newPassword !== undefined) {
    userData.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id: targetUserId }, data: userData });
  }

  const memberData: { role?: "ADMIN" | "USER"; isActive?: boolean } = {};
  if (role !== undefined) memberData.role = role;
  if (isActive !== undefined) memberData.isActive = isActive;
  if (Object.keys(memberData).length > 0) {
    await prisma.workspaceMember.update({ where: { id: target.id }, data: memberData });
  }
  await logAuditEvent({
    eventType: AuditEventType.WORKSPACE_MEMBER_UPDATED,
    actorUserId: wctx.user.id,
    workspaceId: wctx.workspace.id,
    entityType: "workspace_member",
    entityId: targetUserId,
    ipAddress: ip,
    userAgent,
    metaJson: {
      updatedFields: {
        name: name !== undefined,
        email: email !== undefined,
        username: username !== undefined,
        role: role !== undefined,
        isActive: isActive !== undefined,
        newPassword: newPassword !== undefined
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const wctx = await requireWorkspace();
  if (!wctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(wctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId: targetUserId } = await ctx.params;
  if (!targetUserId) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (targetUserId === wctx.user.id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  const target = await prisma.workspaceMember.findFirst({
    where: { workspaceId: wctx.workspace.id, userId: targetUserId },
    select: { role: true, userId: true }
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.role === "ADMIN") {
    const otherActiveAdminCount = await prisma.workspaceMember.count({
      where: {
        workspaceId: wctx.workspace.id,
        role: "ADMIN",
        isActive: true,
        userId: { not: targetUserId }
      }
    });
    if (otherActiveAdminCount < 1) {
      return NextResponse.json({ error: "last_admin_guard" }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id: targetUserId } });
  await logAuditEvent({
    eventType: AuditEventType.WORKSPACE_MEMBER_DELETED,
    actorUserId: wctx.user.id,
    workspaceId: wctx.workspace.id,
    entityType: "workspace_member",
    entityId: targetUserId
  });
  return NextResponse.json({ ok: true });
}
