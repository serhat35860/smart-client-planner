# Frontend Information Architecture (Redesign v2)

## Primary Areas
- Dashboard: top-level operational overview.
- Clients: client list, filters, client detail timeline.
- Tasks: pending/done workflow and action modals.
- Reminders: time-based attention queue.
- Reports: aggregated insights and export actions.
- Team: member profile, workspace settings, invite management.

## Navigation Model
- Desktop: top shell + left contextual panels.
- Mobile: bottom navigation for Dashboard, Clients, Tasks, Reminders, Team.
- Route-first layout with feature-scoped components in `src/components`.

## UI System Principles
- Shared action patterns: modal + optimistic feedback + clear error state.
- Uniform form behavior: validate early, map server errors consistently.
- i18n-first labels/messages to prevent hardcoded text drift.
