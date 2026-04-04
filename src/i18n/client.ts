"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { dictionaries } from "@/i18n/dictionaries";
import { defaultLanguage } from "@/i18n/settings";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      tr: { common: dictionaries.tr },
      en: { common: dictionaries.en }
    },
    lng: defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: { escapeValue: false },
    ns: ["common"],
    defaultNS: "common"
  });
}

export default i18n;
