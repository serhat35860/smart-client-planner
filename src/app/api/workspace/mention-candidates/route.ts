import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";

function mentionLabel(name: string | null, email: string) {
  const n = name?.trim();
  if (n) return n;
  const local = email.split("@")[0];
  return local || email;
}

/** Not/görev etiket seçicisi: tüm ekip üyeleri (e-posta dışarı verilmez, yalnızca görünen etiket). */
export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: ctx.workspace.id, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.user.id,
      label: mentionLabel(m.user.name, m.user.email)
    }))
  });
}
