"use client";

import { endOfDay, format, parse, startOfDay, startOfMonth } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReportApiResponse, ReportRowJson } from "@/lib/report-types";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";
import type { AppLanguage } from "@/i18n/settings";
import ExcelJS from "exceljs";

const AUDIT_EVENT_LABEL_KEYS: Record<string, string> = {
  "client.import_denied": "reports_audit_event_client_import_denied",
  "client.import_completed": "reports_audit_event_client_import_completed",
  "client.export_denied": "reports_audit_event_client_export_denied",
  "client.export_completed": "reports_audit_event_client_export_completed",
  "client.import_template_denied": "reports_audit_event_client_template_denied",
  "client.import_template_downloaded": "reports_audit_event_client_template_downloaded"
};

function kindLabel(kind: ReportRowJson["kind"], t: (k: string) => string) {
  switch (kind) {
    case "client":
      return t("reports_type_client");
    case "client_updated":
      return t("reports_type_client_updated");
    case "note":
      return t("reports_type_note");
    case "note_updated":
      return t("reports_type_note_updated");
    case "task_created":
      return t("reports_type_task_created");
    case "task_completed":
      return t("reports_type_task_completed");
    case "task_failed":
      return t("reports_type_task_failed");
    case "task_updated":
      return t("reports_type_task_updated");
    case "tag_created":
      return t("reports_type_tag_created");
    case "audit":
      return t("reports_type_audit");
    default:
      return kind;
  }
}

function parseAuditDetail(detail: string) {
  const ipMatches = [...detail.matchAll(/(?:^|\s)IP:\s*([0-9a-fA-F:.]+)/g)];
  const uniqueIps = [...new Set(ipMatches.map((m) => m[1]?.trim()).filter(Boolean))];
  const ip = uniqueIps.length ? uniqueIps.join(", ") : null;
  const metaRaw = detail.replace(/(?:^|\s)IP:\s*[0-9a-fA-F:.]+/g, "").replace(/\s*·\s*$/g, "").trim();
  const metaText = metaRaw.trim();
  if (!metaText || metaText === "—") return { meta: null as Record<string, unknown> | null, ip };
  try {
    const parsed = JSON.parse(metaText);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { meta: parsed as Record<string, unknown>, ip };
    }
  } catch {
    /* keep raw fallback */
  }
  return { meta: null as Record<string, unknown> | null, ip };
}

function formatGenericAuditMeta(meta: Record<string, unknown>, t: (k: string, o?: Record<string, unknown>) => string) {
  const labelMap: Record<string, string> = {
    target: t("reports_meta_target"),
    reasonCode: t("reports_meta_reason_code"),
    requestId: t("reports_meta_request_id"),
    clientType: t("reports_meta_client_type"),
    clientId: t("reports_meta_client"),
    assigneeUserName: t("reports_meta_assignee"),
    assigneeUserId: t("reports_meta_assignee"),
    mentionCount: t("reports_meta_mention_count")
  };
  const lines: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (key === "assigneeUserId" && typeof meta.assigneeUserName === "string" && meta.assigneeUserName.trim()) continue;
    if (value == null || value === "") continue;
    const label = labelMap[key] ?? key;
    if (typeof value === "string") {
      if (key === "target") {
        const targetLabel =
          value === "clients_excel_import"
            ? t("reports_target_clients_excel_import")
            : value === "clients_excel_export"
              ? t("reports_target_clients_excel_export")
              : value === "clients_excel_template_download"
                ? t("reports_target_clients_excel_template_download")
                : value;
        lines.push(`${label}: ${targetLabel}`);
        continue;
      }
      if (key === "reasonCode") {
        const reasonLabel = value === "ok" ? t("reports_reason_ok") : value === "role_not_admin" ? t("reports_reason_role_not_admin") : value;
        lines.push(`${label}: ${reasonLabel}`);
        continue;
      }
      if (key === "clientType") {
        const typeLabel = value === "desktop" ? t("reports_client_type_desktop") : value === "web" ? t("reports_client_type_web") : value;
        lines.push(`${label}: ${typeLabel}`);
        continue;
      }
      const short = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value) ? `${value.slice(0, 8)}…` : value;
      lines.push(`${label}: ${short}`);
      continue;
    }
    lines.push(`${label}: ${String(value)}`);
  }
  return lines.join("\n");
}

function formatAuditRow(r: ReportRowJson, t: (k: string, o?: Record<string, unknown>) => string) {
  if (r.kind !== "audit") return { title: r.title, detail: r.detail };
  const title = AUDIT_EVENT_LABEL_KEYS[r.title] ? t(AUDIT_EVENT_LABEL_KEYS[r.title]) : r.title;
  const { meta, ip } = parseAuditDetail(r.detail);

  let detail = r.detail;
  if (r.title === "client.import_denied" || r.title === "client.export_denied" || r.title === "client.import_template_denied") {
    const roleRaw = String(meta?.role ?? "—");
    const role = roleRaw === "ADMIN" ? t("reports_role_admin") : roleRaw === "USER" ? t("reports_role_user") : roleRaw;
    detail = t("reports_audit_detail_denied_role", { role });
  } else if (r.title === "client.import_completed") {
    detail = t("reports_audit_detail_import_completed", {
      totalRows: Number(meta?.totalRows ?? 0),
      processedRows: Number(meta?.processedRows ?? 0),
      created: Number(meta?.created ?? 0),
      errorCount: Number(meta?.errorCount ?? 0)
    });
  } else if (r.title === "client.export_completed") {
    detail = t("reports_audit_detail_export_completed", { clientCount: Number(meta?.clientCount ?? 0) });
  } else if (r.title === "client.import_template_downloaded") {
    detail = t("reports_audit_detail_template_downloaded");
  } else if (meta) {
    detail = formatGenericAuditMeta(meta, t) || t("reports_audit_detail_generic");
  }

  if (ip) {
    detail = `${detail} · IP: ${ip}`;
  }
  return { title, detail };
}

function rowResultLabel(r: ReportRowJson, t: (k: string) => string) {
  if (r.kind === "audit") {
    return r.title.endsWith(".denied") ? t("reports_result_denied") : t("reports_result_success");
  }
  if (r.kind === "task_failed") return t("reports_result_failed");
  return t("reports_result_success");
}

function structuredDetail(
  r: ReportRowJson,
  auditText: { title: string; detail: string },
  t: (k: string, o?: Record<string, unknown>) => string,
  lang: AppLanguage
) {
  const parsed = r.kind === "audit" ? parseAuditDetail(r.detail) : { meta: null as Record<string, unknown> | null, ip: null as string | null };
  const extras: string[] = [];
  if (parsed.meta) {
    const generic = formatGenericAuditMeta(parsed.meta, t);
    if (generic) extras.push(generic);
  }
  if (parsed.ip) {
    extras.push(`${t("reports_meta_ip")}: ${parsed.ip}`);
  }
  return [
    `${t("reports_detail_who")}: ${r.createdBy ?? "—"}`,
    `${t("reports_detail_what")}: ${auditText.title}`,
    `${t("reports_detail_when")}: ${formatDateTime24(r.at, lang)}`,
    `${t("reports_detail_result")}: ${rowResultLabel(r, t)}`,
    ...extras
  ].join("\n");
}

export function ReportsClient() {
  const { t, i18n } = useTranslation();
  const lang = appLanguageFromI18n(i18n.language);
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "CLIENT" | "NOTE" | "TASK" | "TAG" | "AUDIT"
  >("ALL");
  const [resultFilter, setResultFilter] = useState<"ALL" | "SUCCESS" | "DENIED">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");

  useEffect(() => {
    setFromStr(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    setToStr(format(new Date(), "yyyy-MM-dd"));
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportApiResponse | null>(null);

  const rangeIso = useMemo(() => {
    try {
      const fromD = startOfDay(parse(fromStr, "yyyy-MM-dd", new Date()));
      const toD = endOfDay(parse(toStr, "yyyy-MM-dd", new Date()));
      if (fromD > toD) return null;
      return { from: fromD.toISOString(), to: toD.toISOString() };
    } catch {
      return null;
    }
  }, [fromStr, toStr]);

  const currentRows = useMemo(() => data?.rows ?? [], [data?.rows]);

  const fetchReports = useCallback(async (overrides?: { page?: number; pageSize?: number }) => {
    setError(null);
    if (!rangeIso) {
      setError(t("reports_invalid_range"));
      setData(null);
      return false;
    }
    const targetPage = overrides?.page ?? page;
    const targetPageSize = overrides?.pageSize ?? pageSize;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?from=${encodeURIComponent(rangeIso.from)}&to=${encodeURIComponent(rangeIso.to)}&typeFilter=${encodeURIComponent(typeFilter)}&resultFilter=${encodeURIComponent(resultFilter)}&page=${targetPage}&pageSize=${targetPageSize}`
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? t("reports_fetch_error"));
        setData(null);
        return false;
      }
      setData((await res.json()) as ReportApiResponse);
      return true;
    } catch {
      setError(t("reports_fetch_error"));
      setData(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, rangeIso, resultFilter, t, typeFilter]);

  const load = useCallback(async () => {
    await fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [fromStr, toStr, typeFilter, resultFilter, pageSize]);

  const exportXlsx = useCallback(() => {
    if (!currentRows.length) return;
    void (async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Rapor");
      ws.columns = [
        { header: t("reports_col_date"), width: 20 },
        { header: t("reports_col_type"), width: 18 },
        { header: t("reports_col_title"), width: 28 },
        { header: t("reports_col_detail"), width: 45 },
        { header: t("reports_col_client"), width: 22 },
        { header: t("reports_col_created_by"), width: 18 }
      ];
      for (const r of currentRows) {
        const auditText = formatAuditRow(r, t);
        const detailText = structuredDetail(r, auditText, t, lang);
        ws.addRow([
          formatDateTime24(r.at, lang),
          kindLabel(r.kind, t),
          auditText.title,
          detailText,
          r.clientName ?? "—",
          r.createdBy ?? "—"
        ]);
      }
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapor-${fromStr}_${toStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })();
  }, [currentRows, fromStr, lang, t, toStr]);

  const exportPdf = useCallback(async () => {
    if (!currentRows.length) return;
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const vfs = (await import("pdfmake/build/vfs_fonts")).default;
    pdfMake.vfs = vfs;

    const headerRow = [
      t("reports_col_date"),
      t("reports_col_type"),
      t("reports_col_title"),
      t("reports_col_detail"),
      t("reports_col_client"),
      t("reports_col_created_by")
    ];
    const body: { text: string; bold?: boolean }[][] = [
      headerRow.map((h) => ({ text: h, bold: true })),
      ...currentRows.map((r) => [
        ...(function () {
          const auditText = formatAuditRow(r, t);
          const detailText = structuredDetail(r, auditText, t, lang);
          return [
            { text: formatDateTime24(r.at, lang) },
            { text: kindLabel(r.kind, t) },
            { text: auditText.title },
            { text: detailText },
            { text: r.clientName ?? "—" },
            { text: r.createdBy ?? "—" }
          ];
        })()
      ])
    ];

    const title = t("reports_pdf_title");
    const subtitle = `${data?.workspaceName ?? "—"} · ${data ? formatDateTime24(data.from, lang) : "—"} — ${data ? formatDateTime24(data.to, lang) : "—"} · ${t("reports_rows_count", { count: data?.totalRows ?? 0 })}`;

    const docDefinition = {
      pageOrientation: "landscape",
      pageMargins: [24, 36, 24, 36] as [number, number, number, number],
      defaultStyle: { font: "Roboto", fontSize: 8 },
      content: [
        { text: title, style: "h1" },
        { text: subtitle, margin: [0, 4, 0, 12], fontSize: 9, color: "#444444" },
        {
          table: {
            headerRows: 1,
            widths: [72, 68, 100, "*", 72, 64],
            body,
            dontBreakRows: false
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? "#eeeeee" : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#cccccc",
            vLineColor: () => "#cccccc"
          }
        }
      ],
      styles: {
        h1: { fontSize: 14, bold: true }
      }
    };

    pdfMake.createPdf(docDefinition as never).download(`rapor-${fromStr}_${toStr}.pdf`);
  }, [currentRows, data, fromStr, lang, t, toStr]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-h2 font-semibold text-theme-text">{t("reports")}</h1>
        <p className="mt-1 max-w-2xl text-body text-theme-muted">{t("reports_intro")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-theme-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-theme-text">
          {t("reports_from")}
          <input type="date" value={fromStr} onChange={(e) => setFromStr(e.target.value)} className="w-full" />
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-theme-text">
          {t("reports_to")}
          <input type="date" value={toStr} onChange={(e) => setToStr(e.target.value)} className="w-full" />
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-theme-text">
          {t("reports_filter_type")}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as never)} className="w-full">
            <option value="ALL">{t("reports_filter_type_all")}</option>
            <option value="CLIENT">{t("reports_filter_type_client")}</option>
            <option value="NOTE">{t("reports_filter_type_note")}</option>
            <option value="TASK">{t("reports_filter_type_task")}</option>
            <option value="TAG">{t("reports_filter_type_tag")}</option>
            <option value="AUDIT">{t("reports_filter_type_audit")}</option>
          </select>
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-theme-text">
          {t("reports_filter_result")}
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as never)} className="w-full">
            <option value="ALL">{t("reports_filter_result_all")}</option>
            <option value="SUCCESS">{t("reports_filter_result_success")}</option>
            <option value="DENIED">{t("reports_filter_result_denied")}</option>
          </select>
        </label>
        <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-xs font-medium text-theme-text">
          {t("reports_page_size")}
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-full">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="ui-btn-primary px-4 py-2"
          aria-busy={loading}
        >
          {loading ? t("reports_loading") : t("reports_load")}
        </button>
      </div>

      {error ? <p className="text-body text-theme-error">{error}</p> : null}

      {data && !loading ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body text-theme-muted">{t("reports_rows_count", { count: data.totalRows })}</span>
            <span className="text-body text-theme-muted">{t("reports_page_info", { page: data.page })}</span>
            <button
              type="button"
              onClick={() => void exportPdf()}
              disabled={!currentRows.length}
              className="rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-sm hover:bg-theme-subtle disabled:opacity-50"
            >
              {t("reports_export_pdf")}
            </button>
            <button
              type="button"
              onClick={exportXlsx}
              disabled={!currentRows.length}
              className="rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-sm hover:bg-theme-subtle disabled:opacity-50"
            >
              {t("reports_export_xlsx")}
            </button>
            <button
              type="button"
              onClick={() => {
                const nextPage = Math.max(1, page - 1);
                if (nextPage === page) return;
                setPage(nextPage);
                void fetchReports({ page: nextPage });
              }}
              disabled={data.page <= 1}
              className="rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-sm hover:bg-theme-subtle disabled:opacity-50"
            >
              {t("reports_prev_page")}
            </button>
            <button
              type="button"
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                void fetchReports({ page: nextPage });
              }}
              disabled={!data.hasMore}
              className="rounded-lg border border-theme-border bg-theme-card px-3 py-1.5 text-sm hover:bg-theme-subtle disabled:opacity-50"
            >
              {t("reports_next_page")}
            </button>
          </div>

          {currentRows.length === 0 ? (
            <p className="rounded-2xl bg-theme-card p-6 text-center text-body text-theme-muted shadow-sm">{t("reports_empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-sm">
              <table className="min-w-full border-collapse text-left text-body">
                <thead>
                  <tr className="border-b border-theme-border bg-theme-subtle">
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_date")}</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_type")}</th>
                    <th className="min-w-[8rem] px-3 py-2 font-semibold">{t("reports_col_title")}</th>
                    <th className="min-w-[12rem] px-3 py-2 font-semibold">{t("reports_col_detail")}</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_client")}</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_created_by")}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r) => (
                    <tr key={r.id} className="border-b border-theme-border last:border-0">
                      {(() => {
                        const auditText = formatAuditRow(r, t);
                        const detailText = structuredDetail(r, auditText, t, lang);
                        return (
                          <>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-theme-text">
                        {formatDateTime24(r.at, lang)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-theme-text">{kindLabel(r.kind, t)}</td>
                      <td className="max-w-[14rem] px-3 py-2 align-top font-medium text-theme-text">{auditText.title}</td>
                      <td className="max-w-xl px-3 py-2 align-top text-theme-muted">
                        <span className="whitespace-pre-wrap break-words">{detailText}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-theme-text">
                        {r.clientName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-theme-text">
                        {r.createdBy ?? "—"}
                      </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
