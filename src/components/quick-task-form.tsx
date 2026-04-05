"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DateTime24Input, nowDateTimeLocalString } from "@/components/datetime-24-input";
import { RemindBeforeSelect } from "@/components/remind-before-select";
import { NoteMemberPicker } from "@/components/note-member-picker";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export function QuickTaskForm({
  clientId,
  onSaved,
  onCancel,
  sectionHeadingsClass
}: {
  clientId: string;
  onSaved?: () => void;
  onCancel?: () => void;
  sectionHeadingsClass?: string;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(() => nowDateTimeLocalString());
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(15);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title: title.trim(),
        deadline: new Date(deadline).toISOString(),
        priority,
        remindBeforeMinutes,
        mentionedUserIds
      })
    });
    setLoading(false);
    if (!res.ok) return;
    setTitle("");
    setDeadline(nowDateTimeLocalString());
    setPriority("MEDIUM");
    setRemindBeforeMinutes(15);
    setMentionedUserIds([]);
    onSaved?.();
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <input
        placeholder={t("task_title_placeholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
        required
      />
      <div className="block text-sm text-slate-700">
        <span className={cn("mb-2 block", sectionHeadingsClass && cn("font-semibold text-slate-900", sectionHeadingsClass))}>
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
      <label className="block text-sm text-slate-700">
        <span className={cn("mb-1 block", sectionHeadingsClass && cn("font-semibold text-slate-900", sectionHeadingsClass))}>
          {t("task_priority_label")}
        </span>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full">
          <option value="LOW">{t("priority_low")}</option>
          <option value="MEDIUM">{t("priority_medium")}</option>
          <option value="HIGH">{t("priority_high")}</option>
        </select>
      </label>
      <NoteMemberPicker value={mentionedUserIds} onChange={setMentionedUserIds} labelClassName={sectionHeadingsClass} />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          {loading ? t("saving") : t("save_task")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            {t("cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
