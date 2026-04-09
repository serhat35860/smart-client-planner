import { describe, expect, it } from "vitest";
import { sanitizeAuditMeta } from "./sanitize-audit-meta";

describe("sanitizeAuditMeta", () => {
  it("returns em dash for null", () => {
    expect(sanitizeAuditMeta(null)).toBe("—");
  });

  it("redacts sensitive keys", () => {
    const s = sanitizeAuditMeta({ user: "a", apiToken: "secret", passwordHash: "x" });
    expect(s).toContain("[redacted]");
    expect(s).not.toContain("secret");
    expect(s).toContain("user");
  });

  it("truncates long JSON", () => {
    const long = { a: "x".repeat(500) };
    const s = sanitizeAuditMeta(long);
    expect(s.length).toBeLessThanOrEqual(402);
    expect(s.endsWith("…")).toBe(true);
  });
});
