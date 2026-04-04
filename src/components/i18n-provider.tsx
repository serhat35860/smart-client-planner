"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/client";
import { defaultLanguage, isSupportedLanguage, type AppLanguage } from "@/i18n/settings";

function writeLang(lang: AppLanguage) {
  localStorage.setItem("lang", lang);
  document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({ initialLang, children }: { initialLang: AppLanguage; children: React.ReactNode }) {
  useEffect(() => {
    const fromLocalStorage = localStorage.getItem("lang");
    const language: AppLanguage = isSupportedLanguage(fromLocalStorage)
      ? fromLocalStorage
      : isSupportedLanguage(initialLang)
        ? initialLang
        : defaultLanguage;
    i18n.changeLanguage(language);
    writeLang(language);
  }, [initialLang]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
