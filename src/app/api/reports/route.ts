import { format } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReportRowJson } from "@/lib/report-types";
import { parseAdditionalContacts } from "@/lib/client-additional-contacts";
import { requireWorkspace } from "@/lib/workspace";

const deadlineFmt = "yyyy-MM-dd HH:mm";

function displayUserName(email: string | null, name: string | null) {
  const n = name?.trim();
  if (n) return n;
  return email ?? null;
}

export async function GET(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  if (!fromRaw || !toRaw) {
    return NextResponse.json({ error: "Missing from or to" }, { status: 400 });
  }

  const fromD = new Date(fromRaw);
  const toD = new Date(toRaw);
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (fromD > toD) {
    return NextResponse.json({ error: "from after to" }, { status: 400 });
  }

  const wsId = ctx.workspace.id;

  const [clients, notes, tasksCreated, tasksDone] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId: wsId, createdAt: { gte: fromD, lte: toD } },
      include: { createdBy: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.note.findMany({
      where: { workspaceId: wsId, createdAt: { gte: fromD, lte: toD } },
      include: {
        client: { select: { companyName: true } },
        createdBy: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.task.findMany({
      where: { workspaceId: wsId, createdAt: { gte: fromD, lte: toD } },
      include: {
        client: { select: { companyName: true } },
        createdBy: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.task.findMany({
      where: {
        workspaceId: wsId,
        status: "DONE",
        updatedAt: { gte: fromD, lte: toD }
      },
      include: {
        client: { select: { companyName: true } },
        createdBy: { select: { email: true, name: true } }
      },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const rows: ReportRowJson[] = [];

  for (const c of clients) {
    rows.push({
      id: `client-${c.id}`,
      kind: "client",
      at: c.createdAt.toISOString(),
      title: c.companyName,
      detail: [
        c.contactPerson,
        c.email,
        c.phone,
        ...parseAdditionalContacts(c.additionalContacts).map((x) =>
          [x.name, x.jobTitle, x.phone].filter(Boolean).join(" · ")
        )
      ]
        .filter(Boolean)
        .join(" · "),
      clientName: c.companyName,
      createdBy: c.createdBy ? displayUserName(c.createdBy.email, c.createdBy.name) : null
    });
  }

  for (const n of notes) {
    const preview = n.content.length > 200 ? `${n.content.slice(0, 200)}…` : n.content;
    rows.push({
      id: `note-${n.id}`,
      kind: "note",
      at: n.createdAt.toISOString(),
      title: n.title?.trim() || preview.slice(0, 80),
      detail: preview,
      clientName: n.client?.companyName ?? null,
      createdBy: n.createdBy ? displayUserName(n.createdBy.email, n.createdBy.name) : null
    });
  }

  for (const t of tasksCreated) {
    const dl = format(t.deadline, deadlineFmt);
    rows.push({
      id: `task-created-${t.id}`,
      kind: "task_created",
      at: t.createdAt.toISOString(),
      title: t.title,
      detail: `${dl} · ${t.status}`,
      clientName: t.client.companyName,
      createdBy: t.createdBy ? displayUserName(t.createdBy.email, t.createdBy.name) : null
    });
  }

  for (const t of tasksDone) {
    rows.push({
      id: `task-done-${t.id}-${t.updatedAt.toISOString()}`,
      kind: "task_completed",
      at: t.updatedAt.toISOString(),
      title: t.title,
      detail: t.completionNotes?.trim() ? t.completionNotes.trim() : "—",
      clientName: t.client.companyName,
      createdBy: t.createdBy ? displayUserName(t.createdBy.email, t.createdBy.name) : null
    });
  }

  rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return NextResponse.json({
    workspaceName: ctx.workspace.name,
    from: fromD.toISOString(),
    to: toD.toISOString(),
    rows
  });
}
