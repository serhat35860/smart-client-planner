"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { REMIND_BEFORE_MINUTES_OPTIONS } from "@/lib/remind-before-options";

export function RemindBeforeSelect({
  value,
  onChange,
  disabled,
  id,
  labelClassName
}: {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  id?: string;
  labelClassName?: string;
}) {
  const { t } = useTranslation();
  return (
    <label className="block text-body text-theme-text">
      <span className={cn("mb-1 block text-xs font-medium text-theme-text", labelClassName)}>{t("remind_before_label")}</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-theme-border bg-theme-card px-3 py-2 text-sm outline-none focus:border-[var(--ui-accent)] disabled:opacity-60"
      >
        {REMIND_BEFORE_MINUTES_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {t(`remind_before_option_${m}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
