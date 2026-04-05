"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "activeTasksMetricFilter";

export type TaskMetricFilter = "all" | "incomplete" | "completed";

function isFilter(v: string | null): v is TaskMetricFilter {
  return v === "all" || v === "incomplete" || v === "completed";
}

export function ActiveTasksMetric({
  completedCount,
  className,
  syncTaskListToUrl,
  urlTaskListFilter = "all"
}: {
  /** Tanımlıysa filtrede "tamamlanan" seçeneği gösterilir. */
  completedCount?: number;
  className?: string;
  /** `?taskFilter=` ile seçim sunucuya yansır (ör. `/dashboard`, `/tasks`). */
  syncTaskListToUrl?: boolean;
  urlTaskListFilter?: TaskMetricFilter;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const showCompletedOption = completedCount !== undefined;
  const [localFilter, setLocalFilter] = useState<TaskMetricFilter>("all");

  useEffect(() => {
    if (syncTaskListToUrl) return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!isFilter(v)) return;
      if (v === "completed" && !showCompletedOption) {
        setLocalFilter("all");
        return;
      }
      setLocalFilter(v);
    } catch {
      /* ignore */
    }
  }, [syncTaskListToUrl, showCompletedOption]);

  const filter: TaskMetricFilter = syncTaskListToUrl ? urlTaskListFilter : localFilter;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as TaskMetricFilter;
    if (syncTaskListToUrl) {
      const href = v === "all" ? pathname : `${pathname}?taskFilter=${v}`;
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

  return (
    <div
      className={cn(
        "flex h-full min-h-[5.25rem] flex-col rounded-2xl p-3 text-[var(--ui-accent-contrast)]",
        className ?? "shadow-sm"
      )}
      style={{ backgroundColor: "var(--ui-accent)" }}
    >
      <label className="flex min-h-0 flex-1 flex-col text-xs font-normal">
        <span className="shrink-0 uppercase tracking-wide leading-tight">{t("active_tasks")}</span>
        <div className="mt-0.5 flex min-h-0 flex-1 flex-col justify-end">
          <select
            value={filter === "completed" && !showCompletedOption ? "all" : filter}
            onChange={onChange}
            className="w-full cursor-pointer rounded-lg border border-slate-200/80 bg-[var(--ui-accent-contrast)] px-2 py-1.5 text-xs font-semibold normal-case text-[var(--ui-accent)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent-contrast)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-accent)]"
            aria-label={t("active_tasks")}
          >
            <option value="all">{t("active_tasks_filter_all")}</option>
            <option value="incomplete">{t("active_tasks_filter_incomplete")}</option>
            {showCompletedOption ? <option value="completed">{t("active_tasks_filter_completed")}</option> : null}
          </select>
        </div>
      </label>
    </div>
  );
}
