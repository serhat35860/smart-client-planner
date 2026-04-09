"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

type Role = "ADMIN" | "USER";

type Props = {
  userId: string;
  initialName: string | null;
  initialEmail: string;
  initialUsername: string | null;
  initialRole: Role;
  initialIsActive: boolean;
};

export function TeamMemberAdminEditorForm({
  userId,
  initialName,
  initialEmail,
  initialUsername,
  initialRole,
  initialIsActive
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState(initialUsername ?? "");
  const [role, setRole] = useState<Role>(initialRole);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dirty = useMemo(() => {
    return (
      name.trim() !== (initialName?.trim() ?? "") ||
      email.trim().toLowerCase() !== initialEmail.trim().toLowerCase() ||
      username.trim().toLowerCase() !== (initialUsername?.trim().toLowerCase() ?? "") ||
      role !== initialRole ||
      isActive !== initialIsActive ||
      newPassword.trim().length > 0
    );
  }, [email, initialEmail, initialIsActive, initialName, initialRole, initialUsername, isActive, name, newPassword, role, username]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const body: Record<string, unknown> = {};
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    const nextUsername = username.trim().toLowerCase();
    const nextPassword = newPassword.trim();

    if (nextName !== (initialName?.trim() ?? "")) body.name = nextName ? nextName : null;
    if (nextEmail !== initialEmail.trim().toLowerCase()) body.email = nextEmail;
    if (nextUsername !== (initialUsername?.trim().toLowerCase() ?? "")) body.username = nextUsername;
    if (role !== initialRole) body.role = role;
    if (isActive !== initialIsActive) body.isActive = isActive;
    if (nextPassword.length > 0) body.newPassword = nextPassword;

    const res = await fetch(`/api/workspace/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      if (data.error === "conflict_email") setError(t("team_member_edit_error_email_exists"));
      else if (data.error === "conflict_username") setError(t("team_member_edit_error_username_exists"));
      else if (data.error === "cannot_deactivate_self") setError(t("team_member_error_self_deactivate"));
      else if (data.error === "last_admin_guard") setError(t("team_member_edit_error_last_admin"));
      else setError(t("team_member_save_error"));
      return;
    }

    setNewPassword("");
    setSuccess(t("team_member_edit_success"));
    router.refresh();
  }

  async function onDeleteMember() {
    if (loading || archiveLoading || deleteLoading) return;
    const confirmed = window.confirm(t("team_member_delete_confirm"));
    if (!confirmed) return;

    setDeleteLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/workspace/members/${encodeURIComponent(userId)}`, {
      method: "DELETE"
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setDeleteLoading(false);

    if (!res.ok) {
      if (data.error === "cannot_delete_self") setError(t("team_member_delete_error_self"));
      else if (data.error === "last_admin_guard") setError(t("team_member_edit_error_last_admin"));
      else setError(t("team_member_delete_error_generic"));
      return;
    }

    router.push("/team");
    router.refresh();
  }

  async function onArchiveMember() {
    if (loading || archiveLoading || deleteLoading || !isActive) return;
    const confirmed = window.confirm(t("team_member_archive_confirm"));
    if (!confirmed) return;

    setArchiveLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/workspace/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false })
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setArchiveLoading(false);

    if (!res.ok) {
      if (data.error === "cannot_deactivate_self") setError(t("team_member_error_self_deactivate"));
      else if (data.error === "last_admin_guard") setError(t("team_member_edit_error_last_admin"));
      else setError(t("team_member_archive_error_generic"));
      return;
    }

    setIsActive(false);
    setSuccess(t("team_member_archive_success"));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-body font-medium text-theme-text">
        {t("team_member_display_name")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-theme-border px-3 py-2 text-body"
        />
      </label>

      <label className="block text-body font-medium text-theme-text">
        {t("email")}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="mt-1 w-full rounded-xl border border-theme-border px-3 py-2 text-body"
        />
      </label>

      <label className="block text-body font-medium text-theme-text">
        {t("username")}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-xl border border-theme-border px-3 py-2 text-body"
          minLength={3}
          maxLength={40}
        />
      </label>

      <label className="block text-body font-medium text-theme-text">
        {t("team_member_create_role_label")}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="mt-1 w-full rounded-xl border border-theme-border bg-theme-card px-3 py-2 text-sm"
        >
          <option value="ADMIN">{t("team_role_owner")}</option>
          <option value="USER">{t("team_role_member")}</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <input
          id="member-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-theme-border"
        />
        <label htmlFor="member-active" className="text-body text-theme-text">
          {isActive ? t("team_member_status_active") : t("team_member_status_passive")}
        </label>
      </div>

      <label className="block text-body font-medium text-theme-text">
        {t("team_member_edit_new_password")}
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          minLength={6}
          className="mt-1 w-full rounded-xl border border-theme-border px-3 py-2 text-body"
          placeholder={t("team_member_edit_new_password_placeholder")}
        />
      </label>

      {error ? <p className="text-xs text-theme-error">{error}</p> : null}
      {success ? <p className="text-xs text-theme-success">{success}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || archiveLoading || deleteLoading || !dirty}
          className="rounded-xl px-3 py-2 text-button font-medium text-[var(--ui-accent-contrast)] disabled:opacity-50"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {loading ? t("saving") : t("team_member_edit_submit")}
        </button>
        <button
          type="button"
          onClick={() => void onArchiveMember()}
          disabled={loading || archiveLoading || deleteLoading || !isActive}
          className="rounded-xl border border-theme-warning/40 px-3 py-2 text-sm text-theme-warning disabled:opacity-50"
        >
          {archiveLoading ? t("saving") : t("team_member_archive_button")}
        </button>
        <button
          type="button"
          onClick={() => void onDeleteMember()}
          disabled={loading || archiveLoading || deleteLoading}
          className="rounded-xl border border-theme-error/30 px-3 py-2 text-body text-theme-error disabled:opacity-50"
        >
          {deleteLoading ? t("deleting") : t("team_member_delete_button")}
        </button>
        <Link href="/team" className="rounded-xl border border-theme-border px-3 py-2 text-body text-theme-text">
          {t("back")}
        </Link>
      </div>
    </form>
  );
}
