import { format } from "date-fns";
import { enUS, tr } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AppLanguage } from "@/i18n/settings";

const localeByLang: Record<AppLanguage, Locale> = { tr, en: enUS };

/** Görünen tüm saatler 24 saat formatında (00–23). date-fns `HH` = 24 saat, `hh` = 12 saat (kullanılmaz). */
const PATTERN_DATETIME_24 = "dd MMM yyyy, HH:mm";

export function formatAppDate(date: Date | number | string, pattern: string, lang: AppLanguage) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: localeByLang[lang] });
}

export function formatDateTime24(date: Date | number | string, lang: AppLanguage) {
  return formatAppDate(date, PATTERN_DATETIME_24, lang);
}

export function appLanguageFromI18n(code: string | undefined): AppLanguage {
  if (code === "en" || code?.startsWith("en-")) return "en";
  return "tr";
}
