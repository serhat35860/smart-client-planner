export type UiThemePreset = {
  id: string;
  labelKey: string;
  background: string;
  accent: string;
  accentContrast: string;
};

export const UI_THEME_DEFAULT_ID = "default";

export const UI_THEME_STORAGE_KEY = "ui-theme";

export const UI_THEME_PRESETS: UiThemePreset[] = [
  { id: "default", labelKey: "theme_default", background: "#f7f7f5", accent: "#0f172a", accentContrast: "#ffffff" },
  { id: "ocean", labelKey: "theme_ocean", background: "#eff6ff", accent: "#1d4ed8", accentContrast: "#ffffff" },
  { id: "mint", labelKey: "theme_mint", background: "#ecfdf5", accent: "#047857", accentContrast: "#ffffff" },
  { id: "sunset", labelKey: "theme_sunset", background: "#fff7ed", accent: "#c2410c", accentContrast: "#ffffff" },
  { id: "violet", labelKey: "theme_violet", background: "#f5f3ff", accent: "#6d28d9", accentContrast: "#ffffff" },
  { id: "rose", labelKey: "theme_rose", background: "#fff1f2", accent: "#be123c", accentContrast: "#ffffff" },
  { id: "slate", labelKey: "theme_slate", background: "#f8fafc", accent: "#334155", accentContrast: "#ffffff" },
  { id: "graphite", labelKey: "theme_graphite", background: "#111827", accent: "#22c55e", accentContrast: "#0b1220" }
];

const ids = new Set(UI_THEME_PRESETS.map((p) => p.id));

export function resolveUiThemeId(stored: string | null | undefined): string {
  if (!stored || !ids.has(stored)) return UI_THEME_DEFAULT_ID;
  return stored;
}

export function getUiThemePreset(id: string): UiThemePreset {
  return UI_THEME_PRESETS.find((p) => p.id === id) ?? UI_THEME_PRESETS[0];
}

export function applyUiThemeToDocumentRoot(preset: UiThemePreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--ui-bg", preset.background);
  root.style.setProperty("--ui-accent", preset.accent);
  root.style.setProperty("--ui-accent-contrast", preset.accentContrast);
}
