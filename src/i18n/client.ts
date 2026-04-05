"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { dictionaries } from "@/i18n/dictionaries";
import { defaultLanguage, isSupportedLanguage, type AppLanguage } from "@/i18n/settings";

const resources = {
  tr: { common: dictionaries.tr },
  en: { common: dictionaries.en }
};

/**
 * Keeps the singleton aligned with the current request's language (cookie / layout)
 * so the first client render matches server-rendered HTML.
 */
export function syncI18nLanguage(lang: AppLanguage) {
  const lng = isSupportedLanguage(lang) ? lang : defaultLanguage;
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: defaultLanguage,
      interpolation: { escapeValue: false },
      ns: ["common"],
      defaultNS: "common",
      react: { useSuspense: false }
    });
    return;
  }
  if (i18n.language !== lng) {
    void i18n.changeLanguage(lng);
  }
}

export default i18n;
