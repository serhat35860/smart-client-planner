import { describe, expect, it } from "vitest";
import { productCapabilities, versionNotes } from "./version-notes";

describe("versionNotes", () => {
  it("has entries with required fields", () => {
    expect(versionNotes.length).toBeGreaterThan(0);
    for (const v of versionNotes) {
      expect(v.version).toMatch(/^v\d+\./);
      expect(v.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.title.length).toBeGreaterThan(0);
      expect(v.items.length).toBeGreaterThan(0);
    }
  });
});

describe("productCapabilities", () => {
  it("lists capabilities", () => {
    expect(productCapabilities.length).toBeGreaterThan(3);
  });
});
