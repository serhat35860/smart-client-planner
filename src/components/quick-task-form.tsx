"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DateTime24Input, nowDateTimeLocalString } from "@/components/datetime-24-input";
import { RemindBeforeSelect } from "@/components/remind-before-select";
import { NoteMemberPicker } from "@/components/note-member-picker";
import { NoteBackgroundPicker, NOTE_PALETTE } from "@/components/note-background-picker";

type Priority = "LOW" | "MEDIUM" | "HIGH";
const PRIORITY_OPTIONS: Array<{ value: Priority; dotClass: string }> = [
  { value: "LOW", dotClass: "bg-theme-success" },
  { value: "MEDIUM", dotClass: "bg-theme-warning" },
  { value: "HIGH", dotClass: "bg-theme-error" }
];

function defaultCustomFromColor(color: string) {
  if (color.startsWith("#")) return color;
  const found = NOTE_PALETTE.find((p) => p.id === color);
  return found?.hex ?? "#fefce8";
}

export function QuickTaskForm({
  clientId,
  onSaved,
  onCancel,
  sectionHeadingsClass,
  stickyFooter = false
}: {
  clientId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
  sectionHeadingsClass?: string;
  stickyFooter?: boolean;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(() => nowDateTimeLocalString());
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [color, setColor] = useState("yellow");
  const [customColor, setCustomColor] = useState(() => defaultCustomFromColor("yellow"));
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(15);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [assigneeUserId, setAssigneeUserId] = useState<string>("");
  const [members, setMembers] = useState<Array<{ userId: string; name: string | null; email: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; companyName: string; contactPerson: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/workspace/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { members?: Array<{ userId: string; name: string | null; email: string }> } | null) => {
        if (cancelled) return;
        setMembers(data?.members ?? []);
      });
    void fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ id: string; companyName: string; contactPerson: string }>) => {
        if (cancelled) return;
        setClients(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedClientId(clientId ?? "");
  }, [clientId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedClientId || null,
        title: title.trim(),
        deadline: new Date(deadline).toISOString(),
        priority,
        color,
        remindBeforeMinutes,
        mentionedUserIds,
        assigneeUserId: assigneeUserId || null
      })
    });
    setLoading(false);
    if (!res.ok) return;
    setTitle("");
    setDeadline(nowDateTimeLocalString());
    setPriority("MEDIUM");
    setColor("yellow");
    setCustomColor(defaultCustomFromColor("yellow"));
    setRemindBeforeMinutes(15);
    setMentionedUserIds([]);
    setAssigneeUserId("");
    setSelectedClientId(clientId ?? "");
    onSaved?.();
  }

  return (
    <form
      onSubmit={submit}
      className={cn("rounded-2xl bg-theme-card p-4 shadow-sm", stickyFooter ? "flex h-full min-h-0 flex-col" : "space-y-2")}
    >
      <div className={cn(stickyFooter ? "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" : "space-y-2")}>
        <input
          placeholder={t("task_title_placeholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
          required
        />
        <div className="block text-body text-theme-text">
          <span className={cn("mb-2 block", sectionHeadingsClass && cn("font-semibold text-theme-text", sectionHeadingsClass))}>
            {t("task_deadline_label")}
          </span>
          <DateTime24Input
            value={deadline}
            onChange={setDeadline}
            required
            className="w-full"
            labelClassName={sectionHeadingsClass}
          />
        </div>
        <RemindBeforeSelect value={remindBeforeMinutes} onChange={setRemindBeforeMinutes} labelClassName={sectionHeadingsClass} />
        <label className="block text-body text-theme-text">
          <span className={cn("mb-1 block", sectionHeadingsClass && cn("font-semibold text-theme-text", sectionHeadingsClass))}>
            {t("task_priority_label")}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITY_OPTIONS.map((option) => {
              const label =
                option.value === "HIGH" ? t("priority_high") : option.value === "MEDIUM" ? t("priority_medium") : t("priority_low");
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
          <span className={cn("mb-1 block", sectionHeadingsClass && cn("font-semibold text-theme-text", sectionHeadingsClass))}>
            {t("task_edit_client")}
          </span>
          <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full">
            <option value="">{t("unassigned_note")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} — {c.contactPerson}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-body text-theme-text">
          <span className={cn("mb-1 block", sectionHeadingsClass && cn("font-semibold text-theme-text", sectionHeadingsClass))}>
            {t("team")}
          </span>
          <select value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)} className="w-full">
            <option value="">{t("unassigned_member")}</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {(m.name?.trim() || m.email).toString()}
              </option>
            ))}
          </select>
        </label>
        <NoteMemberPicker value={mentionedUserIds} onChange={setMentionedUserIds} labelClassName={sectionHeadingsClass} />
      </div>
      <div className={cn("flex flex-wrap items-center gap-2", stickyFooter ? "mt-2 shrink-0 border-t border-theme-border pt-3" : "pt-1")}>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-theme-primary px-4 py-2 text-button font-medium text-theme-on-primary hover:bg-theme-primary-hover"
        >
          {loading ? t("saving") : t("save_task")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-theme-border px-4 py-2 text-button font-medium hover:bg-theme-subtle"
          >
            {t("cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
