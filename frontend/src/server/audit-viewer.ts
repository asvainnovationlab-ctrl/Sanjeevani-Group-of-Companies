import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { companyScope } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { toCsv } from "@/server/recruitment/rules";
import { formatKathmandu } from "@/server/time";

// Read-only view of the audit log. Group-wide auditors see everything;
// company-scoped ones see entries for their companies only.

export const auditQuery = z.object({
  action: z.string().trim().max(80).optional(), // prefix, e.g. "application." or "auth.login"
  actorId: z.string().uuid().optional(),
  entityType: z.string().trim().max(60).optional(),
  entityId: z.string().trim().max(100).optional(),
  companyId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

type Query = z.infer<typeof auditQuery>;

function where(user: SessionUser, q: Partial<Query>): Prisma.AuditLogWhereInput {
  const scope = companyScope(user.access, "audit.read");
  return {
    AND: [
      scope.all ? {} : { companyId: { in: scope.companyIds } },
      q.action ? { action: { startsWith: q.action } } : {},
      q.actorId ? { actorId: q.actorId } : {},
      q.entityType ? { entityType: q.entityType } : {},
      q.entityId ? { entityId: q.entityId } : {},
      q.companyId ? { companyId: q.companyId } : {},
      q.from ? { createdAt: { gte: new Date(q.from) } } : {},
      q.to ? { createdAt: { lte: new Date(q.to) } } : {},
    ],
  };
}

export async function listAudit(user: SessionUser, q: Query) {
  const filter = where(user, q);
  const [total, items] = await prisma.$transaction([
    prisma.auditLog.count({ where: filter }),
    prisma.auditLog.findMany({
      where: filter,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return { total, page: q.page, pageSize: q.pageSize, items };
}

export async function exportAuditCsv(user: SessionUser, q: Partial<Query>, meta: { ipHash: string; userAgent: string | null }) {
  const rows = await prisma.auditLog.findMany({ where: where(user, q), include: { actor: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 10000 });
  await recordAudit({ actorId: user.id, action: "audit.export", entityType: "AuditLog", metadata: { count: rows.length }, ...meta });
  return toCsv(
    ["Time (Nepal)", "Action", "Actor", "Entity", "Entity id", "Company id", "Details"],
    rows.map((r) => [formatKathmandu(r.createdAt, true), r.action, r.actor?.email ?? "system/public", r.entityType, r.entityId, r.companyId, r.metadata ? JSON.stringify(r.metadata) : ""]),
  );
}
