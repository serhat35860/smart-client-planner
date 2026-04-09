import { describe, expect, it } from "vitest";
import { AuditEventType } from "./audit-event-types";

describe("AuditEventType", () => {
  it("has unique string values", () => {
    const values = Object.values(AuditEventType);
    expect(new Set(values).size).toBe(values.length);
  });

  it("uses dotted names", () => {
    for (const v of Object.values(AuditEventType)) {
      expect(v).toContain(".");
    }
  });
});
