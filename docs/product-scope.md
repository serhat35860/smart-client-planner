# Smart Client Planner Product Scope (Redesign v2)

## Product Goals
- Help small teams manage client communication, notes, and commitments in one workspace.
- Make daily execution clear: what needs attention now, who owns it, and what changed.
- Keep onboarding and local development friction low for fast iteration.

## Personas
- Sales/Account owner: tracks client interactions and next actions.
- Team member: executes tasks, updates notes, collaborates in shared workspace.
- Workspace owner: manages members, permissions, and operational quality.

## Core Journeys
1. Workspace onboarding and member invitation.
2. Client lifecycle management (create, enrich, update status).
3. Note capture with mentions and reminders.
4. Task lifecycle (create, prioritize, complete, follow-up).
5. Team awareness via dashboard, reminders, and reports.

## MVP Boundaries
### In Scope
- Email/password authentication with secure cookie session.
- Single-workspace-per-user model.
- Client, note, task, mention, and reminder flows.
- Team member management and workspace invite flow.

### Out of Scope (Post-MVP)
- Multi-workspace switching for one user.
- External calendar sync.
- Advanced analytics and automation rules.

## Non-Functional Requirements
- Predictable API contracts and uniform error payloads.
- Stable local bootstrap with one command for development.
- Consistent naming across schema and server code.
- Documentation aligned with actual runtime stack.
