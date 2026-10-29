import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can, canAny, companyScope } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { deleteProblem, editProblem, workflowTransition, type PublishStatus, type WorkflowAction } from "@/server/content/workflow";
import { toPublic, type ContentType } from "@/server/content/types";
import { slugify } from "../../../prisma/seed-helpers";

// One implementation of list / get / create / update / workflow / delete for
// every type in the content registry.

type Meta = { ipHash: string; userAgent: string | null };
type Row = Record<string, unknown> & { id: string; status: PublishStatus; updatedAt: Date; publishedAt?: Date | null };
type Args = Record<string, unknown>;

// The minimal Prisma delegate surface the engine uses.
type Delegate = {
  findMany(args: Args): Promise<Row[]>;
  findUnique(args: Args): Promise<Row | null>;
  findFirst(args: Args): Promise<Row | null>;
  create(args: Args): Promise<Row>;
  update(args: Args): Promise<Row>;
  delete(args: Args): Promise<Row>;
};

const delegate = (db: Prisma.TransactionClient, type: ContentType) => db[type.model] as unknown as Delegate;

// ------------------------------------------------------------------ public

export async function listPublished(type: ContentType, filter: { company?: string; placement?: string } = {}) {
  const now = new Date();
  const rows = await delegate(prisma, type).findMany({
    where: {
      status: "PUBLISHED",
      ...(type.publicWhere?.(now) ?? {}),
      ...(filter.company && type.scope === "company" ? { company: { slug: filter.company } } : {}),
      ...(filter.placement && type.model === "video" ? { placement: filter.placement } : {}),
    },
    ...(type.include ? { include: type.include } : {}),
    orderBy: type.orderBy,
    take: 200,
  });
  return rows.map(toPublic);
}

export async function getPublished(type: ContentType, key: string) {
  if (!type.publicKey) return null;
  const now = new Date();
  const row = await delegate(prisma, type).findFirst({
    where: { [type.publicKey]: key, status: "PUBLISHED", ...(type.publicWhere?.(now) ?? {}) },
    ...(type.include ? { include: type.include } : {}),
  });
  return row ? toPublic(row) : null;
}

// ------------------------------------------------------------------- admin

function assertOwners(user: SessionUser, permission: Parameters<typeof can>[1], owners: (string | null)[]) {
  if (!owners.every((companyId) => can(user.access, permission, companyId))) throw forbidden();
}

// Rows the user may see: group-level rows need a group-wide grant;
// company rows need a grant for that company.
function adminWhere(user: SessionUser, type: ContentType): Args {
  const scope = companyScope(user.access, type.update);
  if (scope.all) return {};
  if (type.scope === "leader") {
    return { isChairman: false, assignments: { some: {}, every: { companyId: { in: scope.companyIds } } } };
  }
  if (type.scope === "group") return { id: { in: [] } };
  return { companyId: { in: scope.companyIds } };
}

export async function listForAdmin(user: SessionUser, type: ContentType, query: { status?: PublishStatus; q?: string }) {
  if (!canAny(user.access, type.update)) throw forbidden();
  return delegate(prisma, type).findMany({
    where: { AND: [adminWhere(user, type), query.status ? { status: query.status } : {}] },
    ...(type.include ? { include: type.include } : {}),
    orderBy: type.orderBy,
    take: 500,
  });
}

async function loadForUser(db: Prisma.TransactionClient, user: SessionUser, type: ContentType, id: string) {
  const row = await delegate(db, type).findUnique({ where: { id }, ...(type.include ? { include: type.include } : {}) });
  if (!row) throw notFound(`${type.label} not found.`);
  if (!type.owners(row).every((companyId) => can(user.access, type.update, companyId))) throw notFound(`${type.label} not found.`);
  return row;
}

export async function getForAdmin(user: SessionUser, type: ContentType, id: string) {
  return loadForUser(prisma, user, type, id);
}

async function assertMedia(db: Prisma.TransactionClient, idsToCheck: string[]) {
  const unique = [...new Set(idsToCheck)];
  if (unique.length === 0) return;
  const found = await db.mediaAsset.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw badRequest("One of the selected images no longer exists.");
}

async function uniqueSlug(db: Prisma.TransactionClient, type: ContentType, base: string, exceptId?: string) {
  const root = base.slice(0, 90) || "item";
  for (let n = 1; n < 100; n += 1) {
    const slug = n === 1 ? root : `${root}-${n}`;
    if (!(await delegate(db, type).findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } }))) return slug;
  }
  throw conflict("Choose a different web address (slug).");
}

function stamps(type: ContentType, userId: string, mode: "create" | "update") {
  if (type.stamps === "none") return {};
  return mode === "create" ? { createdById: userId, updatedById: userId } : { updatedById: userId };
}

function uniqueViolation(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw conflict("Another item already uses this web address (slug) or key.");
  }
  throw error;
}

export async function createContent(user: SessionUser, type: ContentType, input: Args, meta: Meta) {
  assertOwners(user, type.update, type.owners(input));
  return prisma
    .$transaction(async (tx) => {
      await assertMedia(tx, type.mediaIds(input));
      const data = type.toData(input, "create");
      if (type.slugFrom && !data.slug) data.slug = await uniqueSlug(tx, type, slugify(String(input[type.slugFrom] ?? "")));
      if (type.model === "newsArticle") data.authorId = user.id;
      const row = await delegate(tx, type).create({ data: { ...data, ...stamps(type, user.id, "create"), status: "DRAFT" }, ...(type.include ? { include: type.include } : {}) });
      await recordAudit({ actorId: user.id, action: `${type.model}.create`, entityType: type.model, entityId: row.id, companyId: type.owners(row)[0], ...meta }, tx);
      return row;
    })
    .catch(uniqueViolation);
}

export async function updateContent(user: SessionUser, type: ContentType, id: string, input: Args, meta: Meta) {
  const { expectedUpdatedAt, ...changes } = input;
  return prisma
    .$transaction(async (tx) => {
      const before = await loadForUser(tx, user, type, id);
      const owners = [...type.owners(before), ...(changes.companyId !== undefined || changes.assignments !== undefined ? type.owners({ ...before, ...changes }) : [])];
      assertOwners(user, type.update, owners);
      const canPublish = owners.every((companyId) => can(user.access, type.publish, companyId));
      const problem = editProblem(before.status, canPublish);
      if (problem) throw badRequest(problem);
      if (typeof expectedUpdatedAt === "string" && before.updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString()) {
        throw conflict("Someone else saved this item while you were editing. Reload to see their changes.");
      }
      await assertMedia(tx, type.mediaIds(changes));

      await tx.contentRevision.create({ data: { entityType: type.model, entityId: id, snapshot: JSON.parse(JSON.stringify(before)), createdById: user.id } });
      const row = await delegate(tx, type).update({
        where: { id },
        data: { ...type.toData(changes, "update"), ...stamps(type, user.id, "update") },
        ...(type.include ? { include: type.include } : {}),
      });
      await recordAudit({ actorId: user.id, action: `${type.model}.update`, entityType: type.model, entityId: id, companyId: type.owners(row)[0], metadata: { fields: Object.keys(changes) }, ...meta }, tx);
      return row;
    })
    .catch(uniqueViolation);
}

export async function runWorkflow(user: SessionUser, type: ContentType, id: string, action: WorkflowAction, meta: Meta) {
  return prisma.$transaction(async (tx) => {
    const before = await loadForUser(tx, user, type, id);
    if (action !== "submit") assertOwners(user, type.publish, type.owners(before));
    const change = workflowTransition(before.status, action);
    if (typeof change === "string") throw badRequest(change);
    const { approve, ...data } = change;
    const row = await delegate(tx, type).update({
      where: { id },
      data: { ...data, ...(approve && type.stamps === "approve" ? { approvedById: user.id } : {}), ...stamps(type, user.id, "update") },
      ...(type.include ? { include: type.include } : {}),
    });
    await recordAudit({ actorId: user.id, action: `${type.model}.${action}`, entityType: type.model, entityId: id, companyId: type.owners(row)[0], metadata: { before: before.status, after: row.status }, ...meta }, tx);
    return row;
  });
}

export async function deleteContent(user: SessionUser, type: ContentType, id: string, meta: Meta) {
  await prisma.$transaction(async (tx) => {
    const before = await loadForUser(tx, user, type, id);
    assertOwners(user, type.publish, type.owners(before));
    const problem = deleteProblem(before.status, Boolean(before.publishedAt));
    if (problem) throw badRequest(problem);
    await delegate(tx, type).delete({ where: { id } });
    await recordAudit({ actorId: user.id, action: `${type.model}.delete`, entityType: type.model, entityId: id, companyId: type.owners(before)[0], ...meta }, tx);
  });
}

export async function listRevisions(user: SessionUser, type: ContentType, id: string) {
  await loadForUser(prisma, user, type, id);
  return prisma.contentRevision.findMany({ where: { entityType: type.model, entityId: id }, orderBy: { createdAt: "desc" }, take: 20 });
}
