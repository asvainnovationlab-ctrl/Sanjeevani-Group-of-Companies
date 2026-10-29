import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can, companyWhere } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { kathmanduDateToInstant } from "@/server/time";
import { slugify } from "../../../prisma/seed-helpers";
import { isAcceptingApplications, isPubliclyVisible, nextVacancyCode, vacancyPublishProblem, vacancyTransition, type VacancyAction } from "@/server/recruitment/rules";
import type { VacancyCreateInput, VacancyUpdateInput } from "@/server/validation/recruitment";

type Meta = { ipHash: string; userAgent: string | null };

const vacancyInclude = {
  company: { select: { id: true, name: true, slug: true, status: true } },
  careerArea: { select: { id: true, slug: true, title: true } },
  department: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
} satisfies Prisma.VacancyInclude;

type VacancyRow = Prisma.VacancyGetPayload<{ include: typeof vacancyInclude }>;

const num = (value: Prisma.Decimal | null) => (value === null ? null : Number(value));

// ------------------------------------------------------------------ public

export function toPublicVacancy(v: VacancyRow, now = new Date()) {
  return {
    id: v.id,
    slug: v.slug,
    referenceCode: v.referenceCode,
    title: v.title,
    company: { name: v.company.name, slug: v.company.slug },
    careerArea: v.careerArea ? { slug: v.careerArea.slug, title: v.careerArea.title } : null,
    department: v.department?.name ?? null,
    location: v.locationText,
    summary: v.summary,
    description: v.description,
    responsibilities: v.responsibilities,
    qualifications: v.qualifications,
    requiredEducation: v.requiredEducation,
    requiredExperience: v.requiredExperience,
    skills: v.skills,
    requiredDocuments: v.requiredDocuments,
    employmentType: v.employmentType,
    openings: v.openings,
    minAge: v.minAge,
    maxAge: v.maxAge,
    salary: v.salaryDisclosed
      ? { min: num(v.salaryMin), max: num(v.salaryMax), currency: v.salaryCurrency, period: v.salaryPeriod, note: v.salaryNote }
      : null,
    openingDate: v.openingDate,
    deadline: v.deadline,
    acceptingApplications: isAcceptingApplications(v, now),
  };
}

const publicWhere = (now: Date): Prisma.VacancyWhereInput => ({
  status: "PUBLISHED",
  company: { status: "PUBLISHED" },
  OR: [{ publishAt: null }, { publishAt: { lte: now } }],
});

export async function listPublicVacancies(filter: { careerArea?: string; company?: string } = {}) {
  const now = new Date();
  const rows = await prisma.vacancy.findMany({
    where: {
      ...publicWhere(now),
      ...(filter.careerArea ? { careerArea: { slug: filter.careerArea } } : {}),
      ...(filter.company ? { company: { slug: filter.company, status: "PUBLISHED" } } : {}),
    },
    include: vacancyInclude,
    orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }],
  });
  return rows.filter((v) => isPubliclyVisible(v, now)).map((v) => toPublicVacancy(v, now));
}

export async function getPublicVacancy(slug: string) {
  const now = new Date();
  const row = await prisma.vacancy.findFirst({ where: { slug, ...publicWhere(now) }, include: vacancyInclude });
  return row && isPubliclyVisible(row, now) ? toPublicVacancy(row, now) : null;
}

// ------------------------------------------------------------------- admin

export async function listAdminVacancies(user: SessionUser, query: { q?: string; status?: VacancyRow["status"]; companyId?: string }) {
  return prisma.vacancy.findMany({
    where: {
      AND: [
        companyWhere(user.access, "vacancy.read"),
        query.companyId ? { companyId: query.companyId } : {},
        query.status ? { status: query.status } : {},
        query.q ? { OR: [{ title: { contains: query.q, mode: "insensitive" } }, { referenceCode: { contains: query.q, mode: "insensitive" } }] } : {},
      ],
    },
    include: { ...vacancyInclude, _count: { select: { applications: true } } },
    orderBy: [{ updatedAt: "desc" }],
    take: 500,
  });
}

export async function getAdminVacancy(user: SessionUser, id: string) {
  const vacancy = await prisma.vacancy.findUnique({ where: { id }, include: { ...vacancyInclude, _count: { select: { applications: true } } } });
  if (!vacancy || !can(user.access, "vacancy.read", vacancy.companyId)) throw notFound("Vacancy not found.");
  return vacancy;
}

// Turns validated input into Prisma data (dates in Nepal time, decimals).
function toData(input: Partial<VacancyCreateInput>) {
  const { openingDate, deadline, publishAt, closeAt, salaryMin, salaryMax, ...rest } = input;
  return {
    ...rest,
    ...(openingDate !== undefined ? { openingDate: openingDate ? kathmanduDateToInstant(openingDate) : null } : {}),
    ...(deadline !== undefined ? { deadline: deadline ? kathmanduDateToInstant(deadline) : null } : {}),
    ...(publishAt !== undefined ? { publishAt: publishAt ? new Date(publishAt) : null } : {}),
    ...(closeAt !== undefined ? { closeAt: closeAt ? new Date(closeAt) : null } : {}),
    ...(salaryMin !== undefined ? { salaryMin: salaryMin === null ? null : new Prisma.Decimal(salaryMin) } : {}),
    ...(salaryMax !== undefined ? { salaryMax: salaryMax === null ? null : new Prisma.Decimal(salaryMax) } : {}),
  };
}

async function assertReferences(db: Prisma.TransactionClient, companyId: string, input: Partial<VacancyCreateInput>) {
  if (input.locationId && !(await db.location.findFirst({ where: { id: input.locationId, companyId }, select: { id: true } }))) {
    throw badRequest("That location does not belong to this company.");
  }
  if (input.departmentId && !(await db.department.findFirst({ where: { id: input.departmentId, companyId }, select: { id: true } }))) {
    throw badRequest("That department does not belong to this company.");
  }
  if (input.careerAreaId && !(await db.careerArea.findUnique({ where: { id: input.careerAreaId }, select: { id: true } }))) {
    throw badRequest("The selected career area does not exist.");
  }
  if (input.ownerId && !(await db.user.findFirst({ where: { id: input.ownerId, status: "ACTIVE" }, select: { id: true } }))) {
    throw badRequest("The selected owner is not an active admin user.");
  }
}

async function uniqueSlug(db: Prisma.TransactionClient, base: string, exceptId?: string) {
  const root = base.slice(0, 90) || "vacancy";
  for (let n = 1; n < 100; n += 1) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const clash = await db.vacancy.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
  }
  throw conflict("Could not find a free web address for this vacancy. Choose a slug.");
}

// Reference codes are sequential; two creates at the same moment can pick the
// same code, so the unique-constraint error is retried.
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

export async function createVacancy(user: SessionUser, input: VacancyCreateInput, meta: Meta) {
  if (!can(user.access, "vacancy.update", input.companyId)) throw forbidden();
  return withUniqueRetry(() =>
    prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({ where: { id: input.companyId }, select: { id: true, slug: true } });
      if (!company) throw badRequest("The selected company does not exist.");
      await assertReferences(tx, company.id, input);
      if (input.slug && (await tx.vacancy.findUnique({ where: { slug: input.slug }, select: { id: true } }))) {
        throw conflict("Another vacancy already uses this web address (slug).");
      }
      const slug = input.slug ?? (await uniqueSlug(tx, slugify(`${input.title}-${company.slug}`)));
      const last = await tx.vacancy.findFirst({ where: { referenceCode: { startsWith: "SG-V-" } }, orderBy: { referenceCode: "desc" }, select: { referenceCode: true } });

      const vacancy = await tx.vacancy.create({
        data: {
          ...toData(input),
          companyId: company.id,
          title: input.title,
          locationText: input.locationText,
          slug,
          referenceCode: nextVacancyCode(last?.referenceCode ?? null),
          summary: input.summary,
          requiredEducation: input.requiredEducation,
          requiredExperience: input.requiredExperience,
          status: "DRAFT",
          ownerId: input.ownerId ?? user.id,
          createdById: user.id,
          updatedById: user.id,
        },
        include: vacancyInclude,
      });
      await recordAudit({ actorId: user.id, action: "vacancy.create", entityType: "Vacancy", entityId: vacancy.id, companyId: vacancy.companyId, metadata: { referenceCode: vacancy.referenceCode, title: vacancy.title }, ...meta }, tx);
      return vacancy;
    }),
  );
}

function publishable(v: VacancyRow) {
  return { ...v, salaryMin: num(v.salaryMin), salaryMax: num(v.salaryMax) };
}

export async function updateVacancy(user: SessionUser, id: string, input: VacancyUpdateInput, meta: Meta) {
  const { expectedUpdatedAt, ...changes } = input;
  return prisma.$transaction(async (tx) => {
    const before = await tx.vacancy.findUnique({ where: { id }, include: vacancyInclude });
    if (!before || !can(user.access, "vacancy.read", before.companyId)) throw notFound("Vacancy not found.");
    if (!can(user.access, "vacancy.update", before.companyId)) throw forbidden();
    if (expectedUpdatedAt && before.updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString()) {
      throw conflict("Someone else saved this vacancy while you were editing. Reload to see their changes.");
    }

    const companyId = changes.companyId ?? before.companyId;
    if (companyId !== before.companyId) {
      if (!can(user.access, "vacancy.update", companyId)) throw forbidden("You cannot move vacancies to that company.");
      if ((await tx.jobApplication.count({ where: { vacancyId: id } })) > 0) throw conflict("This vacancy already has applications, so it cannot move to another company.");
    }
    if (changes.slug && changes.slug !== before.slug) {
      if (before.status === "PUBLISHED") throw badRequest("Close the vacancy before changing its web address (slug).");
      if (await tx.vacancy.findFirst({ where: { slug: changes.slug, id: { not: id } }, select: { id: true } })) throw conflict("Another vacancy already uses this web address (slug).");
    }
    await assertReferences(tx, companyId, {
      ...changes,
      locationId: changes.locationId ?? (companyId !== before.companyId ? before.locationId : undefined),
      departmentId: changes.departmentId ?? (companyId !== before.companyId ? before.departmentId : undefined),
    });

    const data = toData(changes);
    await tx.contentRevision.create({ data: { entityType: "Vacancy", entityId: id, snapshot: JSON.parse(JSON.stringify(before)), createdById: user.id } });
    const vacancy = await tx.vacancy.update({ where: { id }, data: { ...data, updatedById: user.id }, include: vacancyInclude });

    if (vacancy.status === "PUBLISHED") {
      const problem = vacancyPublishProblem(publishable(vacancy));
      if (problem) throw badRequest(`${problem} (This vacancy is live.)`); // rolls the transaction back
    }
    await recordAudit({ actorId: user.id, action: "vacancy.update", entityType: "Vacancy", entityId: id, companyId: vacancy.companyId, metadata: { fields: Object.keys(changes) }, ...meta }, tx);
    return vacancy;
  });
}

export async function changeVacancyStatus(user: SessionUser, id: string, action: VacancyAction, meta: Meta) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.vacancy.findUnique({ where: { id }, include: vacancyInclude });
    if (!before || !can(user.access, "vacancy.read", before.companyId)) throw notFound("Vacancy not found.");
    if (!can(user.access, "vacancy.publish", before.companyId)) throw forbidden();
    const change = vacancyTransition(before.status, action);
    if (typeof change === "string") throw badRequest(change);
    if (change.status === "PUBLISHED") {
      const problem = vacancyPublishProblem(publishable(before));
      if (problem) throw badRequest(problem);
      if (before.company.status !== "PUBLISHED") throw badRequest("Publish the company first; its vacancies are hidden while it is not live.");
    }
    const vacancy = await tx.vacancy.update({ where: { id }, data: { ...change, updatedById: user.id }, include: vacancyInclude });
    await recordAudit({ actorId: user.id, action: `vacancy.${action}`, entityType: "Vacancy", entityId: id, companyId: vacancy.companyId, metadata: { before: before.status, after: vacancy.status }, ...meta }, tx);
    return vacancy;
  });
}

// Run by the cron job: published vacancies whose deadline day (Nepal time) or
// closeAt has passed become CLOSED.
export async function closeExpiredVacancies(now = new Date()) {
  const candidates = await prisma.vacancy.findMany({
    where: { status: "PUBLISHED", OR: [{ deadline: { lt: now } }, { closeAt: { lte: now } }] },
    select: { id: true, companyId: true, status: true, publishAt: true, closeAt: true, deadline: true },
  });
  const expired = candidates.filter((v) => !isAcceptingApplications(v, now) && (!v.publishAt || v.publishAt <= now));
  for (const v of expired) {
    await prisma.vacancy.update({ where: { id: v.id }, data: { status: "CLOSED", closedAt: now } });
    await recordAudit({ action: "vacancy.auto_close", entityType: "Vacancy", entityId: v.id, companyId: v.companyId });
  }
  return expired.length;
}
