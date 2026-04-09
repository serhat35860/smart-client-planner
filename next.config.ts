import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    const common: { key: string; value: string }[] = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ];
    /** Geliştirmede HSTS/CSP tam yükü: tarayıcıda https zorlaması / boş sayfa gibi yanlış davranışlara yol açabilir. */
    if (process.env.NODE_ENV !== "production") {
      return [{ source: "/:path*", headers: common }];
    }
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          ...common,
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
        ]
      }
    ];
  }
};

export default nextConfig;
