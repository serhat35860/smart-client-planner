"use client";

import { endOfDay, format, parse, startOfDay, startOfMonth } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReportApiResponse, ReportRowJson } from "@/lib/report-types";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";
import * as XLSX from "xlsx";

function kindLabel(kind: ReportRowJson["kind"], t: (k: string) => string) {
  switch (kind) {
    case "client":
      return t("reports_type_client");
    case "note":
      return t("reports_type_note");
    case "task_created":
      return t("reports_type_task_created");
    case "task_completed":
      return t("reports_type_task_completed");
    default:
      return kind;
  }
}

export function ReportsClient() {
  const { t, i18n } = useTranslation();
  const lang = appLanguageFromI18n(i18n.language);

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

  const load = useCallback(async () => {
    setError(null);
    if (!rangeIso) {
      setError(t("reports_invalid_range"));
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?from=${encodeURIComponent(rangeIso.from)}&to=${encodeURIComponent(rangeIso.to)}`
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? t("reports_fetch_error"));
        setData(null);
        return;
      }
      setData((await res.json()) as ReportApiResponse);
    } catch {
      setError(t("reports_fetch_error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [rangeIso, t]);

  const exportXlsx = useCallback(() => {
    if (!data?.rows.length) return;
    const header = [
      t("reports_col_date"),
      t("reports_col_type"),
      t("reports_col_title"),
      t("reports_col_detail"),
      t("reports_col_client"),
      t("reports_col_created_by")
    ];
    const aoa: string[][] = [
      header,
      ...data.rows.map((r) => [
        formatDateTime24(r.at, lang),
        kindLabel(r.kind, t),
        r.title,
        r.detail,
        r.clientName ?? "—",
        r.createdBy ?? "—"
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 45 }, { wch: 22 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapor");
    const fname = `rapor-${fromStr}_${toStr}.xlsx`;
    XLSX.writeFile(wb, fname);
  }, [data, fromStr, lang, t, toStr]);

  const exportPdf = useCallback(async () => {
    if (!data?.rows.length) return;
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
      ...data.rows.map((r) => [
        { text: formatDateTime24(r.at, lang) },
        { text: kindLabel(r.kind, t) },
        { text: r.title },
        { text: r.detail },
        { text: r.clientName ?? "—" },
        { text: r.createdBy ?? "—" }
      ])
    ];

    const title = t("reports_pdf_title");
    const subtitle = `${data.workspaceName} · ${formatDateTime24(data.from, lang)} — ${formatDateTime24(data.to, lang)} · ${t("reports_rows_count", { count: data.rows.length })}`;

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
  }, [data, fromStr, lang, t, toStr]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{t("reports")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{t("reports_intro")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-700">
          {t("reports_from")}
          <input type="date" value={fromStr} onChange={(e) => setFromStr(e.target.value)} className="w-full" />
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-700">
          {t("reports_to")}
          <input type="date" value={toStr} onChange={(e) => setToStr(e.target.value)} className="w-full" />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--ui-accent-contrast)] disabled:opacity-60"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {loading ? t("reports_loading") : t("reports_load")}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {data && !loading ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">{t("reports_rows_count", { count: data.rows.length })}</span>
            <button
              type="button"
              onClick={() => void exportPdf()}
              disabled={!data.rows.length}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {t("reports_export_pdf")}
            </button>
            <button
              type="button"
              onClick={exportXlsx}
              disabled={!data.rows.length}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {t("reports_export_xlsx")}
            </button>
          </div>

          {data.rows.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-sm">{t("reports_empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_date")}</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_type")}</th>
                    <th className="min-w-[8rem] px-3 py-2 font-semibold">{t("reports_col_title")}</th>
                    <th className="min-w-[12rem] px-3 py-2 font-semibold">{t("reports_col_detail")}</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_client")}</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold">{t("reports_col_created_by")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 align-top text-slate-700">
                        {formatDateTime24(r.at, lang)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-slate-700">{kindLabel(r.kind, t)}</td>
                      <td className="max-w-[14rem] px-3 py-2 align-top font-medium text-slate-900">{r.title}</td>
                      <td className="max-w-xl px-3 py-2 align-top text-slate-600">
                        <span className="line-clamp-4 whitespace-pre-wrap">{r.detail}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-slate-700">
                        {r.clientName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-slate-700">
                        {r.createdBy ?? "—"}
                      </td>
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
