"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "followupsMetricPeriod";

type Period = "daily" | "weekly" | "monthly";

export function FollowupsMetric({
  dailyCount,
  weeklyCount,
  monthlyCount,
  className
}: {
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("daily");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "daily" || v === "weekly" || v === "monthly") setPeriod(v);
    } catch {
      /* ignore */
    }
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as Period;
    setPeriod(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }

  const count = period === "daily" ? dailyCount : period === "weekly" ? weeklyCount : monthlyCount;

  return (
    <div className={cn("rounded-2xl bg-white p-5", className ?? "shadow-sm")}>
      <label className="block text-sm font-medium text-slate-500">
        {t("followups_metric_label")}
        <select
          value={period}
          onChange={onChange}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--ui-accent)]"
          aria-label={t("followups_metric_label")}
        >
          <option value="daily">{t("followups_period_daily")}</option>
          <option value="weekly">{t("followups_period_weekly")}</option>
          <option value="monthly">{t("followups_period_monthly")}</option>
        </select>
      </label>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{t("followups_metric_caption")}</p>
    </div>
  );
}
