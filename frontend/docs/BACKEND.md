# Backend: PostgreSQL + Prisma

The website is moving from MongoDB/Mongoose to PostgreSQL (Neon) with Prisma,
inside the same Next.js app (no separate server). This file tracks how to run
it and what is done.

## Status by phase

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository audit and architecture | Done |
| 2 | Prisma schema, first migration, data layer, seed, unit tests | **Done (not yet run against a database)** |
| 3 | Individual admin accounts, sessions, roles, company-scoped access, audit log | Not started |
| 4 | Company management and media uploads (Cloudinary) | Not started |
| 5 | Vacancies and applications on PostgreSQL, private CV storage, emails (Resend) | Not started |
| 6 | Leaders, newsroom, homepage, FAQs, legal pages with review workflow | Not started |
| 7 | Contact messages, settings, exports | Not started |
| 8 | MongoDB import script, switch-over, production readiness | Not started |

Until Phase 8 the live pages keep using MongoDB; nothing reads PostgreSQL yet.

## Layout

```
prisma/
  schema.prisma                     data model (43 tables, 18 enums)
  migrations/20261029000000_init/   first migration (SQL, version controlled)
  seed.ts                           loads src/data/*.ts into the database
  seed-helpers.ts                   pure mapping helpers (unit-tested)
src/server/
  db.ts                             shared PrismaClient
  auth/permissions.ts               permission catalogue + system roles
tests/                              unit tests (node:test via tsx)
```

## Setting up a database (Neon)

1. Create a free project at neon.tech (region close to Nepal, e.g. Singapore).
2. Create a database named `sanjeevani` and copy both connection strings
   (pooled and direct) into `frontend/.env.local` as `DATABASE_URL` and
   `DIRECT_URL` (see `.env.local.example`). Use a separate Neon branch or
   project for production.
3. From `frontend/`:

```bash
npm install               # also runs `prisma generate`
npm run db:migrate:deploy # creates all tables
npm run db:seed           # loads current site content
npm run db:studio         # optional: browse the data
```

`db:seed` is idempotent: it only creates rows that are missing and never
overwrites edits made later in the CMS.

### What the seed publishes

- Published: the 18 companies (with locations, logos, photos), the six
  sectors, the chairman, the FAQs, career areas.
- Draft only (sample or placeholder data in the current files): the sample
  vacancies, placeholder leaders, newsroom press releases, events, notices,
  videos and the gallery. Editors publish real content through the CMS.

## Changing the schema

```bash
# edit prisma/schema.prisma, then (needs a development database):
npm run db:migrate:dev -- --name describe_the_change
```

Commit the generated folder in `prisma/migrations/`. Production runs
`npm run db:migrate:deploy`, which only applies committed migrations.

## Checks

```bash
npm run db:validate   # schema is valid
npm test              # unit tests
npm run typecheck
npm run lint
npm run build
```

## Backups

Neon keeps point-in-time history (length depends on the plan) and lets you
restore by creating a branch at an earlier time. For an off-site copy:

```bash
pg_dump "$DIRECT_URL" --format=custom --file=sanjeevani-$(date +%F).dump
pg_restore --clean --no-owner --dbname="$DIRECT_URL" sanjeevani-YYYY-MM-DD.dump
```

## Design notes

- UUID keys everywhere; `legacyMongoId` on companies and applications keeps
  the old MongoDB id for traceable migration.
- Company scope: every company-owned row has `companyId`; a user's
  `Membership` grants a role group-wide (`companyId` null) or for one company.
  Authorization (Phase 3) filters every query by the user's memberships on
  the server.
- Applications keep `vacancyTitle` as a snapshot and are never deleted when a
  vacancy or company is archived (`onDelete: Restrict` / `SetNull`).
- CVs go in `PrivateDocument` (private storage), never a public URL.
- Emails go through `EmailOutbox`, written in the same transaction as the
  event, so a mail outage cannot lose an application.
- Extra integrity rules added to the first migration: one group-wide
  membership per user and role, one published version per legal document,
  valid age and salary ranges, openings > 0.
