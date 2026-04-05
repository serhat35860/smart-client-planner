"use client";

import { useTranslation } from "react-i18next";
import type { CreatorPreview } from "@/lib/creator-preview";

export function AddedByLine({
  creator,
  className,
  position = "flow"
}: {
  creator?: CreatorPreview | null;
  className?: string;
  /** `corner`: kart içi sağ alt (üst öğe `relative` olmalı). */
  position?: "flow" | "corner";
}) {
  const { t } = useTranslation();
  if (!creator) return null;
  const label = creator.name?.trim() || creator.email;
  const text = t("added_by", { name: label });
  if (position === "corner") {
    return (
      <p
        className={
          className ??
          "pointer-events-none absolute bottom-2 right-3 z-[1] max-w-[min(13rem,58%)] text-right text-[11px] leading-snug text-slate-600"
        }
      >
        {text}
      </p>
    );
  }
  return <p className={className ?? "mt-1 text-xs text-slate-500"}>{text}</p>;
}

/** Kart sağ alt: ekleyen + (ekleyen dışında biri müdahale ettiyse) son güncelleyen. */
export function CreatorUpdaterCorner({
  creator,
  updatedBy,
  editedByOtherMember = false
}: {
  creator?: CreatorPreview | null;
  updatedBy?: CreatorPreview | null;
  /** Sunucuda: ekleyen dışında en az bir kayıt olduysa true (ekleyen son düzenleyen olsa bile kalır). */
  editedByOtherMember?: boolean;
}) {
  const { t } = useTranslation();
  const showUpdated = Boolean(updatedBy && editedByOtherMember);
  if (!creator && !showUpdated) return null;
  return (
    <div className="pointer-events-none absolute bottom-2 right-3 z-[1] max-w-[min(13rem,58%)] text-right leading-snug">
      {creator ? (
        <p className="text-[11px] text-slate-600">{t("added_by", { name: creator.name?.trim() || creator.email })}</p>
      ) : null}
      {showUpdated ? (
        <div className="mt-0.5 space-y-0.5">
          <p className="text-[10px] font-medium text-slate-500">{t("updated_by_heading")}</p>
          <p className="text-[10px] text-slate-600">
            {t("last_updated_by_detail", { name: updatedBy!.name?.trim() || updatedBy!.email })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
