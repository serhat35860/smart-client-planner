import { describe, expect, it } from "vitest";
import {
  additionalContactsForPrisma,
  parseAdditionalContacts,
  sanitizeAdditionalContactsInput
} from "./client-additional-contacts";
import { Prisma } from "@prisma/client";

describe("parseAdditionalContacts", () => {
  it("returns empty for null and non-array", () => {
    expect(parseAdditionalContacts(null)).toEqual([]);
    expect(parseAdditionalContacts(undefined)).toEqual([]);
    expect(parseAdditionalContacts({})).toEqual([]);
    expect(parseAdditionalContacts("x")).toEqual([]);
  });

  it("keeps valid rows and trims", () => {
    expect(
      parseAdditionalContacts([
        { name: "  A  ", phone: " 1 ", jobTitle: "  Müdür " },
        { name: "", phone: "2" },
        { name: "B", phone: "3" },
        { name: "C" }
      ])
    ).toEqual([
      { name: "A", phone: "1", jobTitle: "Müdür" },
      { name: "B", phone: "3" },
      { name: "C" }
    ]);
  });

  it("caps at 20 entries", () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ name: `n${i}`, phone: `p${i}` }));
    expect(parseAdditionalContacts(rows)).toHaveLength(20);
  });
});

describe("sanitizeAdditionalContactsInput", () => {
  it("returns empty for non-array", () => {
    expect(sanitizeAdditionalContactsInput(null)).toEqual([]);
    expect(sanitizeAdditionalContactsInput("[]")).toEqual([]);
  });
});

describe("additionalContactsForPrisma", () => {
  it("uses DbNull when empty", () => {
    expect(additionalContactsForPrisma([])).toBe(Prisma.DbNull);
  });

  it("serializes non-empty list", () => {
    const v = additionalContactsForPrisma([{ name: "a", phone: "b" }]);
    expect(v).toEqual([{ name: "a", phone: "b" }]);
  });

  it("allows contact-less extra contact", () => {
    const v = additionalContactsForPrisma([{ name: "a" }]);
    expect(v).toEqual([{ name: "a" }]);
  });
});
