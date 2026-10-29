import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can, companyWhere } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { cvProblem, safeFileName, sniffCv } from "@/server/documents/rules";
import { deleteDocument, readDocument, storeDocument } from "@/server/documents/storage";
import { enqueueEmail } from "@/server/email/outbox";
import { deliverSoon } from "@/server/email/sender";
import { badRequest, conflict, forbidden, HttpError, notFound } from "@/server/http/errors";
import { hashIdentifier } from "@/server/security/crypto";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { formatKathmandu, kathmanduDate } from "@/server/time";
import {
  ageProblem,
  applicationTransitionProblem,
  isAcceptingApplications,
  nextApplicationReference,
  toCsv,
  type ApplicationStatus,
} from "@/server/recruitment/rules";
import { applicationFormSchema } from "@/server/validation/recruitment";

type Meta = { ipHash: string; userAgent: string | null };

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const RETENTION_DAYS = Number(process.env.APPLICATION_RETENTION_DAYS) || 730;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : undefined;
};

type Target = { vacancyId: string | null; careerAreaId: string | null; companyId: string | null; title: string; companyName: string; minAge: number | null; maxAge: number | null };

// A listed vacancy (id or slug), or "general:<career-area-slug>".
async function resolveTarget(value: string): Promise<Target> {
  if (value.startsWith("general:")) {
    const area = await prisma.careerArea.findUnique({
      where: { slug: value.slice("general:".length) },
      include: { companies: { include: { company: { select: { id: true, name: true, status: true } } } } },
    });
    if (!area) throw badRequest("Choose the vacancy you are applying for.");
    const live = area.companies.filter((c) => c.company.status === "PUBLISHED");
    // With exactly one company, that company's HR owns the application;
    // otherwise group HR does (companyId null).
    const only = live.length === 1 ? live[0].company : null;
    return { vacancyId: null, careerAreaId: area.id, companyId: only?.id ?? null, title: `General application: ${area.title}`, companyName: only?.name ?? "Sanjeevani Group", minAge: null, maxAge: null };
  }
  const vacancy = await prisma.vacancy.findFirst({
    where: UUID.test(value) ? { id: value } : { slug: value },
    include: { company: { select: { name: true, status: true } } },
  });
  if (!vacancy || vacancy.company.status !== "PUBLISHED") throw badRequest("Choose the vacancy you are applying for.");
  if (!isAcceptingApplications(vacancy)) throw badRequest("This position is no longer accepting applications.");
  return { vacancyId: vacancy.id, careerAreaId: vacancy.careerAreaId, companyId: vacancy.companyId, title: vacancy.title, companyName: vacancy.company.name, minAge: vacancy.minAge, maxAge: vacancy.maxAge };
}

export async function submitApplication(form: FormData, meta: Meta, baseUrl: string) {
  // Honeypot field hidden from people: bots fill it. Pretend success.
  if (field(form, "website")?.trim()) return { referenceNumber: null };

  await enforceRateLimit(`apply:ip:${meta.ipHash}`, 10, HOUR, "Too many applications from this connection. Please try again later.");

  const input = applicationFormSchema.parse(Object.fromEntries(
    ["vacancyId", "fullName", "email", "phone", "age", "gender", "address", "education", "experienceYears", "currentEmployer", "expectedSalary", "coverLetter", "consent"].map((k) => [k, field(form, k)]),
  ));
  const target = await resolveTarget(input.vacancyId);
  const tooOld = ageProblem(input.age, target);
  if (tooOld) throw badRequest(tooOld);

  const cv = form.get("cv");
  if (!(cv instanceof File)) throw badRequest("Attach your CV.");
  const bytes = new Uint8Array(await cv.arrayBuffer());
  const problem = cvProblem(bytes, cv.name);
  if (problem) throw badRequest(problem);
  const type = sniffCv(bytes, cv.name)!;

  // One application per person per position every 30 days.
  const dedupeKey = hashIdentifier(`${input.email}|${target.vacancyId ?? `area:${target.careerAreaId}`}`);
  const recent = await prisma.jobApplication.findFirst({ where: { dedupeKey, createdAt: { gt: new Date(Date.now() - 30 * DAY) }, status: { not: "WITHDRAWN" } }, select: { id: true } });
  if (recent) throw conflict("You have already applied for this position. Our team has your application.");

  const stored = await storeDocument(bytes, type.mimeType, type.extension, "cv");
  try {
    const now = new Date();
    const { year } = kathmanduDate(now);
    const created = await withUniqueRetry(() =>
      prisma.$transaction(async (tx) => {
        const last = await tx.jobApplication.findFirst({ where: { referenceNumber: { startsWith: `SG-${year}-` } }, orderBy: { referenceNumber: "desc" }, select: { referenceNumber: true } });
        const referenceNumber = nextApplicationReference(year, last?.referenceNumber ?? null);
        const application = await tx.jobApplication.create({
          data: {
            referenceNumber,
            companyId: target.companyId,
            vacancyId: target.vacancyId,
            careerAreaId: target.careerAreaId,
            vacancyTitle: target.title,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            age: input.age,
            gender: input.gender,
            address: input.address,
            education: input.education,
            experienceYears: new Prisma.Decimal(input.experienceYears),
            currentEmployer: input.currentEmployer,
            expectedSalary: input.expectedSalary,
            coverLetter: input.coverLetter,
            consentAt: now,
            dedupeKey,
            submittedIpHash: meta.ipHash,
            retainUntil: new Date(now.getTime() + RETENTION_DAYS * DAY),
            documents: {
              create: {
                kind: "CV",
                provider: stored.provider,
                storageKey: stored.storageKey,
                data: stored.data ? Buffer.from(stored.data) : null,
                originalName: safeFileName(cv.name, type.extension),
                mimeType: type.mimeType,
                bytes: bytes.length,
                sha256: createHash("sha256").update(bytes).digest("hex"),
                scanStatus: "SKIPPED", // no virus scanner configured; files are only ever downloaded, never rendered inline
              },
            },
            statusHistory: { create: { toStatus: "SUBMITTED" } },
          },
          select: { id: true, referenceNumber: true },
        });

        const submittedAt = formatKathmandu(now, true);
        const keys = [
          await enqueueEmail({
            idempotencyKey: `application-received:${application.id}`,
            template: "application-received",
            to: input.email,
            subject: `Application received: ${target.title} (${referenceNumber})`,
            payload: { name: input.fullName, vacancyTitle: target.title, companyName: target.companyName, referenceNumber, submittedAt },
          }, tx),
        ];
        const hr = (process.env.HR_NOTIFICATION_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const to of hr) {
          keys.push(await enqueueEmail({
            idempotencyKey: `application-new:${application.id}:${to}`,
            template: "application-new",
            to,
            subject: `New application: ${target.title} (${referenceNumber})`,
            payload: { name: input.fullName, vacancyTitle: target.title, companyName: target.companyName, referenceNumber, submittedAt, link: `${baseUrl}/admin?application=${application.id}` },
          }, tx));
        }
        await recordAudit({ action: "application.submit", entityType: "JobApplication", entityId: application.id, companyId: target.companyId, metadata: { referenceNumber, vacancyId: target.vacancyId }, ...meta }, tx);
        return { ...application, keys };
      }),
    );
    await deliverSoon(created.keys);
    return { referenceNumber: created.referenceNumber };
  } catch (error) {
    await deleteDocument(stored).catch(() => undefined); // don't leave an orphaned CV
    throw error;
  }
}

async function withUniqueRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!duplicate || attempt >= 4) throw error;
    }
  }
}

// ------------------------------------------------------------------- admin

type ListQuery = { q?: string; status?: ApplicationStatus; vacancyId?: string; companyId?: string; from?: string; to?: string };

function adminWhere(user: SessionUser, permission: "application.read" | "application.export", query: ListQuery): Prisma.JobApplicationWhereInput {
  return {
    AND: [
      companyWhere(user.access, permission),
      query.status ? { status: query.status } : {},
      query.vacancyId ? { vacancyId: query.vacancyId } : {},
      query.companyId ? { companyId: query.companyId } : {},
      query.from ? { createdAt: { gte: new Date(query.from) } } : {},
      query.to ? { createdAt: { lte: new Date(query.to) } } : {},
      query.q
        ? { OR: [
            { fullName: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { referenceNumber: { contains: query.q, mode: "insensitive" } },
            { phone: { contains: query.q } },
          ] }
        : {},
    ],
  };
}

const listSelect = {
  id: true, referenceNumber: true, vacancyTitle: true, fullName: true, email: true, phone: true, age: true, education: true,
  experienceYears: true, status: true, createdAt: true, updatedAt: true,
  company: { select: { id: true, name: true } },
  vacancy: { select: { id: true, referenceCode: true } },
} satisfies Prisma.JobApplicationSelect;

export async function listApplications(user: SessionUser, query: ListQuery & { page: number; pageSize: number }) {
  const where = adminWhere(user, "application.read", query);
  const [total, items] = await prisma.$transaction([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({ where, select: listSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items };
}

async function loadForUser(user: SessionUser, id: string, permission: "application.read" | "application.update" | "application.delete") {
  const application = await prisma.jobApplication.findUnique({ where: { id }, select: { id: true, companyId: true, status: true, referenceNumber: true } });
  // Not found and not allowed look the same, so ids of other companies' applications leak nothing.
  if (!application || !can(user.access, "application.read", application.companyId)) throw notFound("Application not found.");
  if (permission !== "application.read" && !can(user.access, permission, application.companyId)) throw forbidden();
  return application;
}

export async function getApplication(user: SessionUser, id: string, meta: Meta) {
  await loadForUser(user, id, "application.read");
  const application = await prisma.jobApplication.findUniqueOrThrow({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      vacancy: { select: { id: true, referenceCode: true, title: true, slug: true } },
      careerArea: { select: { id: true, title: true } },
      documents: { where: { deletedAt: null }, select: { id: true, kind: true, originalName: true, mimeType: true, bytes: true, scanStatus: true, createdAt: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { id: true, name: true } } } },
      notes: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true } } } },
    },
  });
  await recordAudit({ actorId: user.id, action: "application.view", entityType: "JobApplication", entityId: id, companyId: application.companyId, ...meta });
  return application;
}

export async function changeApplicationStatus(user: SessionUser, id: string, input: { status: ApplicationStatus; note?: string }, meta: Meta) {
  const current = await loadForUser(user, id, "application.update");
  const problem = applicationTransitionProblem(current.status, input.status);
  if (problem) throw badRequest(problem);
  return prisma.$transaction(async (tx) => {
    // Guard against two reviewers changing the status at the same moment.
    const updated = await tx.jobApplication.updateMany({ where: { id, status: current.status }, data: { status: input.status } });
    if (updated.count !== 1) throw conflict("Someone else changed this application's status. Reload and try again.");
    await tx.applicationStatusHistory.create({ data: { applicationId: id, fromStatus: current.status, toStatus: input.status, note: input.note || null, changedById: user.id } });
    await recordAudit({ actorId: user.id, action: "application.status_change", entityType: "JobApplication", entityId: id, companyId: current.companyId, metadata: { from: current.status, to: input.status }, ...meta }, tx);
    return { status: input.status };
  });
}

export async function addApplicationNote(user: SessionUser, id: string, body: string, meta: Meta) {
  const current = await loadForUser(user, id, "application.update");
  const note = await prisma.applicationNote.create({ data: { applicationId: id, authorId: user.id, body }, include: { author: { select: { id: true, name: true } } } });
  await recordAudit({ actorId: user.id, action: "application.note", entityType: "JobApplication", entityId: id, companyId: current.companyId, ...meta });
  return note;
}

export async function downloadApplicationDocument(user: SessionUser, applicationId: string, documentId: string, meta: Meta) {
  const application = await loadForUser(user, applicationId, "application.read");
  const doc = await prisma.privateDocument.findFirst({ where: { id: documentId, applicationId, deletedAt: null } });
  if (!doc) throw notFound("Document not found.");
  if (doc.scanStatus === "INFECTED") throw new HttpError(423, "This file was flagged by the virus scanner and cannot be downloaded.", "blocked");
  const bytes = await readDocument(doc);
  await recordAudit({ actorId: user.id, action: "application.document.download", entityType: "JobApplication", entityId: applicationId, companyId: application.companyId, metadata: { documentId, kind: doc.kind }, ...meta });
  return { bytes, fileName: doc.originalName, mimeType: doc.mimeType };
}

export async function exportApplicationsCsv(user: SessionUser, query: ListQuery, meta: Meta) {
  const rows = await prisma.jobApplication.findMany({
    where: adminWhere(user, "application.export", query),
    select: { ...listSelect, gender: true, address: true, currentEmployer: true, expectedSalary: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  await recordAudit({ actorId: user.id, action: "application.export", entityType: "JobApplication", metadata: { count: rows.length, filters: query }, ...meta });
  return toCsv(
    ["Reference", "Submitted (Nepal time)", "Status", "Position", "Company", "Full name", "Email", "Phone", "Age", "Gender", "Address", "Education", "Experience (years)", "Current employer", "Expected salary"],
    rows.map((r) => [
      r.referenceNumber, formatKathmandu(r.createdAt, true), r.status, r.vacancyTitle, r.company?.name ?? "Group", r.fullName, r.email, r.phone, r.age,
      r.gender, r.address, r.education, Number(r.experienceYears), r.currentEmployer, r.expectedSalary,
    ]),
  );
}

export async function deleteApplication(user: SessionUser, id: string, meta: Meta) {
  const current = await loadForUser(user, id, "application.delete");
  const documents = await prisma.privateDocument.findMany({ where: { applicationId: id }, select: { provider: true, storageKey: true } });
  await prisma.$transaction(async (tx) => {
    await tx.jobApplication.delete({ where: { id } });
    // Keep only the reference number: the personal data is gone.
    await recordAudit({ actorId: user.id, action: "application.delete", entityType: "JobApplication", entityId: id, companyId: current.companyId, metadata: { referenceNumber: current.referenceNumber }, ...meta }, tx);
  });
  for (const doc of documents) await deleteDocument(doc).catch((error) => console.error("Could not delete a stored document:", error instanceof Error ? error.message : error));
}

// For the cron job: how many applications are past their retention date.
// Deleting them is a decision for HR, made in the admin, never automatic.
export function countApplicationsPastRetention(now = new Date()) {
  return prisma.jobApplication.count({ where: { retainUntil: { lt: now } } });
}
