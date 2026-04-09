import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditEventType } from "@/lib/audit-event-types";
import { requireWorkspace, workspaceNotesVisibleWhere } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";

/** Hatırlatma bildiriminden: notun tarihli hatırlatmasını kaldırır (içerik aynı kalır). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const updated = await prisma.note.updateMany({
    where: { id, ...workspaceNotesVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id) },
    data: {
      nextActionDate: null,
      remindBeforeMinutes: null,
      updatedByUserId: ctx.user.id
    }
  });
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.NOTE_REMINDER_CLEARED,
    entityType: "note",
    entityId: id,
    req
  });
  return NextResponse.json({ ok: true });
}
