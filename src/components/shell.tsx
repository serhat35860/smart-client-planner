"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  { href: "/team", key: "team" },
  { href: "/search", key: "search" }
] as const;

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

  return (
    <div className="min-h-screen">
      <ReminderAlertHost />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 max-w-[55%] items-center gap-2.5 sm:max-w-md md:max-w-lg"
          >
            <img
              src="/icon.svg"
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-xl shadow-sm"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{t("app_name")}</span>
              {sessionUser ? (
                <span className="mt-0.5 block truncate text-xs font-normal leading-snug text-slate-600">
                  {sessionUser.name?.trim() || sessionUser.email}
                </span>
              ) : null}
            </span>
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
          <div className="relative flex shrink-0 items-center gap-2" ref={logoutMenuRef}>
            <ThemePicker />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setLogoutMenuOpen((o) => !o)}
              aria-expanded={logoutMenuOpen}
              aria-haspopup="menu"
              className="touch-manipulation rounded-lg border px-3 py-2 text-sm hover:bg-slate-100"
            >
              {t("logout")}
            </button>
            {logoutMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={goReports}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
                >
                  {t("logout_menu_report")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
                >
                  {t("logout_menu_sign_out")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-6">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
