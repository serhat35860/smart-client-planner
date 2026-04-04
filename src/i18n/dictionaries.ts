import tr from "../../locales/tr/common.json";
import en from "../../locales/en/common.json";
import { AppLanguage } from "@/i18n/settings";

export const dictionaries = {
  tr,
  en
};

export type TranslationKey = keyof typeof tr;

export function getDictionary(lang: AppLanguage) {
  return dictionaries[lang];
}
