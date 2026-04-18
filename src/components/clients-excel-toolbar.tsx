"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function filenameFromContentDisposition(cd: string | null, fallback: string) {
  if (!cd) return fallback;
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
  return m?.[1]?.trim() ? decodeURIComponent(m[1].trim()) : fallback;
}

export function ClientsExcelToolbar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"import" | "export" | "template" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function apiErrorMessage(status: number) {
    return status === 403 ? t("clients_excel_admin_only_hint") : t("clients_excel_error_generic");
  }

  async function downloadTemplate() {
    setBusy("template");
    setMessage(null);
    try {
      const r = await fetch("/api/clients/import/template");
      if (!r.ok) {
        setMessage(apiErrorMessage(r.status));
        return;
      }
      const blob = await r.blob();
      const name = filenameFromContentDisposition(r.headers.get("Content-Disposition"), "musteri-import-sablonu.xlsx");
      downloadBlob(blob, name);
    } finally {
      setBusy(null);
    }
  }

  async function exportList() {
    setBusy("export");
    setMessage(null);
    try {
      const r = await fetch("/api/clients/export");
      if (!r.ok) {
        setMessage(apiErrorMessage(r.status));
        return;
      }
      const blob = await r.blob();
      const name = filenameFromContentDisposition(r.headers.get("Content-Disposition"), "musteriler.xlsx");
      downloadBlob(blob, name);
    } finally {
      setBusy(null);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("import");
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/clients/import", { method: "POST", body: fd });
      const data = (await r.json()) as {
        error?: string;
        parseErrors?: { row: number; message: string }[];
        created?: number;
        errors?: { row: number; message: string }[];
      };
      if (!r.ok) {
        if (r.status === 403) {
          setMessage(t("clients_excel_admin_only_hint"));
          return;
        }
        const parseErrs = data.parseErrors?.length
          ? ` ${data.parseErrors.map((x) => `${t("clients_excel_row")} ${x.row}: ${x.message}`).join("; ")}`
          : "";
        setMessage((data.error ?? t("clients_excel_error_generic")) + parseErrs);
        return;
      }
      const created = data.created ?? 0;
      const errs = data.errors ?? [];
      const errText =
        errs.length > 0
          ? ` ${errs.map((x) => (x.row ? `${t("clients_excel_row")} ${x.row}: ` : "") + x.message).join("; ")}`
          : "";
      setMessage(t("clients_excel_result_summary", { created, errors: errs.length }) + errText);
      router.refresh();
    } catch {
      setMessage(t("clients_excel_error_generic"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadTemplate()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-subtle px-2.5 py-1.5 text-caption font-medium text-theme-fg transition hover:bg-theme-muted/30 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {busy === "template" ? t("clients_excel_downloading") : t("clients_excel_template")}
        </button>
        <button
          type="button"
          onClick={() => void exportList()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-subtle px-2.5 py-1.5 text-caption font-medium text-theme-fg transition hover:bg-theme-muted/30 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {busy === "export" ? t("clients_excel_downloading") : t("clients_excel_export")}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-subtle px-2.5 py-1.5 text-caption font-medium text-theme-fg transition hover:bg-theme-muted/30 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {busy === "import" ? t("clients_excel_importing") : t("clients_excel_import")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => void onPickFile(e)}
        />
      </div>
      {message ? <p className="text-caption text-theme-muted">{message}</p> : null}
    </div>
  );
}
