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
| 4 | Company management and media uploads (Cloudinary) | **Done: API only, not yet run against a database or Cloudinary** |
| 5 | Vacancies and applications on PostgreSQL, private CV storage, emails (Resend) | **Done: API only, not yet run against a database, Cloudinary or Resend** |
| 6 | Leaders, newsroom, homepage, FAQs, legal pages with review workflow | **Done: API only, not yet run against a database** |
| 7 | Contact messages, settings, exports | **Done** (contact form on /contact now posts to the inbox) |
| 8 | Admin console, switch-over, production readiness | **In progress**: `/admin` console and careers pages on PostgreSQL done; company, leader, newsroom and legal pages still read `src/data` |

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
  companies/rules.ts                status workflow, publish checks (pure)
  companies/service.ts              public + admin company operations
  media/rules.ts                    upload checks, Cloudinary signing (pure)
  media/storage.ts                  Cloudinary (or local disk in development)
  media/service.ts                  media library
  validation/*.ts                   zod input schemas
  recruitment/rules.ts              vacancy/application workflow, CSV (pure)
  recruitment/vacancies.ts          public + admin vacancies, auto-close
  recruitment/applications.ts       submit, review, notes, CV download, export
  documents/                        private CV storage (Cloudinary or DB)
  email/templates.ts, sender.ts     email content, Resend delivery + retries
  time.ts                           Nepal time (Asia/Kathmandu) helpers
  content/types.ts                  registry of editable content types
  content/service.ts                one CRUD + workflow engine for all of them
  content/workflow.ts               editorial workflow (pure)
  content/blocks.ts                 structured rich text (no HTML)
  content/legal.ts                  versioned Privacy Policy / Terms
scripts/create-super-admin.ts       first Super Administrator
tests/                              unit tests (node:test via tsx)
```

## Setting up a database (Neon)

1. Create a free project at neon.tech (region close to Nepal, e.g. Singapore).
2. Create a database named `sanjeevani` and copy both connection strings
   (pooled and direct) into `frontend/.env.local` as `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` (see `.env.local.example`; `neon env pull` writes both). Use a separate Neon branch or
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
production, `SITE_URL` (read at runtime; used for links in emails, never the
request's Host header).

## Companies and media (Phase 4)

**Companies** follow a status workflow: `DRAFT → PUBLISHED`, `PUBLISHED →
DRAFT` (unpublish), anything `→ ARCHIVED`, `ARCHIVED → DRAFT` (restore; never
straight back to live). Publishing needs a name, sector label and a
description of at least 20 characters. The web address (slug) cannot change
while a company is published, so shared links keep working. Every edit saves
the previous version in `ContentRevision` (last 20 viewable) and writes an
audit entry listing the changed fields. If two people edit at once, the
second save is refused (`expectedUpdatedAt`) instead of silently overwriting.

Company Admins and Content Editors only see and edit their own companies;
creating companies is group-level (`company.create`). The public API only
returns `PUBLISHED` companies.

**Images** are uploaded through the server, which checks the file's real
bytes (JPEG, PNG, WebP, GIF, AVIF; max 5 MB; SVG refused because it can
contain scripts) and requires alt text, then stores them in Cloudinary under
`CLOUDINARY_FOLDER/<folder>`. Without Cloudinary keys in development, files go
to `public/uploads/` (git-ignored); in production uploads are refused until
Cloudinary is configured. An image still used anywhere cannot be deleted, and
people without a group-wide `media.upload` grant can only delete their own.

| Endpoint | Who | Purpose |
|---|---|---|
| `GET /api/companies[?sector=slug]` | public | published companies |
| `GET /api/companies/:slug` | public | one published company |
| `GET, POST /api/admin/companies` | `company.read` / `company.create` | list (scoped) / create draft |
| `GET, PATCH /api/admin/companies/:id` | `company.read` / `company.update` | view / edit |
| `POST /api/admin/companies/:id/status` | `company.publish` | publish, unpublish, archive, restore |
| `PUT /api/admin/companies/:id/locations` | `company.update` | replace locations |
| `GET /api/admin/companies/:id/revisions` | `company.read` | previous versions |
| `GET, POST /api/admin/media` | `media.upload` | library / upload (multipart: file, altText, folder) |
| `PATCH, DELETE /api/admin/media/:id` | `media.upload` | edit alt text / delete unused |

Cloudinary setup: create a free account, then set `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Dashboard → API Keys) and
optionally `CLOUDINARY_FOLDER` (default `sanjeevani`). Note: some hosts cap
request bodies (Vercel: 4.5 MB), which lowers the effective image limit there.

## Vacancies and applications (Phase 5)

**Vacancies**: `DRAFT → PUBLISHED → CLOSED` (re-publishable), anything
`→ ARCHIVED → DRAFT`. Publishing checks the posting is complete (summary,
education, experience, responsibilities, sensible age and salary ranges, a
future deadline) and that the company is live. Reference codes are
sequential (`SG-V-0001`). A deadline is a Nepal calendar date: applications
are accepted until 23:59 Nepal time that day, and the cron job then marks
the vacancy `CLOSED`. Salaries are NPR and only shown when "disclosed".

**Applications** (`POST /api/applications`) take exactly the fields the
current form sends, so the site switches over by changing one URL in
`ApplicationForm.tsx` (Phase 8). Checks: same-origin, honeypot, 10 per IP per
hour, one application per email per position per 30 days, the vacancy must
be open, age within the vacancy's range, CV checked by its bytes and
extension (PDF, DOC, DOCX, JPG, PNG; 5 MB). Each gets a reference number per
Nepal year (`SG-2026-000001`), a status history, and a retention date
(`APPLICATION_RETENTION_DAYS`, default 730). The applicant gets a
confirmation email and `HR_NOTIFICATION_EMAIL` a notification without
personal details.

**CVs are private.** With Cloudinary configured they are stored as
`authenticated` raw files; otherwise in PostgreSQL (`CV_STORAGE` overrides).
There is no public URL: HR downloads through
`/api/admin/job-applications/:id/documents/:docId`, which checks the
permission for that company, logs the download, and always sends the file as
an attachment with a sandboxing CSP. No virus scanner is configured yet
(`scanStatus = SKIPPED`).

**Review**: statuses `SUBMITTED → UNDER_REVIEW → SHORTLISTED → INTERVIEW →
OFFERED`, with `REJECTED` (re-openable) and `WITHDRAWN` (final). Every change
is recorded with who/when/note; concurrent changes are refused. Viewing,
downloading, exporting and deleting are all audited. CSV exports
neutralise spreadsheet formulas. Expired applications are counted by the
cron job but never deleted automatically.

**Emails** are sent through SMTP when `SMTP_USER`/`SMTP_PASS` are set (a
Gmail account with an App Password works without owning a domain, ~500 per
day; From is that Gmail address), otherwise through Resend (needs a verified
domain). `EMAIL_PROVIDER=smtp|resend` forces one. They go into `EmailOutbox` inside the same transaction as the change,
are sent straight away when possible, and retried by the cron job with
backoff (1, 2, 4 … 60 minutes; failed after 6 attempts). Resend's
idempotency key prevents duplicates. One-time links are removed from the
outbox once sent. Without `RESEND_API_KEY` emails simply stay queued.

| Endpoint | Who | Purpose |
|---|---|---|
| `GET /api/vacancies[?careerArea=&company=]` | public | live vacancies |
| `GET /api/vacancies/:slug` | public | one vacancy |
| `POST /api/applications` | public | apply (multipart) |
| `GET, POST /api/admin/vacancies` | `vacancy.read` / `vacancy.update` | list / create |
| `GET, PATCH /api/admin/vacancies/:id` | `vacancy.read` / `vacancy.update` | view / edit |
| `POST /api/admin/vacancies/:id/status` | `vacancy.publish` | publish, close, archive, restore |
| `GET /api/admin/job-applications` | `application.read` | list, filter, paginate |
| `GET /api/admin/job-applications/export` | `application.export` | CSV |
| `GET, DELETE /api/admin/job-applications/:id` | `application.read` / `.delete` | view / delete |
| `POST /api/admin/job-applications/:id/status` | `application.update` | change status |
| `POST /api/admin/job-applications/:id/notes` | `application.update` | internal note |
| `GET /api/admin/job-applications/:id/documents/:docId` | `application.read` | download CV |
| `GET /api/cron/maintenance` | `Bearer CRON_SECRET` | emails, auto-close, cleanup |

Schedule the cron endpoint every 5–15 minutes (Vercel Cron, a crontab with
`curl -H "Authorization: Bearer $CRON_SECRET" https://site/api/cron/maintenance`,
or an uptime monitor).

## Content: leaders, newsroom, homepage, FAQs, pages (Phase 6)

All editable content goes through one engine (`src/server/content/`), driven
by a registry entry per type: `faqs`, `news`, `events`, `notices`, `videos`,
`galleries`, `homepage-slides`, `key-sectors`, `impact-pillars`, `pages`,
`leaders`. Each entry defines its validation (unknown fields such as `status`
are refused), how it maps to the database, its permissions and which
companies own it.

**Workflow** (same for every type):

```
DRAFT ─submit→ PENDING_REVIEW ─approve→ APPROVED ─publish→ PUBLISHED
        (reject → DRAFT)              unpublish → DRAFT;  archive ⇄ restore
```

Content Editors (`content.update`) draft and submit; Content Publishers
(`content.publish`) approve, reject, publish, unpublish and archive. Live
content can only be edited by someone who may publish it; editors must have
it unpublished first. Content that has ever been public can't be deleted,
only archived. Every edit saves the previous version (`ContentRevision`),
every action is audited, and simultaneous edits are detected
(`expectedUpdatedAt`). Leaders use `leader.update` / `leader.publish`.

**Company scope:** news, events, notices and galleries with a `companyId`
belong to that company; group-level items (`companyId` null) and group types
(FAQs, homepage, pages, videos) need group-wide rights. A leader belongs to
every company they hold a role in; the chairman is group-level.

**Rich text** (news, events, pages) is stored as structured blocks
(paragraph, heading, list, quote, image, link), never HTML, so stored content
can't inject scripts. Links must be `https://` or site paths.

**Legal pages** are versioned. Editors start a new draft (a copy of the
latest version), publishers publish it; the previous live version is archived
in the same transaction and kept as the record of what applied when (the
database allows only one published version per document). A live version
can't be archived without publishing a replacement.

| Endpoint | Who | Purpose |
|---|---|---|
| `GET /api/content/:type[?company=&placement=]` | public | published items |
| `GET /api/content/:type/:slugOrKey` | public | one item (news, events, galleries, leaders, pages) |
| `GET /api/legal/:kind` | public | live Privacy Policy / Terms |
| `GET, POST /api/admin/content/:type` | per type | list (scoped) / create draft |
| `GET, PATCH, DELETE /api/admin/content/:type/:id` | per type | view / edit / delete |
| `POST /api/admin/content/:type/:id/workflow` | per type | submit, approve, reject, publish, … |
| `GET /api/admin/content/:type/:id/revisions` | per type | previous versions |
| `GET, POST /api/admin/legal/:kind` | `legal.update` | versions / new draft |
| `PATCH /api/admin/legal/versions/:id` | `legal.update` | edit draft |
| `POST /api/admin/legal/versions/:id/workflow` | `legal.update` / `legal.publish` | submit, approve, publish, … |

Not yet: the legal texts currently in `LegalDocument.tsx` are imported into
the database during the switch-over (Phase 8).

## Contact inbox, settings and audit log (Phase 7)

- **Enquiries** (`POST /api/contact`, used by the /contact form): stored in
  `ContactMessage`, honeypot + 5 per IP per hour, notification to
  `CONTACT_NOTIFICATION_EMAIL` (or `HR_NOTIFICATION_EMAIL`) without the message
  text. No confirmation is emailed to the sender, so the form can't be abused
  to send mail to others. If the server is unreachable, the form falls back
  to opening an email draft. Admin: `GET /api/admin/contact`,
  `GET|PATCH /api/admin/contact/:id` (status NEW / IN_PROGRESS / RESOLVED /
  SPAM, assignee), `GET /api/admin/contact/export` (CSV). Permissions
  `contact.read` / `contact.update`, scoped by company.
- **Settings** (`GET /api/settings` public, `GET|PUT /api/admin/settings` with
  `settings.manage`): only these keys exist, each validated: `contact.email`,
  `contact.phone`, `contact.address`, `social.facebook|youtube|linkedin|instagram`
  (https only), `seo.defaultTitle`, `seo.defaultDescription`,
  `careers.applicationsOpen`. `null` removes a key.
- **Audit log viewer** (`GET /api/admin/audit`, `GET /api/admin/audit/export`,
  `audit.read`): filter by action prefix, actor, entity, company, dates.
  Company-scoped auditors only see their companies' entries.

## Admin console (Phase 8)

`/admin` is the new console (the shared-password Mongo admin moved to
`/admin/legacy` until the switch-over). Sign-in uses individual accounts;
"Forgot your password?" emails a reset link. Email links open
`/admin/accept-invite` and `/admin/reset-password`. Tabs appear only for the
permissions you hold:

- **Applications**: search/filter, detail drawer with CV download, status
  changes (only the allowed next steps), history, internal notes, CSV export,
  delete.
- **Vacancies**: create/edit (Nepal-date deadline, age and NPR salary range),
  publish / close / archive / restore.
- **Enquiries**: inbox with status changes and CSV export.
- **Users**: invite, roles per group or company, suspend / reactivate.
- **Audit log**, **Settings**, **My account** (change password).

Companies, leaders, newsroom, homepage, FAQ and legal pages are managed
through their APIs (above); their editing screens are not built yet.

**Careers pages now read PostgreSQL.** `/careers`, `/careers/<area>` and
`/careers/<area>/<vacancy>` show the vacancies published in `/admin`
(`src/server/public/vacancies.ts` maps them to the existing page components).
Publishing, editing, closing or archiving refreshes the pages at once; they
also refresh at most every 60 s. A vacancy needs a career area to appear.
The application form posts to `/api/applications` and shows the reference
number. The seeded sample vacancies are drafts, so the site shows none until
HR publishes real ones. Without `DATABASE_URL` (local only) the pages fall
back to the samples in `src/data/careers.ts`.

MongoDB import: not needed. The existing Mongo data was confirmed as
disposable, and the database was filled from the site's own content
(`npm run db:seed`).

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
pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --file=sanjeevani-$(date +%F).dump
pg_restore --clean --no-owner --dbname="$DATABASE_URL_UNPOOLED" sanjeevani-YYYY-MM-DD.dump
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

## Multi-company admin (company switcher, approvals, pages)

- **Company switcher** (Dashboard, Applications, Vacancies, Enquiries): lists only the
  companies the signed-in person may read. The chosen `companyId` is sent to the API,
  where it is combined (AND) with the person's own scope, so it can only narrow results;
  passing another company's id returns nothing rather than that company's data.
- **Publishing approvals**: one queue of everything in review (pages, news, events,
  notices, galleries, videos, leaders) for people with publish rights. Approving runs
  the normal workflow endpoint, which re-checks the publish permission.
- **Pages**: website pages (title, web address, introduction, content blocks, SEO fields)
  through the same draft, review and publish workflow. Public rendering of these pages
  is not wired into the site yet.
- **Sidebar groups**: Overview, Organization, Website, Recruitment, Communications,
  Administration; each person only sees items their role allows.

### Authorization test (live)

`scripts/e2e/authz.cjs` checks, against a running server and the real database, that:
company scope cannot be widened by changing ids; another company's application, CV and
vacancy return 404; HR cannot publish content; editors cannot publish through the API;
auditors cannot modify; suspended users are signed out at once; anonymous requests get
401. It creates throwaway `@e2e.invalid` users and removes everything it creates.

    npm run admin:create -- --email super@e2e.invalid --name E2E   # throwaway admin
    BASE=http://localhost:3000 E2E_ADMIN_PASSWORD=... node --env-file=.env.local scripts/e2e/authz.cjs
