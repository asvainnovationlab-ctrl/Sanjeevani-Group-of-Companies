import { z } from "zod";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { slugSchema } from "@/server/validation/company";
import { slugify } from "../../../prisma/seed-helpers";

// Business categories (sectors) that group the companies on /businesses.
// Managing them is a group-level action (company.create).

type Meta = { ipHash: string; userAgent: string | null };

export const sectorSchema = z.object({
  name: z.string().trim().min(2, "Enter the category name.").max(80),
  slug: slugSchema.optional(),
  detail: z.string().trim().max(400).nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
}).strict();
export const sectorUpdateSchema = sectorSchema.partial().strict();

const select = { id: true, slug: true, name: true, detail: true, sortOrder: true, image: { select: { id: true, url: true } }, _count: { select: { companies: true } } } as const;

const assertGroup = (user: SessionUser) => {
  if (!can(user.access, "company.create")) throw forbidden();
};

export function listSectors() {
  return prisma.sector.findMany({ select, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function createSector(user: SessionUser, input: z.infer<typeof sectorSchema>, meta: Meta) {
  assertGroup(user);
  const slug = input.slug ?? slugify(input.name);
  if (await prisma.sector.findUnique({ where: { slug }, select: { id: true } })) throw conflict("A category with this web address already exists.");
  const sector = await prisma.sector.create({ data: { ...input, slug }, select });
  await recordAudit({ actorId: user.id, action: "sector.create", entityType: "Sector", entityId: sector.id, metadata: { name: sector.name }, ...meta });
  return sector;
}

export async function updateSector(user: SessionUser, id: string, input: z.infer<typeof sectorUpdateSchema>, meta: Meta) {
  assertGroup(user);
  if (!(await prisma.sector.findUnique({ where: { id }, select: { id: true } }))) throw notFound("Category not found.");
  if (input.slug && (await prisma.sector.findFirst({ where: { slug: input.slug, id: { not: id } }, select: { id: true } }))) throw conflict("A category with this web address already exists.");
  const sector = await prisma.sector.update({ where: { id }, data: input, select });
  await recordAudit({ actorId: user.id, action: "sector.update", entityType: "Sector", entityId: id, metadata: { fields: Object.keys(input) }, ...meta });
  return sector;
}

// A category that still holds companies cannot be deleted.
export async function deleteSector(user: SessionUser, id: string, meta: Meta) {
  assertGroup(user);
  const sector = await prisma.sector.findUnique({ where: { id }, select: { name: true, _count: { select: { companies: true } } } });
  if (!sector) throw notFound("Category not found.");
  if (sector._count.companies > 0) throw badRequest(`Move the ${sector._count.companies} companies in "${sector.name}" to another category first.`);
  await prisma.sector.delete({ where: { id } });
  await recordAudit({ actorId: user.id, action: "sector.delete", entityType: "Sector", entityId: id, metadata: { name: sector.name }, ...meta });
}
