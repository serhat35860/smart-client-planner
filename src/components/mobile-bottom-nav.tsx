"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { appNavItems } from "@/lib/navigation";

/** Mobil ve küçük tablet: parmakla kolay erişim için alt sekme çubuğu */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around border-t border-theme-border bg-theme-card/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-nav-bar-lift backdrop-blur md:hidden"
      aria-label={t("mobile_nav_label")}
    >
      {appNavItems.map(({ href, key, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[52px] min-w-[52px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-caption leading-tight",
              active ? "font-semibold text-theme-text" : "font-normal text-theme-muted"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={t(key)}
          >
            <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} strokeWidth={active ? 2.5 : 2} />
            <span className="max-w-full truncate">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
