import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { UiThemeRoot } from "@/components/ui-theme-root";
import { getServerT, resolveServerLanguage } from "@/i18n/server";
import { fontSans } from "@/lib/fonts";

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
  return (
    <html lang={lang} className={fontSans.variable}>
      <body>
        <UiThemeRoot />
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
