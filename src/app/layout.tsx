import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { UiThemeRoot } from "@/components/ui-theme-root";
import { getServerT, resolveServerLanguage } from "@/i18n/server";
import { fontSans } from "@/lib/fonts";
import { UI_THEME_DEFAULT_ID, UI_THEME_PRESETS, UI_THEME_STORAGE_KEY } from "@/lib/ui-theme-presets";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  const appName = t("app_name");
  return {
    title: { default: appName, template: `%s | ${appName}` },
    description: t("app_description"),
    applicationName: appName,
    appleWebApp: {
      capable: true,
      title: appName,
      statusBarStyle: "default"
    },
    formatDetection: {
      telephone: false
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
    }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f7f7f5",
  colorScheme: "light"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await resolveServerLanguage();
  const themeBootScript = `
    (function () {
      try {
        var presets = ${JSON.stringify(UI_THEME_PRESETS)};
        var storageKey = ${JSON.stringify(UI_THEME_STORAGE_KEY)};
        var fallbackId = ${JSON.stringify(UI_THEME_DEFAULT_ID)};
        var stored = localStorage.getItem(storageKey);
        var preset = presets.find(function (p) { return p.id === stored; }) || presets.find(function (p) { return p.id === fallbackId; }) || presets[0];
        if (!preset) return;
        var root = document.documentElement;
        var t = {
          bg: preset.background,
          card: preset.card || "#FFFFFF",
          header: preset.header || preset.card || "#FFFFFF",
          primary: preset.accent,
          primaryHover: preset.primaryHover || preset.accent,
          text: preset.text || "#0F172A",
          textSecondary: preset.textSecondary || "#475569",
          border: preset.border || "#E2E8F0",
          success: preset.success || "#16A34A",
          warning: preset.warning || "#F59E0B",
          error: preset.error || "#DC2626",
          onPrimary: preset.onPrimary || preset.accentContrast || "#FFFFFF"
        };
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
      } catch (e) {}
    })();
  `;
  return (
    <html lang={lang} className={fontSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <UiThemeRoot />
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
