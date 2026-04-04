export const defaultLanguage = "tr";
export const supportedLanguages = ["tr", "en"] as const;

export type AppLanguage = (typeof supportedLanguages)[number];

export function isSupportedLanguage(lang: string | null | undefined): lang is AppLanguage {
  return !!lang && supportedLanguages.includes(lang as AppLanguage);
}
