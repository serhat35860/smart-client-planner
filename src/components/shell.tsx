"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ReminderAlertHost } from "@/components/reminder-alert-host";
import { ThemePicker } from "@/components/theme-picker";
import { appNavItems } from "@/lib/navigation";
import { appVersion } from "@/lib/app-version";

type MeUser = { name: string | null; email: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [sessionUser, setSessionUser] = useState<MeUser | null>(null);
  const [logoutMenuOpen, setLogoutMenuOpen] = useState(false);
  const logoutMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me").then(async (res) => {
      if (cancelled) return;
      if (!res.ok) {
        setSessionUser(null);
        return;
      }
      const data = (await res.json()) as { user?: MeUser };
      setSessionUser(data.user ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    function onProfileUpdated() {
      void fetch("/api/auth/me").then(async (res) => {
        if (!res.ok) {
          setSessionUser(null);
          return;
        }
        const data = (await res.json()) as { user?: MeUser };
        setSessionUser(data.user ?? null);
      });
    }
    window.addEventListener("scp-profile-updated", onProfileUpdated);
    return () => window.removeEventListener("scp-profile-updated", onProfileUpdated);
  }, []);

  useEffect(() => {
    if (!logoutMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const el = logoutMenuRef.current;
      if (el && !el.contains(e.target as Node)) setLogoutMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [logoutMenuOpen]);

  async function handleLogout() {
    setLogoutMenuOpen(false);
    setSessionUser(null);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function goReports() {
    setLogoutMenuOpen(false);
    router.push("/reports");
  }

  function goVersionNotes() {
    setLogoutMenuOpen(false);
    router.push("/version-notes");
  }

  return (
    <div className="min-h-screen">
      <ReminderAlertHost />
      <header className="app-shell-header sticky top-0 z-20 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3.5 sm:px-5 md:py-4 xl:px-7 2xl:px-9 md:flex-nowrap">
          <Link
            href="/dashboard"
            className="flex min-w-0 max-w-[min(100%,20rem)] shrink-0 items-center gap-2.5 sm:max-w-md"
          >
            <Image
              src="/icon.svg"
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-xl shadow-sm"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold text-theme-text">
                {t("app_name")}
                <span className="ml-1 text-[0.55em] font-medium text-theme-muted">/ {appVersion}</span>
              </span>
              {sessionUser ? (
                <span className="mt-0.5 block truncate text-caption font-normal text-theme-muted">
                  {sessionUser.name?.trim() || sessionUser.email}
                </span>
              ) : null}
            </span>
          </Link>
          <nav
            className="hidden min-h-[2.5rem] min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto overflow-y-hidden md:flex"
            aria-label={t("app_name")}
          >
            {appNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 touch-manipulation whitespace-nowrap rounded-lg px-2.5 py-2 text-body transition-colors md:px-3",
                  pathname.startsWith(item.href)
                    ? "font-semibold text-[var(--ui-accent-contrast)]"
                    : "font-normal text-slate-900 hover:bg-theme-subtle-hover"
                )}
                style={pathname.startsWith(item.href) ? { backgroundColor: "var(--ui-accent)" } : undefined}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="relative flex shrink-0 items-center gap-2 md:ml-auto" ref={logoutMenuRef}>
            <ThemePicker />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setLogoutMenuOpen((o) => !o)}
              aria-expanded={logoutMenuOpen}
              aria-haspopup="menu"
              className="touch-manipulation rounded-lg border px-3 py-2 text-button font-medium text-theme-text hover:bg-theme-subtle-hover"
            >
              {t("logout")}
            </button>
            {logoutMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[11rem] rounded-xl border border-theme-border bg-theme-card py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={goReports}
                  className="block w-full px-4 py-2.5 text-left text-body text-theme-text hover:bg-theme-subtle"
                >
                  {t("logout_menu_report")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={goVersionNotes}
                  className="block w-full px-4 py-2.5 text-left text-body text-theme-text hover:bg-theme-subtle"
                >
                  {t("logout_menu_version_notes")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="block w-full px-4 py-2.5 text-left text-body text-theme-text hover:bg-theme-subtle"
                >
                  {t("logout_menu_sign_out")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1800px] px-4 pb-24 pt-6 sm:px-5 md:pb-6 md:pt-8 xl:px-7 2xl:px-9">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
