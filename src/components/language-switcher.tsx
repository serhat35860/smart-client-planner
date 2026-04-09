"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { defaultLanguage, isSupportedLanguage, type AppLanguage } from "@/i18n/settings";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const [lang, setLang] = useState<AppLanguage>(() => {
    const code = i18n.language?.split("-")[0];
    return isSupportedLanguage(code) ? code : defaultLanguage;
  });

  useEffect(() => {
    const current = i18n.language?.split("-")[0];
    if (isSupportedLanguage(current)) setLang(current);
  }, [i18n.language]);

  function changeLanguage(next: AppLanguage) {
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-theme-border p-1">
      <span className="px-2 text-caption font-medium text-theme-muted">{t("language")}</span>
      <button
        onClick={() => changeLanguage("tr")}
        className={`rounded-md px-2 py-1 text-caption font-medium ${lang === "tr" ? "bg-theme-primary text-theme-on-primary" : "text-theme-text hover:bg-theme-subtle-hover"}`}
      >
        {t("lang_tr")}
      </button>
      <button
        onClick={() => changeLanguage("en")}
        className={`rounded-md px-2 py-1 text-caption font-medium ${lang === "en" ? "bg-theme-primary text-theme-on-primary" : "text-theme-text hover:bg-theme-subtle-hover"}`}
      >
        {t("lang_en")}
      </button>
    </div>
  );
}
