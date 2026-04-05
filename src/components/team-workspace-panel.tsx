"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";

export function TeamRenameForm({ initialName }: { initialName: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    const res = await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed })
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 text-sm">
        <span className="mb-1 block text-slate-600">{t("team_rename_label")}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full" maxLength={120} />
      </label>
      <button
        type="submit"
        disabled={loading || name.trim() === initialName.trim()}
        className="rounded-xl px-4 py-2 text-sm text-[var(--ui-accent-contrast)] disabled:opacity-50"
        style={{ backgroundColor: "var(--ui-accent)" }}
      >
        {loading ? t("loading") : t("save")}
      </button>
    </form>
  );
}

export function TeamInviteSection() {
  const { t, i18n } = useTranslation();
  const lang = appLanguageFromI18n(i18n.language);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/workspace/invite", { method: "POST" });
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as { token: string; expiresAt: string };
    setToken(data.token);
    setExpiresAt(data.expiresAt);
  }

  const link = token ? `${origin}/join?token=${encodeURIComponent(token)}` : "";

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{t("team_invite_heading")}</h2>
      <p className="mb-3 text-sm text-slate-600">{t("team_invite_help")}</p>
      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? t("loading") : t("team_invite_generate")}
      </button>
      {link ? (
        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">{t("team_invite_link_label")}</p>
          <code className="block break-all text-xs text-slate-800">{link}</code>
          {expiresAt ? (
            <p className="text-xs text-slate-500">
              {t("team_invite_expires")}: {formatDateTime24(expiresAt, lang)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
