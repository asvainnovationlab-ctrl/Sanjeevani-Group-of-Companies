import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";

type Db = PrismaClient | Prisma.TransactionClient;

export type AuditEntry = {
  actorId?: string | null;
  action: string; // e.g. "auth.login.success", "user.suspend", "vacancy.publish"
  entityType?: string;
  entityId?: string;
  companyId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
  userAgent?: string | null;
};

// Never put passwords, tokens or CV contents in metadata.
export async function recordAudit(entry: AuditEntry, db: Db = prisma) {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      companyId: entry.companyId ?? null,
      metadata: entry.metadata,
      ipHash: entry.ipHash ?? null,
      userAgent: entry.userAgent?.slice(0, 300) ?? null,
    },
  });
}
