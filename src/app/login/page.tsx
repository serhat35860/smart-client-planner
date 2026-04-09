"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length >= 3 && password.length >= 4 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = JSON.stringify({ email, password });
    const isElectron = typeof navigator !== "undefined" && navigator.userAgent.includes("Electron");
    const loginRequests = isElectron ? ["/api/auth/login", "http://127.0.0.1:4120/api/auth/login"] : ["/api/auth/login"];

    let res: Response | null = null;
    let data: { error?: { code?: string; message?: string } } = {};
    let fetchThrew = false;

    for (const endpoint of loginRequests) {
      try {
        const candidate = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: payload
        });
        const parsed = (await candidate.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
        res = candidate;
        data = parsed;
        if (candidate.ok) {
          break;
        }
      } catch {
        fetchThrew = true;
      }
    }

    if (!res?.ok) {
      setLoading(false);
      if (!res && fetchThrew) {
        setError(t("login_network_error"));
        return;
      }
      if (res?.status === 503 && data.error?.code === "database_unavailable") {
        setError(data.error?.message ?? t("login_error_database"));
        return;
      }
      if (res?.status === 403 && data.error?.code === "workspace_inactive") {
        setError(t("workspace_inactive_login"));
      } else if (res?.status === 403 && data.error?.code === "csrf_failed") {
        setError(t("login_error_csrf"));
      } else if (res?.status === 429 || data.error?.code === "too_many_requests") {
        setError("Çok fazla giriş denemesi. Lütfen 10 dakika bekleyin.");
      } else {
        setError(t("invalid_credentials"));
      }
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]">
        <LanguageSwitcher />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-theme-card p-6 shadow-sm">
        <h1 className="mb-2">{t("app_name")}</h1>
        <p className="mb-6 text-body-lg text-theme-muted">{t("login_help")}</p>
        <label className="mb-3 block text-label font-medium text-theme-text">
          {t("login_identifier")}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder="Kullanici adi, e-posta veya admin"
            className="mt-1 w-full"
            required
          />
        </label>
        <label className="mb-4 block text-label font-medium text-theme-text">
          {t("password")}
          <div className="relative mt-1">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Sifrenizi girin"
              className="w-full pr-11"
              autoComplete="current-password"
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
        {error ? (
          <p className="mb-3 text-body text-theme-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="ui-btn-primary w-full"
          aria-busy={loading}
        >
          {loading ? t("logging_in") : t("login")}
        </button>
        <p className="mt-4 text-center text-body text-theme-muted">
          <Link
            href="/register"
            className="font-medium text-theme-text underline decoration-theme-border underline-offset-2 transition hover:text-theme-primary hover:decoration-theme-primary"
          >
            {t("register_cta_from_login")}
          </Link>
        </p>
      </form>
    </div>
  );
}
