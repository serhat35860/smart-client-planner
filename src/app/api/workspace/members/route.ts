import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace, workspaceMembersVisibleWhere } from "@/lib/workspace";

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
