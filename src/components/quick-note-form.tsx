"use client";

import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DateTime24Input, nowDateTimeLocalString } from "@/components/datetime-24-input";
import { NoteBackgroundPicker } from "@/components/note-background-picker";
import { RemindBeforeSelect } from "@/components/remind-before-select";
import { NoteMemberPicker } from "@/components/note-member-picker";

export function QuickNoteForm({
  clientId,
  onSaved,
  onCancel,
  reminderRequired = false,
  saveButtonKey = "save_note_quickly",
  sectionHeadingsClass,
  stickyFooter = false,
  /** İsteğe bağlı tarih alanı başlığı (varsayılan: `next`). */
  optionalNextDateLabelKey
}: {
  clientId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
  reminderRequired?: boolean;
  saveButtonKey?: "save_note_quickly" | "save_reminder";
  /** Alan başlıkları (ör. `uppercase tracking-wide`). */
  sectionHeadingsClass?: string;
  /** Modal içinde alt aksiyon satırını sabit tutar. */
  stickyFooter?: boolean;
  optionalNextDateLabelKey?: string;
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
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
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
        color,
        mentionedUserIds
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
    setMentionedUserIds([]);
    onSaved?.();
  }

  const dateHeading = reminderRequired
    ? t("reminder_datetime_required")
    : t(optionalNextDateLabelKey ?? "next");
  const showRemindBefore = reminderRequired || Boolean(nextActionDate.trim());
  const frameReminderSection = Boolean(optionalNextDateLabelKey);

  const remindBeforeRow = (
    <RemindBeforeSelect
      value={remindBeforeMinutes}
      onChange={setRemindBeforeMinutes}
      disabled={!nextActionDate.trim()}
      labelClassName={sectionHeadingsClass}
    />
  );

  const dateFields = (
    <>
      <div
        className={cn(
          "flex items-center gap-2",
          frameReminderSection && "border-b border-theme-border/90 pb-2"
        )}
      >
        {frameReminderSection ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-theme-subtle-hover text-[var(--ui-accent)] ring-1 ring-[var(--ui-accent)]/25"
            aria-hidden
          >
            <CalendarClock className="h-4 w-4" strokeWidth={2} />
          </span>
        ) : null}
        <span
          className={cn(
            "text-xs font-medium text-theme-text",
            frameReminderSection && "text-[13px] tracking-wide text-theme-text",
            sectionHeadingsClass
          )}
        >
          {dateHeading}
        </span>
      </div>
      <DateTime24Input
        value={nextActionDate}
        onChange={setNextActionDate}
        required={reminderRequired}
        labelClassName={sectionHeadingsClass}
      />
    </>
  );

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl bg-theme-card p-4 shadow-sm",
        stickyFooter ? "grid h-full min-h-0 max-h-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden" : "space-y-2"
      )}
    >
      <div className={cn(stickyFooter ? "min-h-0 basis-0 flex-1 space-y-2 overflow-y-auto pr-1" : "space-y-2")}>
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
          {frameReminderSection ? (
            <div className="rounded-xl border-2 border-[var(--ui-accent)]/35 bg-theme-subtle p-3 shadow-sm ring-1 ring-[var(--ui-accent)]/15 sm:col-span-1">
              <div className="space-y-2">
                {dateFields}
                {showRemindBefore ? <div className="border-t border-theme-border/80 pt-2">{remindBeforeRow}</div> : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 sm:col-span-1">{dateFields}</div>
          )}
          <NoteBackgroundPicker
            color={color}
            setColor={setColor}
            customColor={customColor}
            setCustomColor={setCustomColor}
            headingClassName={sectionHeadingsClass}
          />
        </div>
        {!frameReminderSection && showRemindBefore ? remindBeforeRow : null}
        <NoteMemberPicker value={mentionedUserIds} onChange={setMentionedUserIds} labelClassName={sectionHeadingsClass} />
      </div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          stickyFooter ? "mt-2 shrink-0 border-t border-theme-border pt-3" : "pt-1"
        )}
      >
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-theme-primary px-4 py-2 text-button font-medium text-theme-on-primary hover:bg-theme-primary-hover"
        >
          {loading ? t("saving") : t(saveButtonKey)}
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
