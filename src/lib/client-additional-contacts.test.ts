import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  additionalContactsForPrisma,
  parseAdditionalContacts,
  sanitizeAdditionalContactsInput
} from "./client-additional-contacts";

describe("parseAdditionalContacts", () => {
  it("returns empty for non-array", () => {
    expect(parseAdditionalContacts(null)).toEqual([]);
    expect(parseAdditionalContacts({})).toEqual([]);
  });

  it("parses valid rows and caps at 20", () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `N${i}`,
      phone: `P${i}`,
      jobTitle: i === 0 ? "  Lead  " : undefined
    }));
    const out = parseAdditionalContacts(rows);
    expect(out).toHaveLength(20);
    expect(out[0]?.jobTitle).toBe("Lead");
  });

  it("skips invalid items", () => {
    expect(
      parseAdditionalContacts([{ name: "", phone: "1" }, { name: "A", phone: "B" }])
    ).toEqual([{ name: "A", phone: "B" }]);
  });
});

describe("sanitizeAdditionalContactsInput", () => {
  it("returns empty for non-array", () => {
    expect(sanitizeAdditionalContactsInput(undefined)).toEqual([]);
  });
});

describe("additionalContactsForPrisma", () => {
  it("uses DbNull when empty", () => {
    expect(additionalContactsForPrisma([])).toBe(Prisma.DbNull);
  });

  it("returns array JSON value when non-empty", () => {
    const v = additionalContactsForPrisma([{ name: "A", phone: "1" }]);
    expect(v).toEqual([{ name: "A", phone: "1" }]);
  });
});
