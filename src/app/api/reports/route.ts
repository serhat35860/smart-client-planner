import { format } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReportRowJson } from "@/lib/report-types";
import { parseAdditionalContacts } from "@/lib/client-additional-contacts";
import { sanitizeAuditMetaForDisplay } from "@/lib/sanitize-audit-meta";
import { requireWorkspace } from "@/lib/workspace";

const deadlineFmt = "yyyy-MM-dd HH:mm";
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const MODEL_FETCH_LIMIT = 2000;

type ReportTypeFilter = "ALL" | "CLIENT" | "NOTE" | "TASK" | "TAG" | "AUDIT";
type ReportResultFilter = "ALL" | "SUCCESS" | "DENIED";

function displayUserName(email: string | null, name: string | null) {
  const n = name?.trim();
  if (n) return n;
  return email ?? null;
}

function inRange(d: Date, fromD: Date, toD: Date) {
  const t = d.getTime();
  return t >= fromD.getTime() && t <= toD.getTime();
}

function wasUpdatedAfterCreate(updatedAt: Date, createdAt: Date) {
  return updatedAt.getTime() > createdAt.getTime();
}

function assigneeUserIdFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const value = (meta as Record<string, unknown>).assigneeUserId;
  return typeof value === "string" && value.trim() ? value : null;
}

function parsePositiveInt(raw: string | null, fallback: number) {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function matchesTypeFilter(kind: ReportRowJson["kind"], filter: ReportTypeFilter) {
  if (filter === "ALL") return true;
  if (filter === "CLIENT") return kind === "client" || kind === "client_updated";
  if (filter === "NOTE") return kind === "note" || kind === "note_updated";
  if (filter === "TASK") return kind === "task_created" || kind === "task_completed" || kind === "task_failed" || kind === "task_updated";
  if (filter === "TAG") return kind === "tag_created";
  if (filter === "AUDIT") return kind === "audit";
  return true;
}

function matchesResultFilter(row: ReportRowJson, filter: ReportResultFilter) {
  if (filter === "ALL") return true;
  if (filter === "DENIED") return row.kind === "audit" && row.title.endsWith(".denied");
  if (filter === "SUCCESS") return row.kind !== "audit" || !row.title.endsWith(".denied");
  return true;
}

export async function GET(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const typeFilterRaw = (url.searchParams.get("typeFilter") ?? "ALL").toUpperCase();
  const resultFilterRaw = (url.searchParams.get("resultFilter") ?? "ALL").toUpperCase();
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const typeFilter: ReportTypeFilter =
    typeFilterRaw === "CLIENT" || typeFilterRaw === "NOTE" || typeFilterRaw === "TASK" || typeFilterRaw === "TAG" || typeFilterRaw === "AUDIT"
      ? typeFilterRaw
      : "ALL";
  const resultFilter: ReportResultFilter = resultFilterRaw === "SUCCESS" || resultFilterRaw === "DENIED" ? resultFilterRaw : "ALL";
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

  const memberIds = (
    await prisma.workspaceMember.findMany({
      where: { workspaceId: wsId },
      select: { userId: true }
    })
  ).map((m) => m.userId);

  const dateOr = {
    OR: [{ createdAt: { gte: fromD, lte: toD } }, { updatedAt: { gte: fromD, lte: toD } }]
  };

  const [clients, notes, tasks, tags, auditEvents] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId: wsId, ...dateOr },
      include: {
        createdBy: { select: { email: true, name: true } },
        updatedBy: { select: { email: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: MODEL_FETCH_LIMIT
    }),
    prisma.note.findMany({
      where: { workspaceId: wsId, ...dateOr },
      include: {
        client: { select: { companyName: true } },
        createdBy: { select: { email: true, name: true } },
        updatedBy: { select: { email: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: MODEL_FETCH_LIMIT
    }),
    prisma.task.findMany({
      where: { workspaceId: wsId, ...dateOr },
      include: {
        client: { select: { companyName: true } },
        createdBy: { select: { email: true, name: true } },
        updatedBy: { select: { email: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: MODEL_FETCH_LIMIT
    }),
    prisma.tag.findMany({
      where: { workspaceId: wsId, createdAt: { gte: fromD, lte: toD } },
      include: { createdBy: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: MODEL_FETCH_LIMIT
    }),
    prisma.auditEvent.findMany({
      where: {
        createdAt: { gte: fromD, lte: toD },
        OR: [{ workspaceId: wsId }, { actorUserId: { in: memberIds.length ? memberIds : ["__none__"] } }]
      },
      include: { actor: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: MODEL_FETCH_LIMIT
    })
  ]);

  const rows: ReportRowJson[] = [];
  const assigneeIds = [...new Set(auditEvents.map((ev) => assigneeUserIdFromMeta(ev.metaJson)).filter(Boolean))] as string[];
  const assigneeUsers = assigneeIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, email: true, name: true }
      })
    : [];
  const assigneeNameById = new Map(assigneeUsers.map((u) => [u.id, displayUserName(u.email, u.name) ?? u.email ?? u.id]));

  for (const c of clients) {
    if (inRange(c.createdAt, fromD, toD)) {
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
    if (wasUpdatedAfterCreate(c.updatedAt, c.createdAt) && inRange(c.updatedAt, fromD, toD)) {
      rows.push({
        id: `client-updated-${c.id}-${c.updatedAt.toISOString()}`,
        kind: "client_updated",
        at: c.updatedAt.toISOString(),
        title: c.companyName,
        detail: [c.status, c.sector, c.contactPerson].filter(Boolean).join(" · ") || "—",
        clientName: c.companyName,
        createdBy: c.updatedBy ? displayUserName(c.updatedBy.email, c.updatedBy.name) : null
      });
    }
  }

  for (const n of notes) {
    const preview = n.content.length > 200 ? `${n.content.slice(0, 200)}…` : n.content;
    if (inRange(n.createdAt, fromD, toD)) {
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
    if (wasUpdatedAfterCreate(n.updatedAt, n.createdAt) && inRange(n.updatedAt, fromD, toD)) {
      const reminderHint = n.nextActionDate ? ` · next ${format(n.nextActionDate, deadlineFmt)}` : "";
      rows.push({
        id: `note-updated-${n.id}-${n.updatedAt.toISOString()}`,
        kind: "note_updated",
        at: n.updatedAt.toISOString(),
        title: n.title?.trim() || preview.slice(0, 80),
        detail: `${preview}${reminderHint}`,
        clientName: n.client?.companyName ?? null,
        createdBy: n.updatedBy
          ? displayUserName(n.updatedBy.email, n.updatedBy.name)
          : n.createdBy
            ? displayUserName(n.createdBy.email, n.createdBy.name)
            : null
      });
    }
  }

  for (const t of tasks) {
    const dl = format(t.deadline, deadlineFmt);
    const actorUpdated = t.updatedBy
      ? displayUserName(t.updatedBy.email, t.updatedBy.name)
      : null;
    const actorCreated = t.createdBy ? displayUserName(t.createdBy.email, t.createdBy.name) : null;

    if (inRange(t.createdAt, fromD, toD)) {
      rows.push({
        id: `task-created-${t.id}`,
        kind: "task_created",
        at: t.createdAt.toISOString(),
        title: t.title,
        detail: `${dl} · ${t.status}`,
        clientName: t.client?.companyName ?? null,
        createdBy: actorCreated
      });
    }

    if (t.status === "DONE" && inRange(t.updatedAt, fromD, toD)) {
      rows.push({
        id: `task-done-${t.id}-${t.updatedAt.toISOString()}`,
        kind: "task_completed",
        at: t.updatedAt.toISOString(),
        title: t.title,
        detail: t.completionNotes?.trim() ? t.completionNotes.trim() : "—",
        clientName: t.client?.companyName ?? null,
        createdBy: actorUpdated ?? actorCreated
      });
    }

    if (t.status === "FAILED" && inRange(t.updatedAt, fromD, toD)) {
      const reason = t.notCompletedReason?.trim();
      rows.push({
        id: `task-failed-${t.id}-${t.updatedAt.toISOString()}`,
        kind: "task_failed",
        at: t.updatedAt.toISOString(),
        title: t.title,
        detail: [dl, reason || "—"].join(" · "),
        clientName: t.client?.companyName ?? null,
        createdBy: actorUpdated ?? actorCreated
      });
    }

    if (
      t.status === "PENDING" &&
      wasUpdatedAfterCreate(t.updatedAt, t.createdAt) &&
      inRange(t.updatedAt, fromD, toD)
    ) {
      rows.push({
        id: `task-updated-${t.id}-${t.updatedAt.toISOString()}`,
        kind: "task_updated",
        at: t.updatedAt.toISOString(),
        title: t.title,
        detail: `${dl} · ${t.priority} · ${t.status}`,
        clientName: t.client?.companyName ?? null,
        createdBy: actorUpdated ?? actorCreated
      });
    }
  }

  for (const tag of tags) {
    rows.push({
      id: `tag-${tag.id}`,
      kind: "tag_created",
      at: tag.createdAt.toISOString(),
      title: tag.name,
      detail: "—",
      clientName: null,
      createdBy: tag.createdBy ? displayUserName(tag.createdBy.email, tag.createdBy.name) : null
    });
  }

  for (const ev of auditEvents) {
    let metaForDisplay: unknown = ev.metaJson;
    const assigneeId = assigneeUserIdFromMeta(ev.metaJson);
    if (assigneeId && ev.metaJson && typeof ev.metaJson === "object" && !Array.isArray(ev.metaJson)) {
      const assigneeName = assigneeNameById.get(assigneeId);
      if (assigneeName) {
        metaForDisplay = { ...(ev.metaJson as Record<string, unknown>), assigneeUserName: assigneeName };
      }
    }
    const metaPart = sanitizeAuditMetaForDisplay(metaForDisplay);
    const detail = [metaPart, ev.ipAddress ? `IP: ${ev.ipAddress}` : null].filter(Boolean).join(" · ");
    rows.push({
      id: `audit-${ev.id}`,
      kind: "audit",
      at: ev.createdAt.toISOString(),
      title: ev.eventType,
      detail: detail || "—",
      clientName: null,
      createdBy: ev.actor ? displayUserName(ev.actor.email, ev.actor.name) : null
    });
  }

  rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const filteredRows = rows.filter((row) => matchesTypeFilter(row.kind, typeFilter) && matchesResultFilter(row, resultFilter));
  const totalRows = filteredRows.length;
  const start = (page - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);
  const hasMore = start + pageSize < totalRows;

  return NextResponse.json({
    workspaceName: ctx.workspace.name,
    from: fromD.toISOString(),
    to: toD.toISOString(),
    rows: pagedRows,
    totalRows,
    page,
    pageSize,
    hasMore
  });
}
