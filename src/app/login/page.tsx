"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("demo@smartclientplanner.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (!res.ok) {
      setError(t("invalid_credentials"));
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]">
        <LanguageSwitcher />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">{t("app_name")}</h1>
        <p className="mb-6 text-sm text-slate-600">{t("login_help")}</p>
        <label className="mb-3 block text-sm">
          {t("email")}
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full" required />
        </label>
        <label className="mb-4 block text-sm">
          {t("password")}
          <div className="relative mt-1">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              className="w-full pr-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={showPassword ? t("password_hide") : t("password_show")}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </label>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
          {loading ? t("logging_in") : t("login")}
        </button>
      </form>
    </div>
  );
}
