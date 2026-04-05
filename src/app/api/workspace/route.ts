import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireWorkspace, workspaceMembersVisibleWhere } from "@/lib/workspace";

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
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await prisma.workspace.update({
    where: { id: ctx.workspace.id },
    data: { name: parsed.data.name.trim() }
  });
  return NextResponse.json({ ok: true });
}
