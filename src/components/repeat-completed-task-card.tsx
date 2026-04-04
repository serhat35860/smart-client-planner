"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";

type Props = {
  taskId: string;
  title: string;
  clientName: string;
  deadlineIso: string;
  completedAtIso: string;
  articleClassName?: string;
};

export function RepeatCompletedTaskCard({
  taskId,
  title,
  clientName,
  deadlineIso,
  completedAtIso,
  articleClassName
}: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLanguageFromI18n(i18n.language);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const deadline = new Date(deadlineIso);
  const completedAt = new Date(completedAtIso);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function repeatTask() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" })
    });
    setLoading(false);
    if (!res.ok) return;
    setOpen(false);
    router.refresh();
    router.push("/tasks");
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onDoubleClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="cursor-pointer rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
        title={t("repeat_task_double_click")}
        aria-label={t("repeat_task_double_click")}
      >
        <article className={cn("rounded-2xl bg-white p-4", articleClassName ?? "shadow-sm")}>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {clientName} · {formatDateTime24(deadline, lang)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {t("task_completed_on")}: {formatDateTime24(completedAt, lang)}
          </p>
        </article>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="repeat-task-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 id="repeat-task-title" className="mb-2 text-lg font-semibold">
              {t("repeat_task_modal_title")}
            </h3>
            <p className="font-medium text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">
              {clientName} · {formatDateTime24(deadline, lang)}
            </p>
            <p className="mt-3 text-sm text-slate-600">{t("repeat_task_explain")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={repeatTask}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm text-[var(--ui-accent-contrast)]"
                style={{ backgroundColor: "var(--ui-accent)" }}
              >
                {loading ? t("loading") : t("repeat_task")}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm" disabled={loading}>
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
