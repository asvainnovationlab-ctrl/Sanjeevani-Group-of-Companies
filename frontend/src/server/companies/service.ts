import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { companyScope, can } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { slugify } from "../../../prisma/seed-helpers";
import { changedFields, normalizeLocations, publishProblem, slugChangeProblem, statusTransition, type StatusAction } from "@/server/companies/rules";
import type { z } from "zod";
import type { CompanyCreateInput, CompanyUpdateInput, locationsSchema } from "@/server/validation/company";

type Meta = { ipHash: string; userAgent: string | null };
type LocationInput = z.infer<typeof locationsSchema>["locations"][number];

const image = { select: { id: true, url: true, altText: true, width: true, height: true } } as const;

const companyInclude = {
  sector: { select: { id: true, slug: true, name: true } },
  logo: image,
  banner: image,
  locations: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
} satisfies Prisma.CompanyInclude;

type CompanyRow = Prisma.CompanyGetPayload<{ include: typeof companyInclude }>;

// ------------------------------------------------------------------ public

// The shape the website pages use. Only published companies are visible.
export function toPublicCompany(row: CompanyRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    sector: row.sector,
    sectorLabel: row.sectorLabel,
    description: row.description,
    website: row.website,
    email: row.email,
    phone: row.phone,
    establishedYear: row.establishedYear,
    logo: row.logo,
    banner: row.banner,
    featured: row.featured,
    locations: row.locations.map((l) => ({
      name: l.name,
      addressLine: l.addressLine,
      municipality: l.municipality,
      district: l.district,
      province: l.province,
      country: l.country,
      latitude: l.latitude === null ? null : Number(l.latitude),
      longitude: l.longitude === null ? null : Number(l.longitude),
      phone: l.phone,
      email: l.email,
      isPrimary: l.isPrimary,
    })),
  };
}

export async function listPublicCompanies(filter: { sector?: string } = {}) {
  const rows = await prisma.company.findMany({
    where: { status: "PUBLISHED", ...(filter.sector ? { sector: { slug: filter.sector } } : {}) },
    include: companyInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toPublicCompany);
}

export async function getPublicCompany(slug: string) {
  const row = await prisma.company.findFirst({ where: { slug, status: "PUBLISHED" }, include: companyInclude });
  return row ? toPublicCompany(row) : null;
}

// ------------------------------------------------------------------- admin

function scopeWhere(user: SessionUser): Prisma.CompanyWhereInput {
  const scope = companyScope(user.access, "company.read");
  return scope.all ? {} : { id: { in: scope.companyIds } };
}

export async function listAdminCompanies(user: SessionUser, query: { q?: string; status?: CompanyRow["status"] }) {
  const companies = await prisma.company.findMany({
    where: {
      ...scopeWhere(user),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {}),
    },
    include: companyInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const sectors = await prisma.sector.findMany({ select: { id: true, slug: true, name: true }, orderBy: { sortOrder: "asc" } });
  return { companies, sectors };
}

export async function getAdminCompany(user: SessionUser, id: string) {
  if (!can(user.access, "company.read", id)) throw notFound("Company not found."); // don't reveal other companies exist
  const company = await prisma.company.findUnique({ where: { id }, include: companyInclude });
  if (!company) throw notFound("Company not found.");
  return company;
}

async function assertReferences(db: Prisma.TransactionClient, input: { sectorId?: string | null; logoId?: string | null; bannerId?: string | null }) {
  if (input.sectorId && !(await db.sector.findUnique({ where: { id: input.sectorId }, select: { id: true } }))) {
    throw badRequest("The selected sector does not exist.");
  }
  for (const [field, id] of [["logo", input.logoId], ["banner", input.bannerId]] as const) {
    if (!id) continue;
    const media = await db.mediaAsset.findUnique({ where: { id }, select: { kind: true } });
    if (!media || media.kind !== "IMAGE") throw badRequest(`The selected ${field} image does not exist.`);
  }
}

async function assertUnique(db: Prisma.TransactionClient, values: { name?: string; slug?: string }, exceptId?: string) {
  const clash = await db.company.findFirst({
    where: {
      OR: [
        ...(values.name ? [{ name: { equals: values.name, mode: "insensitive" as const } }] : []),
        ...(values.slug ? [{ slug: values.slug }] : []),
      ],
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { name: true, slug: true },
  });
  if (!clash) return;
  throw conflict(clash.slug === values.slug ? "Another company already uses this web address (slug)." : "Another company already has this name.");
}

function snapshot(row: CompanyRow): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

export async function createCompany(user: SessionUser, input: CompanyCreateInput, meta: Meta) {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) throw badRequest("Enter a web address (slug) for this company.");

  return prisma.$transaction(async (tx) => {
    await assertUnique(tx, { name: input.name, slug });
    await assertReferences(tx, input);
    const group = await tx.group.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!group) throw badRequest("The group record is missing. Run the database seed.");

    const company = await tx.company.create({
      data: {
        groupId: group.id,
        name: input.name,
        slug,
        category: input.category,
        sectorId: input.sectorId ?? null,
        sectorLabel: input.sectorLabel,
        description: input.description,
        website: input.website ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        establishedYear: input.establishedYear ?? null,
        logoId: input.logoId ?? null,
        bannerId: input.bannerId ?? null,
        featured: input.featured ?? false,
        sortOrder: input.sortOrder ?? 0,
        status: "DRAFT",
        createdById: user.id,
        updatedById: user.id,
      },
      include: companyInclude,
    });
    await recordAudit({ actorId: user.id, action: "company.create", entityType: "Company", entityId: company.id, companyId: company.id, metadata: { name: company.name, slug }, ...meta }, tx);
    return company;
  });
}

export async function updateCompany(user: SessionUser, id: string, input: CompanyUpdateInput, meta: Meta) {
  if (!can(user.access, "company.update", id)) throw forbidden();
  const { expectedUpdatedAt, ...changes } = input;

  return prisma.$transaction(async (tx) => {
    const before = await tx.company.findUnique({ where: { id }, include: companyInclude });
    if (!before) throw notFound("Company not found.");
    if (expectedUpdatedAt && before.updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString()) {
      throw conflict("Someone else saved this company while you were editing. Reload to see their changes.");
    }
    const slugProblem = slugChangeProblem(before.status, before.slug, changes.slug);
    if (slugProblem) throw badRequest(slugProblem);
    if (before.status === "PUBLISHED") {
      const problem = publishProblem({ ...before, ...strip(changes) });
      if (problem) throw badRequest(problem.replace("before publishing", "for a published company"));
    }
    await assertUnique(tx, { name: changes.name, slug: changes.slug }, id);
    await assertReferences(tx, changes);

    const fields = changedFields(before as unknown as Record<string, unknown>, changes as Record<string, unknown>);
    if (fields.length === 0) return before;

    await tx.contentRevision.create({ data: { entityType: "Company", entityId: id, snapshot: snapshot(before), createdById: user.id } });
    const company = await tx.company.update({ where: { id }, data: { ...changes, updatedById: user.id }, include: companyInclude });
    await recordAudit({ actorId: user.id, action: "company.update", entityType: "Company", entityId: id, companyId: id, metadata: { fields }, ...meta }, tx);
    return company;
  });
}

// Drops undefined keys so a partial update can be merged over the stored row.
function strip<T extends Record<string, unknown>>(value: T): Partial<{ [K in keyof T]: Exclude<T[K], undefined> }> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<{ [K in keyof T]: Exclude<T[K], undefined> }>;
}

export async function changeCompanyStatus(user: SessionUser, id: string, action: StatusAction, meta: Meta) {
  if (!can(user.access, "company.publish", id)) throw forbidden();
  return prisma.$transaction(async (tx) => {
    const before = await tx.company.findUnique({ where: { id }, include: companyInclude });
    if (!before) throw notFound("Company not found.");
    const change = statusTransition(before.status, action);
    if (typeof change === "string") throw badRequest(change);
    if (change.status === "PUBLISHED") {
      const problem = publishProblem(before);
      if (problem) throw badRequest(problem);
    }
    const company = await tx.company.update({ where: { id }, data: { ...change, updatedById: user.id }, include: companyInclude });
    await recordAudit(
      { actorId: user.id, action: `company.${action}`, entityType: "Company", entityId: id, companyId: id, metadata: { before: before.status, after: company.status }, ...meta },
      tx,
    );
    return company;
  });
}

export async function replaceLocations(user: SessionUser, id: string, locations: LocationInput[], meta: Meta) {
  if (!can(user.access, "company.update", id)) throw forbidden();
  return prisma.$transaction(async (tx) => {
    const before = await tx.company.findUnique({ where: { id }, include: companyInclude });
    if (!before) throw notFound("Company not found.");
    // Vacancies point at locations; keep the ones still listed (matched by name).
    const used = await tx.location.findMany({ where: { companyId: id, vacancies: { some: {} } }, select: { id: true, name: true } });
    const keptNames = new Set(locations.map((l) => l.name.toLowerCase()));
    const removedInUse = used.filter((l) => !keptNames.has(l.name.toLowerCase()));
    if (removedInUse.length) throw conflict(`"${removedInUse[0].name}" is used by vacancies. Move those vacancies first.`);

    await tx.contentRevision.create({ data: { entityType: "Company", entityId: id, snapshot: snapshot(before), createdById: user.id } });
    const normalized = normalizeLocations(locations);
    const existing = new Map(before.locations.map((l) => [l.name.toLowerCase(), l.id]));
    const keepIds: string[] = [];
    for (const location of normalized) {
      const existingId = existing.get(location.name.toLowerCase());
      if (existingId) {
        await tx.location.update({ where: { id: existingId }, data: location });
        keepIds.push(existingId);
      } else {
        const created = await tx.location.create({ data: { ...location, companyId: id } });
        keepIds.push(created.id);
      }
    }
    await tx.location.deleteMany({ where: { companyId: id, id: { notIn: keepIds } } });
    await tx.company.update({ where: { id }, data: { updatedById: user.id } });
    await recordAudit({ actorId: user.id, action: "company.locations.set", entityType: "Company", entityId: id, companyId: id, metadata: { count: normalized.length }, ...meta }, tx);
    return tx.company.findUniqueOrThrow({ where: { id }, include: companyInclude });
  });
}

export async function listCompanyRevisions(user: SessionUser, id: string) {
  if (!can(user.access, "company.read", id)) throw notFound("Company not found.");
  return prisma.contentRevision.findMany({
    where: { entityType: "Company", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, createdById: true, snapshot: true },
  });
}

// Deletes a company that is not live and has no vacancies or applications
// (those keep their history). Its locations, roles and memberships go with it.
export async function deleteCompany(user: SessionUser, id: string, meta: Meta) {
  if (!can(user.access, "company.create")) throw forbidden();
  const company = await prisma.company.findUnique({ where: { id }, select: { name: true, status: true, _count: { select: { vacancies: true, applications: true } } } });
  if (!company) throw notFound("Company not found.");
  if (company.status === "PUBLISHED") throw badRequest("Unpublish or archive the company before deleting it.");
  if (company._count.vacancies > 0 || company._count.applications > 0) {
    throw badRequest(`${company.name} still has ${company._count.vacancies} vacancies and ${company._count.applications} applications. Archive it instead, or delete those first.`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.company.delete({ where: { id } });
    await recordAudit({ actorId: user.id, action: "company.delete", entityType: "Company", entityId: id, metadata: { name: company.name }, ...meta }, tx);
  });
}
