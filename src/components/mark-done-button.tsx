"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function MarkDoneButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving]);

  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  async function save() {
    setSaving(true);
    try {
      const trimmed = notes.trim();
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DONE",
          completionNotes: trimmed === "" ? null : trimmed
        })
      });
      if (!res.ok) return;
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={saving}
        className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
      >
        {t("done")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-completion-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="task-completion-title" className="text-base font-semibold text-slate-900">
              {t("task_completion_modal_title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t("task_completion_modal_hint")}</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder={t("task_completion_placeholder")}
              disabled={saving}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? t("loading") : t("save")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {t("task_completion_cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
