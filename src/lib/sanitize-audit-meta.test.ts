import { describe, expect, it } from "vitest";
import { sanitizeAuditMetaForDisplay } from "./sanitize-audit-meta";

describe("sanitizeAuditMetaForDisplay", () => {
  it("handles null and primitives", () => {
    expect(sanitizeAuditMetaForDisplay(null)).toBe("—");
    expect(sanitizeAuditMetaForDisplay(undefined)).toBe("—");
    expect(sanitizeAuditMetaForDisplay(42)).toBe("42");
    expect(sanitizeAuditMetaForDisplay("x")).toBe("x");
  });

  it("redacts sensitive keys", () => {
    const s = sanitizeAuditMetaForDisplay({
      user: "a",
      resetToken: "secret",
      passwordHash: "h",
      apiSecret: "s"
    });
    expect(s).toContain("[redacted]");
    expect(s).toContain('"user":"a"');
    expect(s).not.toContain('"resetToken":"secret"');
    expect(s).not.toContain('"passwordHash":"h"');
    expect(s).not.toContain('"apiSecret":"s"');
  });

  it("truncates long JSON", () => {
    const long = { x: "y".repeat(500) };
    const s = sanitizeAuditMetaForDisplay(long);
    expect(s.length).toBeLessThanOrEqual(401);
    expect(s.endsWith("…")).toBe(true);
  });
});
