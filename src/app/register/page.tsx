"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite")?.trim() || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || null,
          inviteToken: inviteToken || null
        })
      });
    } catch {
      setLoading(false);
      setError(t("login_network_error"));
      return;
    }
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409) setError(t("register_email_taken"));
      else if (data.error === "Invalid or expired invite") setError(t("join_invalid_invite"));
      else setError(t("register_error_generic"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-theme-card p-6 shadow-sm">
      <h1 className="mb-2">{t("register_title")}</h1>
      <p className="mb-6 text-body-lg text-theme-muted">
        {inviteToken ? t("register_with_invite_hint") : t("register_solo_hint")}
      </p>
      <label className="mb-3 block text-label font-medium text-theme-text">
        {t("email")}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full" required />
      </label>
      <label className="mb-3 block text-label font-medium text-theme-text">
        {t("name_optional")}
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="mt-1 w-full" maxLength={120} />
      </label>
      <label className="mb-4 block text-label font-medium text-theme-text">
        {t("password")}
        <div className="relative mt-1">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            className="w-full pr-11"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-theme-muted hover:bg-theme-subtle-hover hover:text-theme-text"
            aria-label={showPassword ? t("password_hide") : t("password_show")}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </label>
      {error ? <p className="mb-3 text-body text-theme-error">{error}</p> : null}
      <button disabled={loading} className="ui-btn-primary w-full">
        {loading ? t("loading") : t("register_submit")}
      </button>
      <p className="mt-4 text-center text-body text-theme-muted">
        <Link href="/login" className="font-medium text-theme-text underline hover:no-underline">
          {t("register_has_account")}
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]">
        <LanguageSwitcher />
      </div>
      <Suspense fallback={<div className="text-body text-theme-muted">…</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
