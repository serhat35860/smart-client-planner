import { describe, expect, it } from "vitest";
import { readJsonBody } from "./read-json";

describe("readJsonBody", () => {
  it("parses valid JSON body", async () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 })
    });
    const r = await readJsonBody(req);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body).toEqual({ a: 1 });
  });

  it("returns not ok on invalid JSON", async () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      body: "not-json{"
    });
    const r = await readJsonBody(req);
    expect(r.ok).toBe(false);
  });
});
