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
        <span className="mb-1 block text-theme-muted">{t("team_rename_label")}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full" maxLength={120} />
      </label>
      <button
        type="submit"
        disabled={loading || name.trim() === initialName.trim()}
        className="rounded-xl px-4 py-2 text-button font-medium text-[var(--ui-accent-contrast)] disabled:opacity-50"
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
      <h2 className="mb-2 text-body font-semibold text-theme-text">{t("team_invite_heading")}</h2>
      <p className="mb-3 text-body text-theme-muted">{t("team_invite_help")}</p>
      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        className="rounded-xl border border-theme-border px-4 py-2 text-button font-medium hover:bg-theme-subtle disabled:opacity-50"
      >
        {loading ? t("loading") : t("team_invite_generate")}
      </button>
      {link ? (
        <div className="mt-4 space-y-2 rounded-xl border border-theme-border bg-theme-subtle p-3">
          <p className="text-xs font-medium text-theme-muted">{t("team_invite_link_label")}</p>
          <code className="block break-all text-xs text-theme-text">{link}</code>
          {expiresAt ? (
            <p className="text-xs text-theme-muted">
              {t("team_invite_expires")}: {formatDateTime24(expiresAt, lang)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TeamCreateMemberForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || null,
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password,
        role
      })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { code?: string } };
    setLoading(false);
    if (!res.ok) {
      if (data.error?.code === "conflict") setError(t("team_member_create_error_email_exists"));
      else if (data.error?.code === "conflict_username") setError(t("team_member_create_error_username_exists"));
      else setError(t("team_member_create_error_generic"));
      return;
    }
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setSuccess(t("team_member_create_success"));
    router.refresh();
  }

  return (
    <div className="mt-6 border-t border-theme-border pt-4">
      <h3 className="mb-2 text-body font-semibold text-theme-text">{t("team_member_create_heading")}</h3>
      <p className="mb-3 text-body text-theme-muted">{t("team_member_create_help")}</p>
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder={t("team_member_create_name_optional")}
          className="sm:col-span-2"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={40}
          pattern="^[a-zA-Z0-9._-]+$"
          required
          placeholder={t("username")}
          className="sm:col-span-2"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t("email")}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder={t("password")}
        />
        <label className="flex flex-col gap-1 text-xs text-theme-muted">
          <span>{t("team_member_create_role_label")}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
            className="rounded-xl border border-theme-border px-3 py-2 text-body text-theme-text"
          >
            <option value="USER">{t("team_role_member")}</option>
            <option value="ADMIN">{t("team_role_owner")}</option>
          </select>
        </label>
        {error ? <p className="sm:col-span-2 text-xs text-theme-error">{error}</p> : null}
        {success ? <p className="sm:col-span-2 text-xs text-theme-success">{success}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-xl px-4 py-2 text-button font-medium text-[var(--ui-accent-contrast)] disabled:opacity-50"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {loading ? t("loading") : t("team_member_create_submit")}
        </button>
      </form>
    </div>
  );
}
