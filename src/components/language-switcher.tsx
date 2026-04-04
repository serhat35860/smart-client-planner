"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { defaultLanguage, isSupportedLanguage, type AppLanguage } from "@/i18n/settings";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const [lang, setLang] = useState<AppLanguage>(defaultLanguage);

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
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
      <span className="px-2 text-xs text-slate-500">{t("language")}</span>
      <button
        onClick={() => changeLanguage("tr")}
        className={`rounded-md px-2 py-1 text-xs ${lang === "tr" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
      >
        {t("lang_tr")}
      </button>
      <button
        onClick={() => changeLanguage("en")}
        className={`rounded-md px-2 py-1 text-xs ${lang === "en" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
      >
        {t("lang_en")}
      </button>
    </div>
  );
}
