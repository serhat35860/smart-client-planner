import { describe, expect, it } from "vitest";
import { appVersion } from "./app-version";

describe("appVersion", () => {
  it("matches semver shape", () => {
    expect(appVersion).toMatch(/^\d+\.\d+\.\d+/);
  });
});
