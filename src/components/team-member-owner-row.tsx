"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

type Role = "OWNER" | "MEMBER";

export function TeamMemberOwnerRow({
  userId,
  email,
  initialName,
  role,
  initialIsActive
}: {
  userId: string;
  email: string;
  initialName: string | null;
  role: Role;
  initialIsActive: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName ?? "");
    setIsActive(initialIsActive);
  }, [initialName, initialIsActive]);

  const ownerLocked = role === "OWNER";
  const nameTrimmed = name.trim();
  const nameChanged = nameTrimmed !== (initialName?.trim() ?? "");
  const activeChanged = isActive !== initialIsActive;
  const dirty = nameChanged || activeChanged;

  async function save() {
    setError(null);
    setLoading(true);
    const body: Record<string, unknown> = {};
    if (nameChanged) body.name = nameTrimmed ? nameTrimmed : null;
    if (activeChanged && !ownerLocked) body.isActive = isActive;

    const res = await fetch(`/api/workspace/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      if (data.error === "cannot_deactivate_owner") setError(t("team_member_error_owner_deactivate"));
      else if (data.error === "cannot_deactivate_self") setError(t("team_member_error_self_deactivate"));
      else setError(t("team_member_save_error"));
      return;
    }
    router.refresh();
  }

  return (
    <li className="space-y-3 border-b border-slate-100 py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            {t("team_member_display_name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              maxLength={120}
            />
          </label>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">{t("email")}: </span>
            {email}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {role === "OWNER" ? t("team_role_owner") : t("team_role_member")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-slate-700">{t("team_member_status")}</span>
        {ownerLocked ? (
          <span className="text-xs text-slate-600">{t("team_member_owner_always_active")}</span>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            {isActive ? t("team_member_status_active") : t("team_member_status_passive")}
          </label>
        )}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={loading || !dirty}
        onClick={() => void save()}
        className="rounded-xl px-3 py-1.5 text-xs text-[var(--ui-accent-contrast)] disabled:opacity-50"
        style={{ backgroundColor: "var(--ui-accent)" }}
      >
        {loading ? t("loading") : t("team_member_save_row")}
      </button>
    </li>
  );
}
