"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { DateTime24Input } from "@/components/datetime-24-input";
import { NoteCard } from "@/components/note-card";
import { NoteBackgroundPicker, NOTE_PALETTE } from "@/components/note-background-picker";
import { RemindBeforeSelect } from "@/components/remind-before-select";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultCustomFromColor(color: string) {
  if (color.startsWith("#")) return color;
  const found = NOTE_PALETTE.find((p) => p.id === color);
  return found?.hex ?? "#fff9c4";
}

type ClientOption = { id: string; companyName: string; contactPerson: string };

type Props = {
  noteId: string;
  title: string | null;
  content: string;
  createdAt: Date;
  nextActionDate: Date | null;
  tags: string[];
  color: string;
  nextLabel: string;
  clientId: string | null;
  remindBeforeMinutes?: number | null;
  hasLinkedTask?: boolean;
  surfaceShadowClass?: string;
};

export function EditableNoteCard(props: Props) {
  const {
    noteId,
    title,
    content,
    createdAt,
    nextActionDate,
    tags,
    color: initialColor,
    nextLabel,
    clientId,
    remindBeforeMinutes: initialRemindBefore = null,
    hasLinkedTask = false,
    surfaceShadowClass
  } = props;
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title ?? "");
  const [editContent, setEditContent] = useState(content);
  const [editTags, setEditTags] = useState(tags.join(", "));
  const [editNext, setEditNext] = useState("");
  const [editColor, setEditColor] = useState(initialColor);
  const [editCustom, setEditCustom] = useState(() => defaultCustomFromColor(initialColor));
  const [editClientId, setEditClientId] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editRemindBefore, setEditRemindBefore] = useState(initialRemindBefore ?? 15);

  useEffect(() => {
    if (!open) return;
    setEditTitle(title ?? "");
    setEditContent(content);
    setEditTags(tags.join(", "));
    setEditNext(nextActionDate ? toDatetimeLocalValue(new Date(nextActionDate)) : "");
    setEditColor(initialColor);
    setEditCustom(defaultCustomFromColor(initialColor));
    setEditClientId(clientId ?? "");
    setEditRemindBefore(initialRemindBefore ?? 15);
  }, [open, title, content, tags, nextActionDate, initialColor, clientId, initialRemindBefore]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ClientOption[]) => {
        if (!cancelled) setClients(Array.isArray(data) ? data : []);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editContent.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim() || null,
        content: editContent,
        tags: editTags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        nextActionDate: editNext ? new Date(editNext).toISOString() : null,
        remindBeforeMinutes: editNext ? editRemindBefore : null,
        color: editColor,
        clientId: editClientId ? editClientId : null
      })
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  async function convertToTask() {
    if (!editClientId || hasLinkedTask) return;
    setConverting(true);
    const patchRes = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim() || null,
        content: editContent,
        tags: editTags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        nextActionDate: editNext ? new Date(editNext).toISOString() : null,
        remindBeforeMinutes: editNext ? editRemindBefore : null,
        color: editColor,
        clientId: editClientId
      })
    });
    if (!patchRes.ok) {
      setConverting(false);
      return;
    }
    const taskRes = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteId,
        clientId: editClientId,
        title: editTitle.trim() || t("follow_up_note"),
        deadline: new Date(Date.now() + 86400000).toISOString(),
        priority: "MEDIUM"
      })
    });
    setConverting(false);
    if (taskRes.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  async function removeNote() {
    if (!confirm(t("delete_note_confirm"))) return;
    setDeleting(true);
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
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
        title={t("double_click_to_edit")}
        aria-label={t("double_click_to_edit")}
      >
        <NoteCard
          title={title}
          content={content}
          createdAt={createdAt}
          nextActionDate={nextActionDate}
          tags={tags}
          color={initialColor}
          nextLabel={nextLabel}
          surfaceShadowClass={surfaceShadowClass}
        />
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">{t("edit_note")}</h3>
            <form onSubmit={save} className="space-y-2">
              <input placeholder={t("optional_title")} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full" />
              <textarea
                placeholder={t("quick_note_placeholder")}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-28 w-full resize-y"
                required
              />
              <input placeholder={t("tags_placeholder")} value={editTags} onChange={(e) => setEditTags(e.target.value)} className="w-full" />
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{t("next")}</span>
                <DateTime24Input value={editNext} onChange={setEditNext} />
              </div>
              {editNext.trim() ? (
                <RemindBeforeSelect value={editRemindBefore} onChange={setEditRemindBefore} />
              ) : null}
              <label className="block text-sm font-medium text-slate-700">{t("link_to_client")}</label>
              <select
                value={editClientId}
                onChange={(e) => setEditClientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{t("unassigned_note")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} — {c.contactPerson}
                  </option>
                ))}
              </select>
              <NoteBackgroundPicker color={editColor} setColor={setEditColor} customColor={editCustom} setCustomColor={setEditCustom} />
              {editClientId && !hasLinkedTask ? (
                <button
                  type="button"
                  onClick={convertToTask}
                  disabled={loading || deleting || converting}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                >
                  {converting ? t("creating") : t("convert_to_task")}
                </button>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading || deleting || converting}
                  className="rounded-xl px-4 py-2 text-sm text-[var(--ui-accent-contrast)]"
                  style={{ backgroundColor: "var(--ui-accent)" }}
                >
                  {loading ? t("saving") : t("save")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-2 text-sm"
                  disabled={deleting || converting}
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={removeNote}
                  disabled={loading || deleting || converting}
                  className="ml-auto rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  {deleting ? t("deleting") : t("delete_note")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
