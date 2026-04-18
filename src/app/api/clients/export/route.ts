import { format } from "date-fns";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditEventType } from "@/lib/audit-event-types";
import { buildClientExportWorkbook } from "@/lib/client-excel";
import { requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";

export async function GET(req: Request) {
  const requestId = randomUUID();
  const clientType = (req.headers.get("user-agent") ?? "").toLowerCase().includes("electron") ? "desktop" : "web";
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "ADMIN") {
    await logWorkspaceActivity(ctx, {
      eventType: AuditEventType.CLIENT_EXPORT_DENIED,
      entityType: "workspace",
      entityId: ctx.workspace.id,
      metaJson: {
        requestId,
        target: "clients_excel_export",
        reasonCode: "role_not_admin",
        role: ctx.role,
        result: "denied",
        clientType
      },
      req
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "desc" },
    select: {
      fileNumber: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      sector: true,
      generalNotes: true,
      status: true,
      additionalContacts: true
    }
  });
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.CLIENT_EXPORT_COMPLETED,
    entityType: "workspace",
    entityId: ctx.workspace.id,
    metaJson: {
      requestId,
      target: "clients_excel_export",
      reasonCode: "ok",
      result: "success",
      clientType,
      clientCount: clients.length
    },
    req
  });

  const buf = await buildClientExportWorkbook(clients);
  const name = `musteriler-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`
    }
  });
}
