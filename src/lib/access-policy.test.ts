import { describe, expect, it } from "vitest";
import {
  canEditOwnedResource,
  canEditTaskFieldSet,
  canViewByCreatorOrMention,
  isAdminRole
} from "./access-policy";

const u1 = "user-1";
const u2 = "user-2";

describe("isAdminRole", () => {
  it("detects admin", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("USER")).toBe(false);
  });
});

describe("canViewByCreatorOrMention", () => {
  it("admin sees all", () => {
    expect(
      canViewByCreatorOrMention({
        role: "ADMIN",
        currentUserId: u1,
        createdByUserId: u2,
        mentionedUserIds: []
      })
    ).toBe(true);
  });

  it("creator sees own", () => {
    expect(
      canViewByCreatorOrMention({
        role: "USER",
        currentUserId: u1,
        createdByUserId: u1,
        mentionedUserIds: []
      })
    ).toBe(true);
  });

  it("mentioned user sees", () => {
    expect(
      canViewByCreatorOrMention({
        role: "USER",
        currentUserId: u1,
        createdByUserId: u2,
        mentionedUserIds: [u1]
      })
    ).toBe(true);
  });

  it("other user does not see", () => {
    expect(
      canViewByCreatorOrMention({
        role: "USER",
        currentUserId: u1,
        createdByUserId: u2,
        mentionedUserIds: []
      })
    ).toBe(false);
  });
});

describe("canEditOwnedResource", () => {
  it("admin edits any", () => {
    expect(canEditOwnedResource("ADMIN", u2, u1)).toBe(true);
  });

  it("user edits only own", () => {
    expect(canEditOwnedResource("USER", u1, u1)).toBe(true);
    expect(canEditOwnedResource("USER", u2, u1)).toBe(false);
  });
});

describe("canEditTaskFieldSet", () => {
  it("non-owner cannot structural update", () => {
    expect(
      canEditTaskFieldSet({
        role: "USER",
        currentUserId: u1,
        createdByUserId: u2,
        wantsStructuralUpdate: true
      })
    ).toBe(false);
  });

  it("non-owner can status-only style update", () => {
    expect(
      canEditTaskFieldSet({
        role: "USER",
        currentUserId: u1,
        createdByUserId: u2,
        wantsStructuralUpdate: false
      })
    ).toBe(true);
  });
});
