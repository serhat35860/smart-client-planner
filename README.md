# Smart Client Planner

Modern, scalable, sticky-note inspired mini CRM for tracking customer interactions, follow-ups, and tasks.

**Türkçe kurulum özeti:** [KURULUM.md](./KURULUM.md)

## Tech Stack

- Next.js (App Router, React, TypeScript)
- Prisma + SQLite (dev) / PostgreSQL (production optional)
- Tailwind CSS
- Cookie-based email/password auth

## Core Features Implemented

- Client management (`add/edit/delete` API ready, add UI included)
- Per-client sticky-note style daily notes
- Timeline view per client with tag/keyword filtering
- Convert note to task flow
- Task board (pending/done, overdue highlight)
- Dashboard (total clients, active tasks, today's follow-ups, recent notes)
- Global search (clients, notes, tags)
- WhatsApp quick link per client
- Seeded demo data

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

Windows (PowerShell): `Copy-Item .env.example .env`

3. Validate development environment variables:

```bash
npm run predev
```

4. Run migration:

```bash
npm run prisma:migrate -- --name init
```

5. Seed demo data:

```bash
npm run prisma:seed
```

6. Start app:

```bash
npm run dev
```

If you need fallback without Turbopack:

```bash
npm run dev:fast
```

Open [http://localhost:3000](http://localhost:3000).

Demo login:

- Email: `demo@smartclientplanner.com`
- Password: `demo1234`

## Deployment Guide (Simple)

### Option A: Vercel + Supabase Postgres

1. Push project to GitHub.
2. Create Supabase project and copy Postgres connection string.
3. Create Vercel project from repo.
4. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `JWT_SECRET`
5. In Vercel build command, use default (`npm run build`).
6. Run production migration once:

```bash
npx prisma migrate deploy
```

### Option B: VPS / Docker

1. Provision Node.js + PostgreSQL.
2. Set `.env` with production `DATABASE_URL` and strong `JWT_SECRET`.
3. Run:

```bash
npm install
npx prisma migrate deploy
npm run build
npm run start
```

## Notes on Scalability

- Relational data modeled with clear indexes (`userId`, dates, status)
- API route boundaries for separation of concerns
- Prisma ORM allows easy migration to managed Postgres
- App Router structure keeps feature modules isolated

## Optional Features To Add Next

- Voice-to-text note input via Web Speech API
- Export client timeline PDF
- Notification center with browser push or email reminders
- Analytics widgets (most active clients, monthly note volume)
