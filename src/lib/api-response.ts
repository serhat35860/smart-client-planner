import { NextResponse } from "next/server";

type ErrorCode =
  | "invalid_json"
  | "invalid_payload"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal_error"
  | (string & {});

export function ok<T extends Record<string, unknown>>(payload?: T, status = 200) {
  return NextResponse.json({ ok: true, ...(payload ?? {}) }, { status });
}

export function fail(code: ErrorCode, message: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message }
    },
    { status }
  );
}
