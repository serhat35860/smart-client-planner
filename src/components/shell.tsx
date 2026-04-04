"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ReminderAlertHost } from "@/components/reminder-alert-host";
import { ThemePicker } from "@/components/theme-picker";

const nav = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/clients", key: "clients" },
  { href: "/tasks", key: "tasks" },
  { href: "/reminders", key: "reminders" },
  { href: "/search", key: "search" }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <ReminderAlertHost />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="min-w-0 max-w-[55%] truncate font-semibold sm:max-w-none">
            {t("app_name")}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "touch-manipulation rounded-lg px-3 py-2 text-sm",
                  pathname.startsWith(item.href)
                    ? "text-[var(--ui-accent-contrast)]"
                    : "text-slate-600 hover:bg-slate-100"
                )}
                style={pathname.startsWith(item.href) ? { backgroundColor: "var(--ui-accent)" } : undefined}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemePicker />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              className="touch-manipulation rounded-lg border px-3 py-2 text-sm hover:bg-slate-100"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-6">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
