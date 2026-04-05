"use client";

import { useTranslation } from "react-i18next";
import type { NoteMentionMember } from "@/lib/creator-preview";

export function TaggedMembersChips({
  members,
  className,
  chipClassName
}: {
  members: NoteMentionMember[];
  /** Satır kapsayıcı (görev kartı: sağ alttaki «Ekleyen» ile çakışmayı önlemek için pr-[42%]). */
  className?: string;
  chipClassName?: string;
}) {
  const { t } = useTranslation();
  if (members.length === 0) return null;
  const chip =
    chipClassName ??
    "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800 ring-1 ring-slate-300/80";
  return (
    <div className={className ?? "mt-1 flex flex-wrap items-center gap-1.5 pr-[42%]"}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600/90">{t("note_mentions_short")}</span>
      {members.map((m) => (
        <span key={m.userId} className={chip}>
          @{m.name?.trim() || m.email}
        </span>
      ))}
    </div>
  );
}
