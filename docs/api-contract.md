# API Contract Baseline (Redesign v2)

## Response Shape
- Success: `{ "ok": true, ...payload }`
- Error: `{ "ok": false, "error": { "code": "string", "message": "string" } }`

## Error Code Conventions
- `invalid_json`
- `invalid_payload`
- `unauthorized`
- `forbidden`
- `not_found`
- `conflict`
- `internal_error`
- Domain-specific values are allowed as `code` extensions.

## Auth Contract
- Login/register/logout routes must return the standard envelope.
- Protected routes return `unauthorized` if no valid session.
- Workspace-gated routes may return `forbidden` with workspace-specific code.

## Validation Contract
- Inputs are validated with Zod at route boundary.
- Validation failures map to `invalid_payload`.
- JSON parse failures map to `invalid_json`.
