# Backend: PostgreSQL + Prisma

The website is moving from MongoDB/Mongoose to PostgreSQL (Neon) with Prisma,
inside the same Next.js app (no separate server). This file tracks how to run
it and what is done.

## Status by phase

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository audit and architecture | Done |
| 2 | Prisma schema, first migration, data layer, seed, unit tests | **Done (not yet run against a database)** |
| 3 | Individual admin accounts, sessions, roles, company-scoped access, audit log | **Done: API only, not yet run against a database** |
| 4 | Company management and media uploads (Cloudinary) | Not started |
| 5 | Vacancies and applications on PostgreSQL, private CV storage, emails (Resend) | Not started |
| 6 | Leaders, newsroom, homepage, FAQs, legal pages with review workflow | Not started |
| 7 | Contact messages, settings, exports | Not started |
| 8 | MongoDB import script, switch-over, production readiness | Not started |

Until Phase 8 the live pages keep using MongoDB, and the current `/admin`
page keeps its shared password. The new account APIs below only work once a
database is configured.

## Layout

```
prisma/
  schema.prisma                     data model (43 tables, 18 enums)
  migrations/20261029000000_init/   first migration (SQL, version controlled)
  seed.ts                           loads src/data/*.ts into the database
  seed-helpers.ts                   pure mapping helpers (unit-tested)
src/server/
  db.ts                             shared PrismaClient
  audit.ts                          recordAudit()
  auth/permissions.ts               permission catalogue + system roles
  auth/access.ts                    company-scoped permission checks (pure)
  auth/session-rules.ts             session/lockout rules (pure)
  auth/session.ts                   cookie sessions stored in PostgreSQL
  auth/guard.ts                     requireUser / requirePermission / CSRF
  auth/service.ts                   login, logout, reset, change password
  users/service.ts                  invite, suspend, assign roles
  security/rate-limit.ts            PostgreSQL-backed rate limits
  email/outbox.ts                   queue emails in EmailOutbox
scripts/create-super-admin.ts       first Super Administrator
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

Then create the first Super Administrator (asks for the password, hidden):

```bash
npm run admin:create -- --email you@example.com --name "Your Name"
```

Everyone else is invited from the admin by a Super Administrator.

### What the seed publishes

- Published: the 18 companies (with locations, logos, photos), the six
  sectors, the chairman, the FAQs, career areas.
- Draft only (sample or placeholder data in the current files): the sample
  vacancies, placeholder leaders, newsroom press releases, events, notices,
  videos and the gallery. Editors publish real content through the CMS.

## Admin accounts and access (Phase 3)

Each person has their own account; there is no shared password.

- **Passwords:** Argon2id (19 MiB, 2 passes). At least 12 characters; very
  common passwords and ones containing the email name are refused.
- **Sessions:** a random 256-bit token in an `httpOnly`, `SameSite=Strict`
  cookie (`sg_session`, `Secure` in production). Only its SHA-256 hash is
  stored. Sessions end after 12 hours, after 2 hours idle, on logout, when
  the account is suspended, and when the password changes (every device).
- **Login protection:** 20 attempts per IP and 10 per email per 15 minutes;
  5 wrong passwords lock the account for 15 minutes. The error message is the
  same for every failure, so it never reveals which emails have accounts.
- **Invites and resets:** one-time links, stored hashed, valid 3 days
  (invite) or 1 hour (reset). The email is queued in `EmailOutbox`; actual
  sending arrives with Resend in Phase 5, so until then a Super Administrator
  can create accounts only with `admin:create`.
- **Roles:** a role is granted group-wide or for one company
  (`Membership`). Group-only roles (Super/Group Administrator) cannot be
  limited to a company; company roles (Company Admin, HR Manager) must be.
  Every API checks the permission on the server, together with the company
  that owns the record, and list queries are filtered to the user's
  companies. The last active Super Administrator cannot be suspended or
  demoted.
- **Audit log:** logins (success, failure, lockout), logouts, password
  resets and changes, invites, status and role changes are written to
  `AuditLog` with the actor, a hashed IP and before/after values. Passwords,
  tokens and CV contents are never logged.
- **Cross-site requests:** writes must come from the same origin (Origin /
  Fetch-Metadata check), on top of `SameSite=Strict`.
- **Headers:** `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS in production, `no-store` + `noindex` on admin
  and auth routes. A full Content-Security-Policy follows in Phase 7.
- **Not yet:** two-factor sign-in (schema fields exist; planned before
  go-live), the admin screens for login/invite/reset (built with the CMS
  screens), email delivery (Phase 5).

| Endpoint | Who | Purpose |
|---|---|---|
| `POST /api/auth/login` | anyone | sign in |
| `POST /api/auth/logout` | signed in | sign out this device |
| `GET /api/auth/me` | signed in | profile, roles, permissions per company |
| `POST /api/auth/password-reset` | anyone | email a reset link |
| `POST /api/auth/password-reset/confirm` | link holder | set password / accept invite |
| `POST /api/auth/password` | signed in | change password |
| `GET, POST /api/admin/users` | `user.manage` | list / invite |
| `PATCH /api/admin/users/:id` | `user.manage` | rename, suspend, reactivate |
| `PUT /api/admin/users/:id/memberships` | `user.manage` | replace roles |

Required environment: `AUTH_SECRET` (32+ random characters) and, in
production, `NEXT_PUBLIC_SITE_URL` (used for links in emails, never the
request's Host header).

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
  Authorization filters every query by the user's memberships on the
  server (`src/server/auth/access.ts`).
- Applications keep `vacancyTitle` as a snapshot and are never deleted when a
  vacancy or company is archived (`onDelete: Restrict` / `SetNull`).
- CVs go in `PrivateDocument` (private storage), never a public URL.
- Emails go through `EmailOutbox`, written in the same transaction as the
  event, so a mail outage cannot lose an application.
- Extra integrity rules added to the first migration: one group-wide
  membership per user and role, one published version per legal document,
  valid age and salary ranges, openings > 0.
