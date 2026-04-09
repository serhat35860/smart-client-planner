"use client";

import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UI_THEME_PRESETS,
  UI_THEME_DEFAULT_ID,
  UI_THEME_STORAGE_KEY,
  applyUiThemeToDocumentRoot,
  getUiThemePreset,
  resolveUiThemeId
} from "@/lib/ui-theme-presets";

export function ThemePicker() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<string>(UI_THEME_DEFAULT_ID);

  useLayoutEffect(() => {
    const raw = localStorage.getItem(UI_THEME_STORAGE_KEY);
    const id = resolveUiThemeId(raw);
    if (raw && id === UI_THEME_DEFAULT_ID && raw !== UI_THEME_DEFAULT_ID) {
      localStorage.removeItem(UI_THEME_STORAGE_KEY);
    }
    const preset = getUiThemePreset(id);
    applyUiThemeToDocumentRoot(preset);
    setCurrent(preset.id);
  }, []);

  function onChange(nextId: string) {
    const preset = getUiThemePreset(nextId);
    applyUiThemeToDocumentRoot(preset);
    localStorage.setItem(UI_THEME_STORAGE_KEY, preset.id);
    setCurrent(preset.id);
  }

  return (
    <label className="flex items-center gap-2 text-label font-medium text-theme-muted">
      <span className="hidden sm:inline">{t("theme")}</span>
      <select value={current} onChange={(e) => onChange(e.target.value)} className="min-w-[130px] py-1 text-body">
        {UI_THEME_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {t(preset.labelKey as never)}
          </option>
        ))}
      </select>
    </label>
  );
}
