"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { DateTime24Input } from "@/components/datetime-24-input";
import { RemindBeforeSelect } from "@/components/remind-before-select";
import { CreatorUpdaterCorner } from "@/components/added-by-line";
import { NoteMemberPicker } from "@/components/note-member-picker";
import { TaggedMembersChips } from "@/components/tagged-members-chips";
import { cn } from "@/lib/utils";
import { TaskIncompleteReasonBlock, TaskPendingActions } from "@/components/task-pending-actions";
import type { CreatorPreview, NoteMentionMember } from "@/lib/creator-preview";
import { formatDateTime24, appLanguageFromI18n } from "@/lib/format-date";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export type SerializableTask = {
  id: string;
  title: string;
  deadlineIso: string;
  priority: Priority;
  notCompletedReason: string | null;
  remindBeforeMinutes: number | null;
  client: { id: string; companyName: string; contactPerson: string };
  createdBy?: CreatorPreview | null;
  updatedBy?: CreatorPreview | null;
  editedByOtherMember?: boolean;
  mentions?: NoteMentionMember[];
};

type ClientOption = { id: string; companyName: string; contactPerson: string };

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditableTaskRow({ task, nowMs }: { task: SerializableTask; nowMs: number }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLanguageFromI18n(i18n.language);
  const deadlineDate = new Date(task.deadlineIso);
  const overdue = deadlineDate.getTime() < nowMs;
  const showUpdatedCorner = Boolean(task.updatedBy && task.editedByOtherMember);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [deadline, setDeadline] = useState(() => toDatetimeLocalValue(deadlineDate));
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [clientId, setClientId] = useState(task.client.id);
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(task.remindBeforeMinutes ?? 15);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMentionedUserIds, setEditMentionedUserIds] = useState<string[]>(() =>
    (task.mentions ?? []).map((m) => m.userId)
  );

  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setDeadline(toDatetimeLocalValue(new Date(task.deadlineIso)));
    setPriority(task.priority);
    setClientId(task.client.id);
    setRemindBeforeMinutes(task.remindBeforeMinutes ?? 15);
    setEditMentionedUserIds((task.mentions ?? []).map((m) => m.userId));

    let cancelled = false;
    void fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ClientOption[]) => {
        if (!cancelled) setClients(data);
      });
    return () => {
      cancelled = true;
    };
  }, [open, task.id, task.title, task.deadlineIso, task.priority, task.client.id, task.remindBeforeMinutes, task.mentions]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline || !clientId) return;
    setLoading(true);
    const body: Record<string, unknown> = {
      title: title.trim(),
      deadline: new Date(deadline).toISOString(),
      priority,
      clientId,
      remindBeforeMinutes,
      mentionedUserIds: editMentionedUserIds
    };
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setLoading(false);
    if (!res.ok) return;
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <article
        className={cn(
          "relative cursor-pointer rounded-2xl bg-white p-4 shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]",
          showUpdatedCorner && task.createdBy ? "pb-10" : showUpdatedCorner ? "pb-9" : "pb-6"
        )}
        tabIndex={0}
        onDoubleClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        title={t("double_click_to_edit")}
        aria-label={t("double_click_to_edit")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold">{task.title}</h3>
            <p className="text-sm text-slate-600">
              {task.client.companyName} - {formatDateTime24(deadlineDate, lang)}
            </p>
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {overdue ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">{t("overdue")}</span> : null}
            <TaskPendingActions taskId={task.id} existingReason={task.notCompletedReason} />
          </div>
        </div>
        {task.notCompletedReason ? <TaskIncompleteReasonBlock text={task.notCompletedReason} /> : null}
        <TaggedMembersChips members={task.mentions ?? []} />
        <CreatorUpdaterCorner
          creator={task.createdBy}
          updatedBy={task.updatedBy}
          editedByOtherMember={task.editedByOtherMember}
        />
      </article>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-task-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="edit-task-title" className="text-lg font-semibold">
              {t("edit_task")}
            </h2>
            <form onSubmit={save} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-700">
                <span className="mb-1 block font-medium">{t("task_title_placeholder")}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" required />
              </label>
              <div className="block text-sm text-slate-700">
                <span className="mb-1 block font-medium">{t("task_deadline_label")}</span>
                <DateTime24Input value={deadline} onChange={setDeadline} required className="w-full" />
              </div>
              <RemindBeforeSelect value={remindBeforeMinutes} onChange={setRemindBeforeMinutes} />
              <NoteMemberPicker value={editMentionedUserIds} onChange={setEditMentionedUserIds} />
              <label className="block text-sm text-slate-700">
                <span className="mb-1 block font-medium">{t("task_priority_label")}</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="LOW">{t("priority_low")}</option>
                  <option value="MEDIUM">{t("priority_medium")}</option>
                  <option value="HIGH">{t("priority_high")}</option>
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                <span className="mb-1 block font-medium">{t("task_edit_client")}</span>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                >
                  {(clients.length === 0
                    ? [{ id: task.client.id, companyName: task.client.companyName, contactPerson: task.client.contactPerson }]
                    : clients
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} — {c.contactPerson}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? t("saving") : t("save_task")}
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
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
