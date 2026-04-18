"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreatorUpdaterCorner } from "@/components/added-by-line";
import { TaskCompletionNotesBlock } from "@/components/task-pending-actions";
import { cn } from "@/lib/utils";
import { TaggedMembersChips } from "@/components/tagged-members-chips";
import type { CreatorPreview, NoteMentionMember } from "@/lib/creator-preview";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";
import { noteSurfaceBgStyle } from "@/lib/note-surface";

type Props = {
  taskId: string;
  title: string;
  clientName?: string | null;
  deadlineIso: string;
  completedAtIso: string;
  color?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  completionNotes?: string | null;
  articleClassName?: string;
  createdBy?: CreatorPreview | null;
  updatedBy?: CreatorPreview | null;
  editedByOtherMember?: boolean;
  mentions?: NoteMentionMember[];
};

export function RepeatCompletedTaskCard({
  taskId,
  title,
  clientName,
  deadlineIso,
  completedAtIso,
  color = "yellow",
  priority = "MEDIUM",
  completionNotes = null,
  articleClassName,
  createdBy,
  updatedBy,
  editedByOtherMember = false,
  mentions = []
}: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLanguageFromI18n(i18n.language);
  const showUpdatedCorner = Boolean(updatedBy && editedByOtherMember);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const deadline = new Date(deadlineIso);
  const completedAt = new Date(completedAtIso);

  const priorityClass =
    priority === "HIGH"
      ? "bg-theme-danger-soft text-theme-error"
      : priority === "MEDIUM"
        ? "bg-theme-warning/15 text-theme-warning"
        : "bg-theme-success-soft text-theme-success";

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
        <article
          className={cn(
            "relative rounded-2xl bg-theme-card p-4",
            showUpdatedCorner && createdBy ? "pb-11" : showUpdatedCorner ? "pb-9" : "pb-7",
            articleClassName ?? "shadow-card-lift"
          )}
          style={noteSurfaceBgStyle(color)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 break-words font-semibold text-theme-text">{title}</h3>
            <span className={cn("rounded-full px-2 py-1 text-caption font-medium", priorityClass)}>
              {priority === "HIGH" ? t("priority_high") : priority === "MEDIUM" ? t("priority_medium") : t("priority_low")}
            </span>
          </div>
          <p className="mt-1 text-body text-theme-muted">
            {clientName?.trim() ? `${clientName} · ` : ""}
            {formatDateTime24(deadline, lang)}
          </p>
          <p className="mt-2 text-xs text-theme-muted">
            {t("task_completed_on")}: {formatDateTime24(completedAt, lang)}
          </p>
          {completionNotes?.trim() ? <TaskCompletionNotesBlock text={completionNotes.trim()} /> : null}
          <TaggedMembersChips members={mentions} />
          <CreatorUpdaterCorner
            creator={createdBy}
            updatedBy={updatedBy}
            editedByOtherMember={editedByOtherMember}
          />
        </article>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="repeat-task-title"
        >
          <div className="w-full max-w-[22.5rem] rounded-2xl bg-theme-card p-5 shadow-xl">
            <h3 id="repeat-task-title" className="mb-2 text-h3 font-semibold">
              {t("repeat_task_modal_title")}
            </h3>
            <p className="font-medium text-theme-text">{title}</p>
            <p className="mt-1 text-body text-theme-muted">
              {clientName?.trim() ? `${clientName} · ` : ""}
              {formatDateTime24(deadline, lang)}
            </p>
            <p className="mt-3 text-body text-theme-muted">{t("repeat_task_explain")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={repeatTask}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-button font-medium text-[var(--ui-accent-contrast)]"
                style={{ backgroundColor: "var(--ui-accent)" }}
              >
                {loading ? t("loading") : t("repeat_task")}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-button font-medium" disabled={loading}>
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
