"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkDoneButton } from "@/components/mark-done-button";

export function TaskIncompleteReasonBlock({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg border border-theme-warning/35 bg-theme-warning-soft px-3 py-2 text-xs text-theme-text">
      <p className="font-medium text-theme-text">{t("not_completed_reason_label")}</p>
      <p className="mt-1 whitespace-pre-wrap text-theme-muted">{text}</p>
    </div>
  );
}

export function TaskCompletionNotesBlock({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg border border-theme-success/35 bg-theme-success-soft px-3 py-2 text-xs text-theme-text">
      <p className="font-medium text-theme-text">{t("task_completion_notes_label")}</p>
      <p className="mt-1 whitespace-pre-wrap text-theme-muted">{text}</p>
    </div>
  );
}

export function TaskPendingActions({
  taskId,
  existingReason,
  showAccept = false
}: {
  taskId: string;
  existingReason?: string | null;
  showAccept?: boolean;
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
      body: JSON.stringify({ status: "FAILED", notCompletedReason: trimmed })
    });
    setLoading(false);
    if (!res.ok) return;
    setOpen(false);
    router.refresh();
  }

  async function acceptTask() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptTask: true })
    });
    setLoading(false);
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col items-stretch gap-2">
        <MarkDoneButton taskId={taskId} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-theme-border px-2 py-1 text-xs hover:bg-theme-subtle"
        >
          {t("not_completed_record")}
        </button>
        {showAccept ? (
          <button
            type="button"
            onClick={() => void acceptTask()}
            disabled={loading}
            className="rounded-lg border border-theme-primary/50 bg-theme-primary/10 px-2 py-1 text-xs text-theme-primary hover:bg-theme-primary/20 disabled:opacity-50"
          >
            {t("task_take")}
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="incomplete-reason-title"
        >
          <div className="max-h-[72vh] w-full max-w-[25.5rem] overflow-y-auto rounded-2xl bg-theme-card p-5 shadow-xl">
            <h2 id="incomplete-reason-title" className="text-h2 font-semibold text-theme-text">
              {t("not_completed_modal_title")}
            </h2>
            <p className="mt-1 text-body text-theme-muted">{t("not_completed_modal_hint")}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-xl border border-theme-border px-3 py-2 text-body outline-none focus:border-theme-primary"
              placeholder={t("not_completed_placeholder")}
              disabled={loading}
            />
            {error ? <p className="mt-2 text-body text-theme-error">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={saveReason}
                className="rounded-xl bg-theme-primary px-4 py-2 text-button font-medium text-theme-on-primary hover:bg-theme-primary-hover disabled:opacity-50"
              >
                {loading ? t("saving") : t("save")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-theme-border px-4 py-2 text-button font-medium hover:bg-theme-subtle"
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
