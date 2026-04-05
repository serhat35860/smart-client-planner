"use client";

import { useTranslation } from "react-i18next";
import { CreatorUpdaterCorner } from "@/components/added-by-line";
import { cn } from "@/lib/utils";
import { noteSurfaceBgStyle } from "@/lib/note-surface";
import type { CreatorPreview, NoteMentionMember, TagWithCreator } from "@/lib/creator-preview";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";

type Props = {
  title?: string | null;
  content: string;
  createdAt: Date;
  nextActionDate?: Date | null;
  tags: TagWithCreator[];
  color?: string;
  /** Replaces default shadow-sm when set (e.g. dashboard card lift). */
  surfaceShadowClass?: string;
  createdBy?: CreatorPreview | null;
  updatedBy?: CreatorPreview | null;
  editedByOtherMember?: boolean;
  /** Ekip üyesi etiketleri */
  mentions?: NoteMentionMember[];
  /** Hatırlatmalar gibi müşteri bağlamı (kart içi, bağımsız notlarla aynı yüzey). */
  clientLine?: string | null;
};

export function NoteCard({
  title,
  content,
  createdAt,
  nextActionDate,
  tags,
  color = "yellow",
  surfaceShadowClass,
  createdBy,
  updatedBy,
  editedByOtherMember = false,
  mentions = [],
  clientLine
}: Props) {
  const { i18n, t } = useTranslation();
  const lang = appLanguageFromI18n(i18n.language);
  const showUpdatedLine = Boolean(updatedBy && editedByOtherMember);
  const hasFooter = Boolean(createdBy) || showUpdatedLine || mentions.length > 0;
  const footerPad =
    hasFooter && createdBy && showUpdatedLine
      ? "pb-11"
      : hasFooter && showUpdatedLine
        ? "pb-9"
        : hasFooter
          ? "pb-7"
          : "";
  return (
    <article
      className={cn("relative rounded-2xl p-4", footerPad, surfaceShadowClass ?? "shadow-sm")}
      style={noteSurfaceBgStyle(color)}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
        <span>
          <span className="font-medium text-slate-700">{t("note_card_header_created")}: </span>
          {formatDateTime24(createdAt, lang)}
        </span>
        {nextActionDate ? (
          <span className="text-right sm:text-right">
            <span className="font-medium text-slate-700">{t("note_card_header_reminder")}: </span>
            {formatDateTime24(nextActionDate, lang)}
          </span>
        ) : null}
      </div>
      {clientLine ? <p className="mb-2 text-xs text-slate-500">{clientLine}</p> : null}
      {title ? <h4 className="mb-2 font-semibold">{title}</h4> : null}
      <p className="whitespace-pre-wrap text-sm">{content}</p>
      {mentions.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pr-[42%]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600/90">{t("note_mentions_short")}</span>
          {mentions.map((m) => (
            <span
              key={m.userId}
              className="rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-slate-800 ring-1 ring-slate-300/80"
            >
              @{m.name?.trim() || m.email}
            </span>
          ))}
        </div>
      ) : null}
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.name} className="inline-block rounded-full bg-white/70 px-2 py-0.5 text-xs">
              #{tag.name}
            </span>
          ))}
        </div>
      ) : null}
      {createdBy || showUpdatedLine ? (
        <CreatorUpdaterCorner
          creator={createdBy}
          updatedBy={updatedBy}
          editedByOtherMember={editedByOtherMember}
        />
      ) : null}
    </article>
  );
}
