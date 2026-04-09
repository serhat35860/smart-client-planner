import { describe, expect, it } from "vitest";
import { nextEditedByOtherMember } from "./edited-by-other-member";

describe("nextEditedByOtherMember", () => {
  it("stays true once set", () => {
    expect(nextEditedByOtherMember(true, "a", "b", "c")).toBe(true);
  });

  it("true when patch user is not creator", () => {
    expect(nextEditedByOtherMember(false, "creator", null, "other")).toBe(true);
  });

  it("false when creator patches own", () => {
    expect(nextEditedByOtherMember(false, "u1", null, "u1")).toBe(false);
  });

  it("true when no creator and different from previous updater", () => {
    expect(nextEditedByOtherMember(false, null, "u1", "u2")).toBe(true);
  });
});
