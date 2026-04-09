import { UI_THEME_DEFAULT_COLOR_TOKENS } from "@/lib/ui-theme-default-tokens";

const D = UI_THEME_DEFAULT_COLOR_TOKENS;

export type UiThemePreset = {
  id: string;
  labelKey: string;
  background: string;
  accent: string;
  accentContrast: string;
  primaryHover?: string;
  card?: string;
  text?: string;
  textSecondary?: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
  onPrimary?: string;
  header?: string;
};

export const UI_THEME_DEFAULT_ID = "warm";

export const UI_THEME_STORAGE_KEY = "ui-theme";

/** 1 Warm (varsayılan, turuncu CRM) · 2 Default (SaaS mavi) · 3 Dark Pro · 4 Minimal (gri) */
export const UI_THEME_PRESETS: UiThemePreset[] = [
  {
    id: "warm",
    labelKey: "theme_warm",
    background: "#FFFBF5",
    accent: "#EA580C",
    accentContrast: "#FFFFFF",
    primaryHover: "#C2410C",
    card: "#FFFFFF",
    text: "#1C1917",
    textSecondary: "#78716C",
    border: "#FED7AA",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    onPrimary: "#FFFFFF",
    header: "#FFFFFF"
  },
  {
    id: "default",
    labelKey: "theme_default",
    background: D.bg,
    accent: D.primary,
    accentContrast: D.onPrimary,
    primaryHover: D.primaryHover,
    card: D.card,
    text: D.text,
    textSecondary: D.textSecondary,
    border: D.border,
    success: D.success,
    warning: D.warning,
    error: D.error,
    onPrimary: D.onPrimary,
    header: D.card
  },
  {
    id: "dark_pro",
    labelKey: "theme_dark_pro",
    background: "#0F172A",
    accent: "#3B82F6",
    accentContrast: "#FFFFFF",
    primaryHover: "#2563EB",
    card: "#1E293B",
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    border: "#334155",
    success: "#22C55E",
    warning: "#FACC15",
    error: "#EF4444",
    onPrimary: "#FFFFFF",
    header: "#334155"
  },
  {
    id: "minimal",
    labelKey: "theme_minimal",
    background: "#F9FAFB",
    accent: "#6B7280",
    accentContrast: "#FFFFFF",
    primaryHover: "#4B5563",
    card: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    onPrimary: "#FFFFFF",
    header: "#FFFFFF"
  }
];

const ids = new Set(UI_THEME_PRESETS.map((p) => p.id));

export function resolveUiThemeId(stored: string | null | undefined): string {
  if (!stored || !ids.has(stored)) return UI_THEME_DEFAULT_ID;
  return stored;
}

export function getUiThemePreset(id: string): UiThemePreset {
  return UI_THEME_PRESETS.find((p) => p.id === id) ?? UI_THEME_PRESETS[0];
}

function mergeTokens(preset: UiThemePreset) {
  const bg = preset.background;
  const primary = preset.accent;
  const onPrimary = preset.onPrimary ?? preset.accentContrast;
  return {
    bg,
    card: preset.card ?? D.card,
    header: preset.header ?? preset.card ?? D.card,
    primary,
    primaryHover: preset.primaryHover ?? D.primaryHover,
    text: preset.text ?? D.text,
    textSecondary: preset.textSecondary ?? D.textSecondary,
    border: preset.border ?? D.border,
    success: preset.success ?? D.success,
    warning: preset.warning ?? D.warning,
    error: preset.error ?? D.error,
    onPrimary
  };
}

export function applyUiThemeToDocumentRoot(preset: UiThemePreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const t = mergeTokens(preset);

  root.style.setProperty("--color-bg", t.bg);
  root.style.setProperty("--color-card", t.card);
  root.style.setProperty("--color-header", t.header);
  root.style.setProperty("--color-primary", t.primary);
  root.style.setProperty("--color-primary-hover", t.primaryHover);
  root.style.setProperty("--color-text", t.text);
  root.style.setProperty("--color-text-secondary", t.textSecondary);
  root.style.setProperty("--color-border", t.border);
  root.style.setProperty("--color-success", t.success);
  root.style.setProperty("--color-warning", t.warning);
  root.style.setProperty("--color-error", t.error);
  root.style.setProperty("--color-on-primary", t.onPrimary);

  root.style.setProperty("--ui-bg", t.bg);
  root.style.setProperty("--ui-accent", t.primary);
  root.style.setProperty("--ui-accent-contrast", t.onPrimary);
  root.style.setProperty("--ui-success", t.success);
  root.style.setProperty("--ui-danger", t.error);
  root.style.setProperty("--ui-muted", t.textSecondary);
}
