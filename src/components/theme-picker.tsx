"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type ThemePreset = {
  id: string;
  labelKey: string;
  background: string;
  accent: string;
  accentContrast: string;
};

const presets: ThemePreset[] = [
  { id: "default", labelKey: "theme_default", background: "#f7f7f5", accent: "#0f172a", accentContrast: "#ffffff" },
  { id: "ocean", labelKey: "theme_ocean", background: "#eff6ff", accent: "#1d4ed8", accentContrast: "#ffffff" },
  { id: "mint", labelKey: "theme_mint", background: "#ecfdf5", accent: "#047857", accentContrast: "#ffffff" },
  { id: "sunset", labelKey: "theme_sunset", background: "#fff7ed", accent: "#c2410c", accentContrast: "#ffffff" },
  { id: "violet", labelKey: "theme_violet", background: "#f5f3ff", accent: "#6d28d9", accentContrast: "#ffffff" },
  { id: "rose", labelKey: "theme_rose", background: "#fff1f2", accent: "#be123c", accentContrast: "#ffffff" },
  { id: "slate", labelKey: "theme_slate", background: "#f8fafc", accent: "#334155", accentContrast: "#ffffff" },
  { id: "graphite", labelKey: "theme_graphite", background: "#111827", accent: "#22c55e", accentContrast: "#0b1220" }
];

function applyPreset(preset: ThemePreset) {
  const root = document.documentElement;
  root.style.setProperty("--ui-bg", preset.background);
  root.style.setProperty("--ui-accent", preset.accent);
  root.style.setProperty("--ui-accent-contrast", preset.accentContrast);
}

export function ThemePicker() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<string>("default");

  useEffect(() => {
    const saved = localStorage.getItem("ui-theme") ?? "default";
    const preset = presets.find((p) => p.id === saved) ?? presets[0];
    applyPreset(preset);
    setCurrent(preset.id);
  }, []);

  function onChange(nextId: string) {
    const preset = presets.find((p) => p.id === nextId) ?? presets[0];
    applyPreset(preset);
    localStorage.setItem("ui-theme", preset.id);
    setCurrent(preset.id);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <span className="hidden sm:inline">{t("theme")}</span>
      <select value={current} onChange={(e) => onChange(e.target.value)} className="min-w-[130px] py-1 text-xs">
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {t(preset.labelKey as never)}
          </option>
        ))}
      </select>
    </label>
  );
}
