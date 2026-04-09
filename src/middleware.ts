import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLanguage, isSupportedLanguage } from "@/i18n/settings";

function rejectCsrf() {
  return NextResponse.json({ ok: false, error: { code: "csrf_failed", message: "CSRF validation failed." } }, { status: 403 });
}

function isMutating(method: string) {
  return method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
}

function defaultHttpPort(protocol: string) {
  return protocol === "https:" ? "443" : "80";
}

/** `Host` / `X-Forwarded-Host` — nextUrl.port bazen boş kalır; CSRF yanlışlıkla reddedilir. */
function requestHostAndPort(request: NextRequest): { hostname: string; port: string } {
  const raw =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || "";
  const proto = request.nextUrl.protocol;
  const fallbackPort = defaultHttpPort(proto);

  if (!raw) {
    const nu = request.nextUrl;
    return { hostname: nu.hostname, port: nu.port || fallbackPort };
  }
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]:");
    if (end !== -1) {
      return { hostname: raw.slice(1, end), port: raw.slice(end + 2) || fallbackPort };
    }
    return { hostname: raw, port: fallbackPort };
  }
  const colon = raw.lastIndexOf(":");
  if (colon !== -1) {
    const maybePort = raw.slice(colon + 1);
    if (/^\d+$/.test(maybePort)) {
      return { hostname: raw.slice(0, colon), port: maybePort };
    }
  }
  return { hostname: raw, port: fallbackPort };
}

/** Origin ile isteğin host/port bilgisini karşılaştırır. */
function isSameHost(origin: string, request: NextRequest) {
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  const originHostname = originUrl.hostname;
  const originPort = originUrl.port || defaultHttpPort(originUrl.protocol);
  const { hostname: reqHostname, port: reqPort } = requestHostAndPort(request);

  if (originPort !== reqPort) return false;
  if (originHostname === reqHostname) return true;

  const localhostAliases = new Set(["localhost", "127.0.0.1", "::1"]);
  return localhostAliases.has(originHostname) && localhostAliases.has(reqHostname);
}

/** İlk ziyarette `lang` çerezi yoksa varsayılan dil (Türkçe) atanır. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api") && isMutating(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      if (!isSameHost(origin, request)) return rejectCsrf();
    }

    return NextResponse.next();
  }

  const response = NextResponse.next();
  const existing = request.cookies.get("lang")?.value;

  if (!existing || !isSupportedLanguage(existing)) {
    const lang = defaultLanguage;
    response.cookies.set("lang", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "strict"
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
