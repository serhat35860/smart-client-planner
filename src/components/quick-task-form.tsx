"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DateTime24Input, nowDateTimeLocalString } from "@/components/datetime-24-input";
import { RemindBeforeSelect } from "@/components/remind-before-select";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export function QuickTaskForm({
  clientId,
  onSaved,
  onCancel
}: {
  clientId: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(() => nowDateTimeLocalString());
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(15);
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
        remindBeforeMinutes
      })
    });
    setLoading(false);
    if (!res.ok) return;
    setTitle("");
    setDeadline(nowDateTimeLocalString());
    setPriority("MEDIUM");
    setRemindBeforeMinutes(15);
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
        <span className="mb-2 block">{t("task_deadline_label")}</span>
        <DateTime24Input value={deadline} onChange={setDeadline} required className="w-full" />
      </div>
      <RemindBeforeSelect value={remindBeforeMinutes} onChange={setRemindBeforeMinutes} />
      <label className="block text-sm text-slate-700">
        <span className="mb-1 block">{t("task_priority_label")}</span>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full">
          <option value="LOW">{t("priority_low")}</option>
          <option value="MEDIUM">{t("priority_medium")}</option>
          <option value="HIGH">{t("priority_high")}</option>
        </select>
      </label>
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
