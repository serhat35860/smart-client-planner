"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function todayLocalDateString() {
  const x = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

/** Bugün + şu anki saat/dakika (`YYYY-MM-DDTHH:mm`). */
export function nowDateTimeLocalString(from: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}T${pad(from.getHours())}:${pad(from.getMinutes())}`;
}

/** `YYYY-MM-DDTHH:mm` (datetime-local uyumlu, saat her zaman 00–23). */
export function parseDateTimeLocalValue(isoLike: string): { d: string; h: string; m: string } {
  const s = isoLike.trim();
  if (!s) {
    const x = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return { d: "", h: pad(x.getHours()), m: pad(x.getMinutes()) };
  }
  const [datePart, timePart] = s.split("T");
  if (!datePart) return { d: "", h: "12", m: "00" };
  const tp = timePart ?? "12:00";
  const [hh = "12", mm = "00"] = tp.split(":");
  return {
    d: datePart,
    h: hh.slice(0, 2).padStart(2, "0"),
    m: mm.slice(0, 2).padStart(2, "0")
  };
}

export function joinDateTimeLocal(d: string, h: string, m: string) {
  if (!d) return "";
  return `${d}T${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

type Props = {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
  /** Alan etiketleri (ör. hızlı işlem modallarında büyük harf). */
  labelClassName?: string;
};

/** Tarih + saat; saat ve dakika yalnızca 24 saatlik (00–23, 00–59) açılır listeler. */
export function DateTime24Input({ value, onChange, required, className, id, labelClassName }: Props) {
  const { t } = useTranslation();
  const { d, h, m } = useMemo(() => parseDateTimeLocalValue(value), [value]);

  function setDate(newD: string) {
    if (!newD) {
      onChange("");
      return;
    }
    onChange(joinDateTimeLocal(newD, h, m));
  }

  function setHour(newH: string) {
    onChange(joinDateTimeLocal(d || todayLocalDateString(), newH, m));
  }

  function setMinute(newM: string) {
    onChange(joinDateTimeLocal(d || todayLocalDateString(), h, newM));
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)} id={id}>
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <span className={cn("text-xs font-medium text-theme-text", labelClassName)}>{t("datetime24_date")}</span>
        <input type="date" value={d} onChange={(e) => setDate(e.target.value)} required={required} className="w-full" />
      </label>
      <div className="flex flex-col gap-1">
        <span className={cn("text-xs font-medium text-theme-text", labelClassName)}>{t("datetime24_time_24h")}</span>
        <div className="flex items-center gap-1">
          <select
            value={h}
            onChange={(e) => setHour(e.target.value)}
            className="rounded-lg border border-theme-border bg-theme-card px-2 py-1.5 text-sm"
            aria-label={t("datetime24_hour")}
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
          <span className="pb-1 text-theme-muted" aria-hidden>
            :
          </span>
          <select
            value={m}
            onChange={(e) => setMinute(e.target.value)}
            className="rounded-lg border border-theme-border bg-theme-card px-2 py-1.5 text-sm"
            aria-label={t("datetime24_minute")}
          >
            {MINUTES.map((min) => (
              <option key={min} value={min}>
                {min}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
