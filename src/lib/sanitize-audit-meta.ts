/** Audit `metaJson` için rapor / log satırı metni; hassas anahtarları maskele. */
export function sanitizeAuditMeta(meta: unknown): string {
  if (meta == null) return "—";
  if (typeof meta !== "object") return String(meta);
  const obj = { ...(meta as Record<string, unknown>) };
  for (const k of Object.keys(obj)) {
    if (/password|token|hash|secret/i.test(k)) obj[k] = "[redacted]";
  }
  try {
    const s = JSON.stringify(obj);
    return s.length > 400 ? `${s.slice(0, 400)}…` : s;
  } catch {
    return "—";
  }
}
