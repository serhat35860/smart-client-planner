import { describe, expect, it } from "vitest";
import { parseTaskListFilter } from "./parse-task-list-filter";

describe("parseTaskListFilter", () => {
  it("defaults to mine", () => {
    expect(parseTaskListFilter(undefined, undefined)).toBe("mine");
  });

  it("reads taskFilter values", () => {
    expect(parseTaskListFilter("all")).toBe("all");
    expect(parseTaskListFilter("incomplete")).toBe("incomplete");
    expect(parseTaskListFilter("completed")).toBe("completed");
    expect(parseTaskListFilter("mine")).toBe("mine");
  });

  it("falls back to legacy activeTasks=incomplete", () => {
    expect(parseTaskListFilter(undefined, "incomplete")).toBe("incomplete");
  });

  it("invalid taskFilter falls back to mine", () => {
    expect(parseTaskListFilter("nope")).toBe("mine");
  });
});
