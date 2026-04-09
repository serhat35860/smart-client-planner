"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

type Role = "ADMIN" | "USER";

export function TeamMemberOwnerRow({
  userId,
  email,
  username,
  initialName,
  role,
  initialIsActive
}: {
  userId: string;
  email: string;
  username: string | null;
  initialName: string | null;
  role: Role;
  initialIsActive: boolean;
}) {
  const { t } = useTranslation();

  return (
    <li className="space-y-3 border-b border-theme-border py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-theme-text">{initialName?.trim() || email}</p>
          <p className="text-xs text-theme-muted">
            <span className="font-medium text-theme-muted">{t("email")}: </span>
            {email}
          </p>
          {username ? (
            <p className="text-xs text-theme-muted">
              <span className="font-medium text-theme-muted">{t("username")}: </span>
              {username}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-theme-subtle-hover px-2 py-0.5 text-caption text-theme-text">
          {role === "ADMIN" ? t("team_role_owner") : t("team_role_member")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-theme-text">
          {t("team_member_status")}: {initialIsActive ? t("team_member_status_active") : t("team_member_status_passive")}
        </span>
        <Link
          href={`/team/members/${encodeURIComponent(userId)}`}
          className="rounded-xl px-3 py-1.5 text-xs text-[var(--ui-accent-contrast)]"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {t("team_member_edit_button")}
        </Link>
      </div>
    </li>
  );
}
