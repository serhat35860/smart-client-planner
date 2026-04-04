"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DateTime24Input, nowDateTimeLocalString } from "@/components/datetime-24-input";
import { NoteBackgroundPicker } from "@/components/note-background-picker";
import { RemindBeforeSelect } from "@/components/remind-before-select";

export function QuickNoteForm({
  clientId,
  onSaved,
  onCancel,
  reminderRequired = false,
  saveButtonKey = "save_note_quickly"
}: {
  clientId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
  reminderRequired?: boolean;
  saveButtonKey?: "save_note_quickly" | "save_reminder";
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [nextActionDate, setNextActionDate] = useState(() =>
    reminderRequired ? nowDateTimeLocalString() : ""
  );
  const [color, setColor] = useState("yellow");
  const [customColor, setCustomColor] = useState("#fff9c4");
  const [remindBeforeMinutes, setRemindBeforeMinutes] = useState(15);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (reminderRequired && !nextActionDate.trim()) return;
    setLoading(true);
    const nextIso = nextActionDate ? new Date(nextActionDate).toISOString() : null;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(clientId ? { clientId } : {}),
        title: title || null,
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        nextActionDate: nextIso,
        remindBeforeMinutes: nextIso ? remindBeforeMinutes : null,
        color
      })
    });
    setLoading(false);
    setContent("");
    setTitle("");
    setTags("");
    setNextActionDate(reminderRequired ? nowDateTimeLocalString() : "");
    setColor("yellow");
    setCustomColor("#fff9c4");
    setRemindBeforeMinutes(15);
    onSaved?.();
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <input placeholder={t("optional_title")} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
      <textarea
        placeholder={clientId ? t("quick_note_placeholder") : t("standalone_quick_note_placeholder")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-24 w-full resize-y"
        required
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input placeholder={t("tags_placeholder")} value={tags} onChange={(e) => setTags(e.target.value)} />
        <div className="flex flex-col gap-1 sm:col-span-1">
          <span className="text-xs text-slate-600">{reminderRequired ? t("reminder_datetime_required") : t("next")}</span>
          <DateTime24Input value={nextActionDate} onChange={setNextActionDate} required={reminderRequired} />
        </div>
        <NoteBackgroundPicker color={color} setColor={setColor} customColor={customColor} setCustomColor={setCustomColor} />
      </div>
      {reminderRequired || nextActionDate.trim() ? (
        <RemindBeforeSelect value={remindBeforeMinutes} onChange={setRemindBeforeMinutes} disabled={!nextActionDate.trim()} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          {loading ? t("saving") : t(saveButtonKey)}
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
