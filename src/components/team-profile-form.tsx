"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  getReminderSoundPreference,
  playSoftReminderChime,
  REMINDER_SOUND_STORAGE_KEY,
  type ReminderSound
} from "@/lib/play-soft-chime";

type Props = {
  initialName: string | null;
  initialEmail: string;
};

export function TeamProfileForm({ initialName, initialEmail }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    setName(initialName ?? "");
  }, [initialName]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [reminderSound, setReminderSound] = useState<ReminderSound>("soft");

  useEffect(() => {
    setReminderSound(getReminderSoundPreference());
  }, []);

  function onReminderSoundChange(v: ReminderSound) {
    setReminderSound(v);
    try {
      localStorage.setItem(REMINDER_SOUND_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const nameTrimmed = name.trim();
    const nameChanged = nameTrimmed !== (initialName?.trim() ?? "");
    const wantsPassword = newPassword.length > 0 || confirmPassword.length > 0;

    if (wantsPassword) {
      if (newPassword.length < 6) {
        setMessage({ kind: "err", text: t("team_profile_error_new_short") });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ kind: "err", text: t("team_profile_error_confirm") });
        return;
      }
      if (!currentPassword) {
        setMessage({ kind: "err", text: t("team_profile_error_current_required") });
        return;
      }
    }

    if (!nameChanged && !wantsPassword) {
      setMessage({ kind: "err", text: t("team_profile_error_no_changes") });
      return;
    }

    setLoading(true);
    const body: Record<string, unknown> = {};
    if (nameChanged) {
      body.name = nameTrimmed ? nameTrimmed : null;
    }
    if (wantsPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      if (data.error === "invalid_current_password") {
        setMessage({ kind: "err", text: t("team_profile_error_current_wrong") });
        return;
      }
      if (data.error === "no_changes") {
        setMessage({ kind: "err", text: t("team_profile_error_no_changes") });
        return;
      }
      setMessage({ kind: "err", text: t("team_profile_error_generic") });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage({ kind: "ok", text: t("team_profile_saved") });
    window.dispatchEvent(new Event("scp-profile-updated"));
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-theme-text">{t("team_profile_name_label")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-theme-border px-3 py-2 text-body"
            maxLength={120}
            autoComplete="name"
          />
        </label>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-theme-text">{t("team_profile_email_label")}</p>
        <p className="rounded-xl border border-theme-border bg-theme-subtle px-3 py-2 text-body text-theme-text">{initialEmail}</p>
        <p className="mt-1 text-xs text-theme-muted">{t("team_profile_email_hint")}</p>
      </div>
      <div className="border-t border-theme-border pt-4">
        <p className="mb-2 text-body font-semibold text-theme-text">{t("team_profile_password_section")}</p>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-theme-muted">{t("team_profile_current_password")}</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-theme-border px-3 py-2 text-body"
              autoComplete="current-password"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-theme-muted">{t("team_profile_new_password")}</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-theme-border px-3 py-2 text-body"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-theme-muted">{t("team_profile_confirm_password")}</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-theme-border px-3 py-2 text-body"
              autoComplete="new-password"
            />
          </label>
        </div>
      </div>
      <div className="border-t border-theme-border pt-4">
        <p className="mb-2 text-body font-semibold text-theme-text">{t("team_profile_reminder_sound_section")}</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-sm">
            <span className="mb-1 block text-theme-muted">{t("team_profile_reminder_sound_label")}</span>
            <select
              value={reminderSound}
              onChange={(e) => onReminderSoundChange(e.target.value as ReminderSound)}
              className="w-full rounded-xl border border-theme-border px-3 py-2 text-body"
            >
              <option value="soft">{t("reminder_sound_soft")}</option>
              <option value="bell">{t("reminder_sound_bell")}</option>
              <option value="digital">{t("reminder_sound_digital")}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => playSoftReminderChime(reminderSound)}
            className="rounded-xl border border-theme-border px-3 py-2 text-button font-medium hover:bg-theme-subtle"
          >
            {t("team_profile_reminder_sound_test")}
          </button>
        </div>
      </div>
      {message ? (
        <p className={message.kind === "ok" ? "text-body text-theme-success" : "text-body text-theme-error"}>{message.text}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl px-4 py-2 text-button font-medium text-[var(--ui-accent-contrast)] disabled:opacity-50"
        style={{ backgroundColor: "var(--ui-accent)" }}
      >
        {loading ? t("loading") : t("team_profile_save")}
      </button>
    </form>
  );
}
