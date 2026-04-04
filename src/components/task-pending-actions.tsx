"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkDoneButton } from "@/components/mark-done-button";

export function TaskIncompleteReasonBlock({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
      <p className="font-medium text-amber-900">{t("not_completed_reason_label")}</p>
      <p className="mt-1 whitespace-pre-wrap text-amber-950/90">{text}</p>
    </div>
  );
}

export function TaskPendingActions({
  taskId,
  existingReason
}: {
  taskId: string;
  existingReason?: string | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setReason(existingReason?.trim() ? existingReason : "");
      setError(null);
    } else {
      setReason("");
      setError(null);
    }
  }, [open, existingReason]);

  async function saveReason() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t("not_completed_required"));
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notCompletedReason: trimmed })
    });
    setLoading(false);
    if (!res.ok) return;
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <MarkDoneButton taskId={taskId} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
        >
          {t("not_completed_record")}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="incomplete-reason-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="incomplete-reason-title" className="text-base font-semibold text-slate-900">
              {t("not_completed_modal_title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t("not_completed_modal_hint")}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder={t("not_completed_placeholder")}
              disabled={loading}
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={saveReason}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? t("saving") : t("save")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
