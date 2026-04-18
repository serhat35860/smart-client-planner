import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextClientFileNumber } from "@/lib/client-file-number";
import { additionalContactsForPrisma } from "@/lib/client-additional-contacts";
import { parseClientImportBuffer } from "@/lib/client-excel";
import { AuditEventType } from "@/lib/audit-event-types";
import { requireWorkspace } from "@/lib/workspace";
import { logWorkspaceActivity } from "@/lib/workspace-audit";

const MAX_IMPORT = 500;

export async function POST(req: Request) {
  const requestId = randomUUID();
  const clientType = (req.headers.get("user-agent") ?? "").toLowerCase().includes("electron") ? "desktop" : "web";
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "ADMIN") {
    await logWorkspaceActivity(ctx, {
      eventType: AuditEventType.CLIENT_IMPORT_DENIED,
      entityType: "workspace",
      entityId: ctx.workspace.id,
      metaJson: {
        requestId,
        target: "clients_excel_import",
        reasonCode: "role_not_admin",
        role: ctx.role,
        result: "denied",
        clientType
      },
      req
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Excel dosyası (file) gerekli." }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Yalnızca .xlsx dosyası kabul edilir." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { rows, errors, headerError } = await parseClientImportBuffer(buf);
  if (headerError) {
    return NextResponse.json({ error: headerError, parseErrors: errors }, { status: 400 });
  }

  const slice = rows.slice(0, MAX_IMPORT);
  if (rows.length > MAX_IMPORT) {
    errors.push({
      row: 0,
      message: `En fazla ${MAX_IMPORT} satır işlenir; fazlası yok sayıldı.`
    });
  }

  let created = 0;
  const createErrors: { row: number; message: string }[] = [];

  for (const { row, data } of slice) {
    const { extraContacts, fileNumber: _ignored, ...rest } = data;
    void _ignored;
    let inserted = false;
    let failMessage = "Kayıt oluşturulamadı.";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await prisma.$transaction(async (tx) => {
          const fileNumber = await nextClientFileNumber(tx, ctx.workspace.id);
          await tx.client.create({
            data: {
              ...rest,
              fileNumber,
              additionalContacts: additionalContactsForPrisma(extraContacts),
              workspaceId: ctx.workspace.id,
              createdByUserId: ctx.user.id
            }
          });
        });
        inserted = true;
        created += 1;
        break;
      } catch (error) {
        const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (duplicate && attempt < 2) continue;
        if (duplicate) failMessage = "Dosya numarası çakışması; satırı tekrar deneyin.";
        break;
      }
    }
    if (!inserted) createErrors.push({ row, message: failMessage });
  }

  const allErrors = [...errors, ...createErrors];
  await logWorkspaceActivity(ctx, {
    eventType: AuditEventType.CLIENT_IMPORT_COMPLETED,
    entityType: "workspace",
    entityId: ctx.workspace.id,
    metaJson: {
      requestId,
      target: "clients_excel_import",
      reasonCode: "ok",
      result: "success",
      clientType,
      created,
      errorCount: allErrors.length,
      totalRows: rows.length,
      processedRows: slice.length
    },
    req
  });

  return NextResponse.json({
    created,
    errors: allErrors
  });
}
