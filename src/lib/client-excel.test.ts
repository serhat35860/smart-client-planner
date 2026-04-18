import { describe, expect, it } from "vitest";
import {
  buildClientImportColumnMap,
  parseClientStatusCell,
  parseExtraContactsCell,
  rowToParsedClient
} from "./client-excel";

describe("parseExtraContactsCell", () => {
  it("parses pipe and semicolon format", () => {
    expect(parseExtraContactsCell("A|1|X; B|2")).toEqual([
      { name: "A", phone: "1", jobTitle: "X" },
      { name: "B", phone: "2" }
    ]);
  });
  it("returns empty for blank", () => {
    expect(parseExtraContactsCell("  ")).toEqual([]);
  });
});

describe("parseClientStatusCell", () => {
  it("maps Turkish and English", () => {
    expect(parseClientStatusCell("AKTIF")).toBe("ACTIVE");
    expect(parseClientStatusCell("passive")).toBe("PASSIVE");
    expect(parseClientStatusCell("")).toBe("POTENTIAL");
  });
  it("returns null for unknown", () => {
    expect(parseClientStatusCell("foo")).toBeNull();
  });
});

describe("buildClientImportColumnMap", () => {
  it("requires core columns", () => {
    const m = buildClientImportColumnMap(["firma", "yetkili", "telefon", "e_posta"]);
    expect(m).not.toBeNull();
    expect(m!.get(0)).toBe("companyName");
  });
  it("returns null without email column", () => {
    expect(buildClientImportColumnMap(["firma", "yetkili", "telefon"])).toBeNull();
  });
});

describe("rowToParsedClient", () => {
  it("accepts valid row", () => {
    const map = buildClientImportColumnMap(["firma", "yetkili", "telefon", "e_posta", "durum"])!;
    const cells = ["Acme", "Ali", "1", "a@b.co", "AKTIF"];
    const r = rowToParsedClient(cells, map, 2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.companyName).toBe("Acme");
      expect(r.data.status).toBe("ACTIVE");
    }
  });
});
