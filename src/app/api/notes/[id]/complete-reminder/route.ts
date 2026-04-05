import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";

/** Hatırlatma bildiriminden: notun tarihli hatırlatmasını kaldırır (içerik aynı kalır). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const updated = await prisma.note.updateMany({
    where: { id, workspaceId: ctx.workspace.id },
    data: { nextActionDate: null, remindBeforeMinutes: null }
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
