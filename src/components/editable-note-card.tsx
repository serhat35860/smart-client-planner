"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { DateTime24Input } from "@/components/datetime-24-input";
import { NoteCard } from "@/components/note-card";
import { NoteBackgroundPicker, NOTE_PALETTE } from "@/components/note-background-picker";
import { RemindBeforeSelect } from "@/components/remind-before-select";
import { NoteMemberPicker } from "@/components/note-member-picker";
import type { CreatorPreview, NoteMentionMember, TagWithCreator } from "@/lib/creator-preview";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";
import { noteSurfaceBgStyle } from "@/lib/note-surface";
import { cn } from "@/lib/utils";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultCustomFromColor(color: string) {
  if (color.startsWith("#")) return color;
  const found = NOTE_PALETTE.find((p) => p.id === color);
  return found?.hex ?? "#fff9c4";
}

function compactChipPrimaryLine(noteTitle: string | null, body: string) {
  const head = noteTitle?.trim();
  if (head) return head.length > 42 ? `${head.slice(0, 42)}…` : head;
  const one = body.trim().replace(/\s+/g, " ");
  if (!one) return "…";
  return one.length > 46 ? `${one.slice(0, 46)}…` : one;
}

type ClientOption = { id: string; companyName: string; contactPerson: string };

type Props = {
  noteId: string;
  title: string | null;
  content: string;
  createdAt: Date;
  nextActionDate: Date | null;
  tags: TagWithCreator[];
  color: string;
  clientId: string | null;
  remindBeforeMinutes?: number | null;
  hasLinkedTask?: boolean;
  surfaceShadowClass?: string;
  createdBy?: CreatorPreview | null;
  updatedBy?: CreatorPreview | null;
  editedByOtherMember?: boolean;
  mentions?: NoteMentionMember[];
  /** Müşteri / atanmamış satırı (kart içi). */
  clientLine?: string | null;
  /** `compact`: küçük çift tıklamalı düğme + önce okuma modali. */
  listPresentation?: "card" | "compact";
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
    clientId,
    remindBeforeMinutes: initialRemindBefore = null,
    hasLinkedTask = false,
    surfaceShadowClass,
    createdBy,
    updatedBy,
    editedByOtherMember = false,
    mentions = [],
    clientLine,
    listPresentation = "card"
  } = props;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLanguageFromI18n(i18n.language);
  const [open, setOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("edit");
  const [editTitle, setEditTitle] = useState(title ?? "");
  const [editContent, setEditContent] = useState(content);
  const [editTags, setEditTags] = useState(tags.map((x) => x.name).join(", "));
  const [editNext, setEditNext] = useState("");
  const [editColor, setEditColor] = useState(initialColor);
  const [editCustom, setEditCustom] = useState(() => defaultCustomFromColor(initialColor));
  const [editClientId, setEditClientId] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editRemindBefore, setEditRemindBefore] = useState(initialRemindBefore ?? 15);
  const [editMentionedUserIds, setEditMentionedUserIds] = useState<string[]>(() =>
    mentions.map((m) => m.userId)
  );

  useEffect(() => {
    if (!open || sheetMode !== "edit") return;
    setEditTitle(title ?? "");
    setEditContent(content);
    setEditTags(tags.map((x) => x.name).join(", "));
    setEditNext(nextActionDate ? toDatetimeLocalValue(new Date(nextActionDate)) : "");
    setEditColor(initialColor);
    setEditCustom(defaultCustomFromColor(initialColor));
    setEditClientId(clientId ?? "");
    setEditRemindBefore(initialRemindBefore ?? 15);
    setEditMentionedUserIds(mentions.map((m) => m.userId));
  }, [open, sheetMode, title, content, tags, nextActionDate, initialColor, clientId, initialRemindBefore, mentions]);

  useEffect(() => {
    if (!open || sheetMode !== "edit") return;
    let cancelled = false;
    void fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ClientOption[]) => {
        if (!cancelled) setClients(Array.isArray(data) ? data : []);
      });
    return () => {
      cancelled = true;
    };
  }, [open, sheetMode]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (sheetMode === "view") setOpen(false);
      else if (listPresentation === "compact") setSheetMode("view");
      else setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sheetMode, listPresentation]);

  function openFromCompact() {
    setSheetMode("view");
    setOpen(true);
  }

  function openCardEdit() {
    setSheetMode("edit");
    setOpen(true);
  }

  function cancelEditForm() {
    if (listPresentation === "compact") {
      setEditTitle(title ?? "");
      setEditContent(content);
      setEditTags(tags.map((x) => x.name).join(", "));
      setEditNext(nextActionDate ? toDatetimeLocalValue(new Date(nextActionDate)) : "");
      setEditColor(initialColor);
      setEditCustom(defaultCustomFromColor(initialColor));
      setEditClientId(clientId ?? "");
      setEditRemindBefore(initialRemindBefore ?? 15);
      setEditMentionedUserIds(mentions.map((m) => m.userId));
      setSheetMode("view");
    } else {
      setOpen(false);
    }
  }

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
        clientId: editClientId ? editClientId : null,
        mentionedUserIds: editMentionedUserIds
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
        clientId: editClientId,
        mentionedUserIds: editMentionedUserIds
      })
    });
    if (!patchRes.ok) {
      setConverting(false);
      return;
    }
    const deadlineIso = editNext.trim()
      ? new Date(editNext).toISOString()
      : new Date(Date.now() + 86400000).toISOString();
    const taskRes = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteId,
        clientId: editClientId,
        title: editTitle.trim() || t("follow_up_note"),
        deadline: deadlineIso,
        priority: "MEDIUM",
        remindBeforeMinutes: editNext.trim() ? editRemindBefore : 15,
        mentionedUserIds: editMentionedUserIds
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
      {listPresentation === "compact" ? (
        <button
          type="button"
          onDoubleClick={(e) => {
            e.preventDefault();
            openFromCompact();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFromCompact();
            }
          }}
          className="max-w-[220px] min-w-[10rem] cursor-pointer select-none rounded-xl border border-slate-900/10 px-3 py-2 text-left shadow-sm outline-none transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] focus-visible:ring-offset-2 active:scale-[0.99]"
          style={noteSurfaceBgStyle(initialColor)}
          title={t("client_note_compact_hint")}
          aria-label={t("client_note_compact_hint")}
        >
          <span className="block truncate text-sm font-semibold text-slate-900">
            {compactChipPrimaryLine(title, content)}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
            {nextActionDate ? formatDateTime24(nextActionDate, lang) : formatDateTime24(createdAt, lang)}
          </span>
        </button>
      ) : (
        <div className="rounded-2xl">
          <div
            role="button"
            tabIndex={0}
            onDoubleClick={openCardEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openCardEdit();
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
              surfaceShadowClass={surfaceShadowClass}
              createdBy={createdBy}
              updatedBy={updatedBy}
              editedByOtherMember={editedByOtherMember}
              mentions={mentions}
              clientLine={clientLine}
            />
          </div>
        </div>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={sheetMode === "view" ? "note-view-title" : "note-edit-title"}
          onClick={() => {
            if (sheetMode === "view") setOpen(false);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sheetMode === "view" ? (
              <div className="space-y-2">
                <h2 id="note-view-title" className="text-lg font-bold text-slate-900">
                  {title?.trim() ? title : t("note_no_title")}
                </h2>
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">{t("note_card_header_created")}: </span>
                  {formatDateTime24(createdAt, lang)}
                  {nextActionDate ? (
                    <>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="font-medium text-slate-600">{t("note_card_header_reminder")}: </span>
                      {formatDateTime24(nextActionDate, lang)}
                    </>
                  ) : null}
                </p>
                <div className="mt-4 max-h-[min(50vh,24rem)] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/90 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{content}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setSheetMode("edit")}
                    className="rounded-xl px-4 py-2 text-sm text-[var(--ui-accent-contrast)]"
                    style={{ backgroundColor: "var(--ui-accent)" }}
                  >
                    {t("note_view_edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    {t("close")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 id="note-edit-title" className="mb-3 text-lg font-bold text-slate-900">
                  {t("edit_note")}
                </h3>
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
              <NoteMemberPicker value={editMentionedUserIds} onChange={setEditMentionedUserIds} />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-900">{t("quick_option_reminder")}</span>
                <DateTime24Input value={editNext} onChange={setEditNext} />
              </div>
              {editNext.trim() ? (
                <RemindBeforeSelect value={editRemindBefore} onChange={setEditRemindBefore} />
              ) : null}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-900">{t("link_to_client")}</span>
                <select
                  id="edit-note-link-client"
                  aria-label={t("link_to_client")}
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
              </div>
              <NoteBackgroundPicker color={editColor} setColor={setEditColor} customColor={editCustom} setCustomColor={setEditCustom} />
              {!hasLinkedTask ? (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                  <p className="text-xs font-semibold text-slate-900">{t("convert_to_task_section_title")}</p>
                  <button
                    type="button"
                    onClick={convertToTask}
                    disabled={loading || deleting || converting || !editClientId}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {converting ? t("creating") : t("convert_to_task")}
                  </button>
                  {!editClientId ? (
                    <p className="text-xs text-slate-500">{t("convert_to_task_requires_client")}</p>
                  ) : null}
                </div>
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
                  onClick={cancelEditForm}
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
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
