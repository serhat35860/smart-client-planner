"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CalendarClock, LayoutDashboard, ListTodo, Search, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", key: "dashboard" as const, Icon: LayoutDashboard },
  { href: "/clients", key: "clients" as const, Icon: Users },
  { href: "/tasks", key: "tasks" as const, Icon: ListTodo },
  { href: "/reminders", key: "reminders" as const, Icon: CalendarClock },
  { href: "/team", key: "team" as const, Icon: UsersRound },
  { href: "/search", key: "search" as const, Icon: Search }
];

/** Mobil ve küçük tablet: parmakla kolay erişim için alt sekme çubuğu */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur md:hidden"
      aria-label={t("mobile_nav_label")}
    >
      {items.map(({ href, key, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[52px] min-w-[52px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-xs",
              active ? "text-slate-900" : "text-slate-500"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={t(key)}
          >
            <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} strokeWidth={active ? 2.5 : 2} />
            <span className="max-w-full truncate font-medium">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
