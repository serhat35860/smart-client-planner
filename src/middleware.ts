import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLanguage, isSupportedLanguage } from "@/i18n/settings";

/** İlk ziyarette `lang` çerezi yoksa varsayılan dil (Türkçe) atanır. */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get("lang")?.value;

  if (!existing || !isSupportedLanguage(existing)) {
    const lang = defaultLanguage;
    response.cookies.set("lang", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
