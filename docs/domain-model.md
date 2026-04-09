# Domain Model (Redesign v2)

## Bounded Contexts
- Auth: identity, password, session cookie lifecycle.
- Workspace: membership, role, invite, active/inactive states.
- CRM Core: clients, notes, tags, tasks, ownership metadata.
- Reminder/Attention: reminder windows and notification readiness.
- Reporting/Search: read-optimized queries for dashboard and search.

## Canonical Entity Rules
- `User.password` is the canonical password hash field.
- Every collaborative business object stores `workspaceId`.
- Ownership metadata is explicit (`createdByUserId`, `updatedByUserId`).
- Mentions are join tables with composite keys for integrity.

## Data Evolution Strategy
1. Keep the current SQLite-based dev flow stable.
2. Apply naming and contract fixes with backward-compatible migrations where possible.
3. If a breaking migration is needed, provide scripted data transform/backfill path.

## Integrity Principles
- Workspace isolation is mandatory on all read/write paths.
- Route handlers validate payloads before persistence.
- Password operations always use hash comparison/update through auth layer.
