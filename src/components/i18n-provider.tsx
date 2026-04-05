"use client";

import { useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { syncI18nLanguage } from "@/i18n/client";
import { defaultLanguage, isSupportedLanguage, type AppLanguage } from "@/i18n/settings";

function writeLang(lang: AppLanguage) {
  localStorage.setItem("lang", lang);
  document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({ initialLang, children }: { initialLang: AppLanguage; children: React.ReactNode }) {
  const resolved = isSupportedLanguage(initialLang) ? initialLang : defaultLanguage;
  syncI18nLanguage(resolved);

  useLayoutEffect(() => {
    try {
      const fromLocalStorage = localStorage.getItem("lang");
      const language: AppLanguage = isSupportedLanguage(fromLocalStorage)
        ? fromLocalStorage
        : resolved;
      void i18n.changeLanguage(language);
      writeLang(language);
    } catch {
      /* ignore */
    }
  }, [resolved]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
