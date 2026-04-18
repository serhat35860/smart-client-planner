import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AuditEventType } from "@/lib/audit-event-types";
import { buildClientTemplateWorkbook } from "@/lib/client-excel";
import { requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";

export async function GET(req: Request) {
  const requestId = randomUUID();
  const clientType = (req.headers.get("user-agent") ?? "").toLowerCase().includes("electron") ? "desktop" : "web";
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "ADMIN") {
    await logWorkspaceActivity(ctx, {
      eventType: AuditEventType.CLIENT_IMPORT_TEMPLATE_DENIED,
      entityType: "workspace",
      entityId: ctx.workspace.id,
      metaJson: {
        requestId,
        target: "clients_excel_template_download",
        reasonCode: "role_not_admin",
        role: ctx.role,
        result: "denied",
        clientType
      },
      req
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.CLIENT_IMPORT_TEMPLATE_DOWNLOADED,
    entityType: "workspace",
    entityId: ctx.workspace.id,
    metaJson: {
      requestId,
      target: "clients_excel_template_download",
      reasonCode: "ok",
      result: "success",
      clientType
    },
    req
  });

  const buf = await buildClientTemplateWorkbook();
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="musteri-import-sablonu.xlsx"'
    }
  });
}
