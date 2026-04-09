"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "dashboardSubsectionViewMode";
const WIDE_SCREEN_MIN_PX = 1600;

function preferredModeByWidth(width: number): "list" | "table" {
  return width >= WIDE_SCREEN_MIN_PX ? "table" : "list";
}

export function DashboardViewModeToggle({ initialMode }: { initialMode: "list" | "table" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const applyMode = (mode: "list" | "table") => {
        if (mode === initialMode) return;
        const next = new URLSearchParams(params.toString());
        if (mode === "list") next.delete("viewMode");
        else next.set("viewMode", "table");
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      };

      if (saved === "list" || saved === "table") {
        applyMode(saved);
        return;
      }

      const syncByWidth = () => applyMode(preferredModeByWidth(window.innerWidth));
      syncByWidth();
      window.addEventListener("resize", syncByWidth);
      return () => window.removeEventListener("resize", syncByWidth);
    } catch {
      /* ignore */
    }
  }, [initialMode, params, pathname, router]);

  function onChange(mode: "list" | "table") {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    const next = new URLSearchParams(params.toString());
    if (mode === "list") next.delete("viewMode");
    else next.set("viewMode", mode);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center justify-end py-0.5">
      <label className="flex flex-wrap items-center gap-2.5 text-body text-theme-text sm:gap-3">
        <span className="text-label font-medium text-theme-muted">{t("dashboard_view_mode_label")}</span>
        <select
          value={initialMode}
          onChange={(e) => onChange(e.target.value as "list" | "table")}
          className="rounded-xl border border-theme-border/70 bg-theme-card/95 px-3 py-2 text-body shadow-sm backdrop-blur-sm transition hover:border-theme-text/12 hover:shadow-[0_2px_8px_-2px_color-mix(in_srgb,var(--color-text)_6%,transparent)]"
        >
          <option value="list">{t("dashboard_view_mode_list")}</option>
          <option value="table">{t("dashboard_view_mode_table")}</option>
        </select>
      </label>
    </div>
  );
}
