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
import { NoteBackgroundPicker, NOTE_PALETTE } from "@/components/note-background-picker";
import { noteSurfaceBgStyle } from "@/lib/note-surface";

type Priority = "LOW" | "MEDIUM" | "HIGH";
const PRIORITY_OPTIONS: Array<{ value: Priority; dotClass: string }> = [
  { value: "LOW", dotClass: "bg-theme-success" },
  { value: "MEDIUM", dotClass: "bg-theme-warning" },
  { value: "HIGH", dotClass: "bg-theme-error" }
];

export type SerializableTask = {
  id: string;
  title: string;
  deadlineIso: string;
  priority: Priority;
  status: "PENDING" | "DONE" | "FAILED";
  color: string;
  notCompletedReason: string | null;
  remindBeforeMinutes: number | null;
  client: { id: string; companyName: string; contactPerson: string } | null;
  assigneeUserId?: string | null;
  acceptedAtIso?: string | null;
  assignee?: CreatorPreview | null;
  createdBy?: CreatorPreview | null;
  updatedBy?: CreatorPreview | null;
  editedByOtherMember?: boolean;
  mentions?: NoteMentionMember[];
};

type ClientOption = { id: string; companyName: string; contactPerson: string };
type MemberOption = { userId: string; name: string | null; email: string };

function priorityBadgeClass(priority: Priority) {
  if (priority === "HIGH") return "bg-theme-danger-soft text-theme-error";
  if (priority === "MEDIUM") return "bg-theme-warning/15 text-theme-warning";
  return "bg-theme-success-soft text-theme-success";
}

function defaultCustomFromColor(color: string) {
  if (color.startsWith("#")) return color;
  const found = NOTE_PALETTE.find((p) => p.id === color);
  return found?.hex ?? "#fefce8";
}

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
  const [color, setColor] = useState(task.color);
  const [customColor, setCustomColor] = useState(() => defaultCustomFromColor(task.color));
  const [clientId, setClientId] = useState(task.client?.id ?? "");
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(task.remindBeforeMinutes ?? 15);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [assigneeUserId, setAssigneeUserId] = useState(task.assigneeUserId ?? "");
  const [editMentionedUserIds, setEditMentionedUserIds] = useState<string[]>(() =>
    (task.mentions ?? []).map((m) => m.userId)
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { id: string } } | null) => {
        if (!cancelled) setCurrentUserId(data?.user?.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setDeadline(toDatetimeLocalValue(new Date(task.deadlineIso)));
    setPriority(task.priority);
    setColor(task.color);
    setCustomColor(defaultCustomFromColor(task.color));
    setClientId(task.client?.id ?? "");
    setRemindBeforeMinutes(task.remindBeforeMinutes ?? 15);
    setAssigneeUserId(task.assigneeUserId ?? "");
    setEditMentionedUserIds((task.mentions ?? []).map((m) => m.userId));

    let cancelled = false;
    void fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ClientOption[]) => {
        if (!cancelled) setClients(data);
      });
    void fetch("/api/workspace/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { members?: MemberOption[] } | null) => {
        if (!cancelled) setMembers(data?.members ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [open, task.id, task.title, task.deadlineIso, task.priority, task.color, task.client?.id, task.assigneeUserId, task.remindBeforeMinutes, task.mentions]);

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
    if (!title.trim() || !deadline) return;
    setLoading(true);
    const body: Record<string, unknown> = {
      title: title.trim(),
      deadline: new Date(deadline).toISOString(),
      priority,
      color,
      clientId: clientId || null,
      remindBeforeMinutes,
      assigneeUserId: assigneeUserId || null,
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
          "relative cursor-pointer rounded-2xl bg-theme-card p-4 shadow-card-lift outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]",
          showUpdatedCorner && task.createdBy ? "pb-10" : showUpdatedCorner ? "pb-9" : "pb-6"
        )}
        style={noteSurfaceBgStyle(task.color)}
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
            <p className="text-body text-theme-muted">
              {task.client?.companyName ? `${task.client.companyName} - ` : ""}
              {formatDateTime24(deadlineDate, lang)}
            </p>
            <p className="text-xs text-theme-muted">
              {task.assignee?.name?.trim() || task.assignee?.email || t("unassigned_member")}
            </p>
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <span className={cn("rounded-full px-2 py-1 text-caption font-medium", priorityBadgeClass(task.priority))}>
              {task.priority === "HIGH" ? t("priority_high") : task.priority === "MEDIUM" ? t("priority_medium") : t("priority_low")}
            </span>
            {overdue ? <span className="rounded-full bg-theme-danger-soft px-2 py-1 text-caption text-theme-error">{t("overdue")}</span> : null}
            {task.status === "FAILED" ? (
              <span className="rounded-full bg-theme-danger-soft px-2 py-1 text-caption font-medium text-theme-error">{t("not_completed_record")}</span>
            ) : null}
            <TaskPendingActions
              taskId={task.id}
              existingReason={task.notCompletedReason}
              showAccept={Boolean(task.assigneeUserId && task.assigneeUserId === currentUserId && !task.acceptedAtIso)}
            />
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-task-title"
        >
          <div className="max-h-[72vh] w-full max-w-[25.5rem] overflow-y-auto rounded-2xl bg-theme-card p-5 shadow-xl">
            <h2 id="edit-task-title" className="text-h3 font-semibold">
              {t("edit_task")}
            </h2>
            <form onSubmit={save} className="mt-4 space-y-3">
              <label className="block text-body text-theme-text">
                <span className="mb-1 block font-medium">{t("task_title_placeholder")}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" required />
              </label>
              <div className="block text-body text-theme-text">
                <span className="mb-1 block font-medium">{t("task_deadline_label")}</span>
                <DateTime24Input value={deadline} onChange={setDeadline} required className="w-full" />
              </div>
              <RemindBeforeSelect value={remindBeforeMinutes} onChange={setRemindBeforeMinutes} />
              <NoteMemberPicker value={editMentionedUserIds} onChange={setEditMentionedUserIds} />
              <label className="block text-body text-theme-text">
                <span className="mb-1 block font-medium">{t("task_priority_label")}</span>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_OPTIONS.map((option) => {
                    const label =
                      option.value === "HIGH"
                        ? t("priority_high")
                        : option.value === "MEDIUM"
                          ? t("priority_medium")
                          : t("priority_low");
                    const active = priority === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-caption font-medium",
                          active
                            ? "border-theme-primary bg-theme-primary text-theme-on-primary"
                            : "border-theme-border bg-theme-card text-theme-text hover:bg-theme-subtle"
                        )}
                        aria-pressed={active}
                      >
                        <span className={cn("inline-block h-2.5 w-2.5 rounded-full", option.dotClass)} aria-hidden />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </label>
              <NoteBackgroundPicker color={color} setColor={setColor} customColor={customColor} setCustomColor={setCustomColor} />
              <label className="block text-body text-theme-text">
                <span className="mb-1 block font-medium">{t("task_edit_client")}</span>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border border-theme-border px-3 py-2"
                >
                  <option value="">{t("unassigned_member")}</option>
                  {(clients.length === 0
                    ? task.client?.id
                      ? [{ id: task.client.id, companyName: task.client.companyName, contactPerson: task.client.contactPerson }]
                      : []
                    : clients
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} — {c.contactPerson}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-body text-theme-text">
                <span className="mb-1 block font-medium">{t("team")}</span>
                <select
                  value={assigneeUserId}
                  onChange={(e) => setAssigneeUserId(e.target.value)}
                  className="w-full rounded-xl border border-theme-border px-3 py-2"
                >
                  <option value="">{t("unassigned_note")}</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {(m.name?.trim() || m.email).toString()}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-theme-primary px-4 py-2 text-button font-medium text-theme-on-primary hover:bg-theme-primary-hover disabled:opacity-50"
                >
                  {loading ? t("saving") : t("save_task")}
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
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
