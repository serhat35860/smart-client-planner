import { cookies } from "next/headers";
import { defaultLanguage, isSupportedLanguage, type AppLanguage } from "@/i18n/settings";
import { getDictionary, type TranslationKey } from "@/i18n/dictionaries";

export async function resolveServerLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("lang")?.value;
  if (isSupportedLanguage(fromCookie)) return fromCookie;
  return defaultLanguage;
}

export async function getServerT() {
  const lang = await resolveServerLanguage();
  const dict = getDictionary(lang);
  return {
    lang,
    t: (key: TranslationKey) => dict[key]
  };
}
