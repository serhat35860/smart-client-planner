type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const t = now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= t) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return { ok: true as const, remaining: Math.max(0, limit - 1) };
  }
  if (existing.count >= limit) {
    return { ok: false as const, retryAfterMs: Math.max(0, existing.resetAt - t) };
  }
  existing.count += 1;
  return { ok: true as const, remaining: Math.max(0, limit - existing.count) };
}
