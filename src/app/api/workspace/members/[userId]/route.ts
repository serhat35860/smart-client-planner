import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireWorkspace } from "@/lib/workspace";

const patchSchema = z.object({
  name: z.union([z.string().max(120), z.null()]).optional(),
  isActive: z.boolean().optional()
});

type RouteCtx = { params: Promise<{ userId: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const wctx = await requireWorkspace();
  if (!wctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(wctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const { name, isActive } = parsed.data;
  if (name === undefined && isActive === undefined) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  if (isActive === false) {
    if (target.role === "OWNER") {
      return NextResponse.json({ error: "cannot_deactivate_owner" }, { status: 400 });
    }
    if (targetUserId === wctx.user.id) {
      return NextResponse.json({ error: "cannot_deactivate_self" }, { status: 400 });
    }
  }

  if (name !== undefined) {
    const nextName = typeof name === "string" ? (name.trim() ? name.trim() : null) : null;
    await prisma.user.update({ where: { id: targetUserId }, data: { name: nextName } });
  }
  if (isActive !== undefined) {
    await prisma.workspaceMember.update({
      where: { id: target.id },
      data: { isActive }
    });
  }

  return NextResponse.json({ ok: true });
}
