"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "activeTasksMetricFilter";

type Filter = "all" | "incomplete";

export function ActiveTasksMetric({
  allPendingCount,
  incompletePendingCount,
  className,
  syncIncompleteListToUrl,
  urlTaskFilter = "all"
}: {
  allPendingCount: number;
  incompletePendingCount: number;
  className?: string;
  /** Panel: seçim `?activeTasks=incomplete` ile eşlenir ve liste sunucuda gösterilir. */
  syncIncompleteListToUrl?: boolean;
  urlTaskFilter?: Filter;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [localFilter, setLocalFilter] = useState<Filter>("all");

  useEffect(() => {
    if (syncIncompleteListToUrl) return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "all" || v === "incomplete") setLocalFilter(v);
    } catch {
      /* ignore */
    }
  }, [syncIncompleteListToUrl]);

  const filter: Filter = syncIncompleteListToUrl
    ? urlTaskFilter === "incomplete"
      ? "incomplete"
      : "all"
    : localFilter;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as Filter;
    if (syncIncompleteListToUrl) {
      const href = v === "incomplete" ? `${pathname}?activeTasks=incomplete` : pathname;
      router.replace(href, { scroll: false });
      return;
    }
    setLocalFilter(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }

  const count = filter === "all" ? allPendingCount : incompletePendingCount;

  return (
    <div className={cn("rounded-2xl bg-white p-5", className ?? "shadow-sm")}>
      <label className="block text-sm font-medium text-slate-500">
        {t("active_tasks")}
        <select
          value={filter}
          onChange={onChange}
          className="mt-1.5 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--ui-accent)]"
          aria-label={t("active_tasks")}
        >
          <option value="all">{t("active_tasks_filter_all")}</option>
          <option value="incomplete">{t("active_tasks_filter_incomplete")}</option>
        </select>
      </label>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{t("active_tasks_metric_caption")}</p>
    </div>
  );
}
