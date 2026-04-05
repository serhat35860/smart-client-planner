"use client";

import { useLayoutEffect } from "react";
import {
  UI_THEME_DEFAULT_ID,
  UI_THEME_STORAGE_KEY,
  applyUiThemeToDocumentRoot,
  getUiThemePreset,
  resolveUiThemeId
} from "@/lib/ui-theme-presets";

/** Applies stored UI theme to `:root` after mount; SSR uses `globals.css` defaults so HTML matches first paint. */
export function UiThemeRoot() {
  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(UI_THEME_STORAGE_KEY);
      const id = resolveUiThemeId(raw);
      if (raw && id === UI_THEME_DEFAULT_ID && raw !== UI_THEME_DEFAULT_ID) {
        localStorage.removeItem(UI_THEME_STORAGE_KEY);
      }
      applyUiThemeToDocumentRoot(getUiThemePreset(id));
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
