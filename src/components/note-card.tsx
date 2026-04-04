"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";

type Props = {
  title?: string | null;
  content: string;
  createdAt: Date;
  nextActionDate?: Date | null;
  tags: string[];
  color?: string;
  nextLabel: string;
  /** Replaces default shadow-sm when set (e.g. dashboard card lift). */
  surfaceShadowClass?: string;
};

const colorClass: Record<string, string> = {
  yellow: "bg-noteYellow",
  blue: "bg-noteBlue",
  green: "bg-noteGreen",
  pink: "bg-rose-100",
  orange: "bg-orange-100",
  purple: "bg-violet-100",
  gray: "bg-slate-200"
};

export function NoteCard({
  title,
  content,
  createdAt,
  nextActionDate,
  tags,
  color = "yellow",
  nextLabel,
  surfaceShadowClass
}: Props) {
  const { i18n } = useTranslation();
  const lang = appLanguageFromI18n(i18n.language);
  const isHex = color.startsWith("#");
  return (
    <article
      className={cn(
        "rounded-2xl p-4",
        surfaceShadowClass ?? "shadow-sm",
        !isHex && (colorClass[color] ?? colorClass.yellow)
      )}
      style={isHex ? { backgroundColor: color } : undefined}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
        <span>{formatDateTime24(createdAt, lang)}</span>
        {nextActionDate ? (
          <span>
            {nextLabel}: {formatDateTime24(nextActionDate, lang)}
          </span>
        ) : null}
      </div>
      {title ? <h4 className="mb-2 font-semibold">{title}</h4> : null}
      <p className="whitespace-pre-wrap text-sm">{content}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}
