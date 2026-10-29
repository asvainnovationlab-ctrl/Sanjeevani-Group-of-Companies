import { z } from "zod";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { badRequest, conflict, forbidden, notFound } from "@/server/http/errors";
import { workflowTransition, type WorkflowAction } from "@/server/content/workflow";

// Privacy Policy and Terms of Use are versioned: editors draft a new version,
// a publisher publishes it, and the previous live version is archived in the
// same transaction. Old versions are kept as the record of what applied when.

type Meta = { ipHash: string; userAgent: string | null };

export const LEGAL_KINDS = { "privacy-policy": "PRIVACY_POLICY", "terms-of-use": "TERMS_OF_USE" } as const;
export type LegalSlug = keyof typeof LEGAL_KINDS;
export const legalKind = (slug: string) => (slug in LEGAL_KINDS ? LEGAL_KINDS[slug as LegalSlug] : null);

const clause = z.object({ title: z.string().trim().min(2).max(200), body: z.array(z.string().trim().min(1).max(5000)).min(1).max(30) });
export const legalVersionSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    intro: z.string().trim().max(1000),
    lead: z.string().trim().max(2000),
    clauses: z.array(clause).min(1).max(60),
  })
  .strict();
export const legalVersionUpdateSchema = legalVersionSchema.partial().strict();
export const legalWorkflowSchema = z.object({ action: z.enum(["submit", "approve", "reject", "publish", "archive"]) });

const assertGroupRight = (user: SessionUser, permission: "legal.update" | "legal.publish") => {
  if (!can(user.access, permission, null)) throw forbidden();
};

export async function getPublishedLegal(kind: "PRIVACY_POLICY" | "TERMS_OF_USE") {
  return prisma.legalDocumentVersion.findFirst({
    where: { status: "PUBLISHED", document: { kind } },
    select: { version: true, title: true, intro: true, lead: true, clauses: true, publishedAt: true },
  });
}

export async function listLegalVersions(user: SessionUser, kind: "PRIVACY_POLICY" | "TERMS_OF_USE") {
  assertGroupRight(user, "legal.update");
  return prisma.legalDocumentVersion.findMany({ where: { document: { kind } }, orderBy: { version: "desc" } });
}

// Starts a new draft, copying the latest version unless content is given.
export async function createLegalDraft(user: SessionUser, kind: "PRIVACY_POLICY" | "TERMS_OF_USE", input: z.infer<typeof legalVersionSchema> | null, meta: Meta) {
  assertGroupRight(user, "legal.update");
  return prisma.$transaction(async (tx) => {
    const document = await tx.legalDocument.upsert({ where: { kind }, create: { kind }, update: {} });
    const open = await tx.legalDocumentVersion.findFirst({ where: { documentId: document.id, status: { in: ["DRAFT", "PENDING_REVIEW", "APPROVED"] } }, select: { version: true } });
    if (open) throw conflict(`Version ${open.version} is still being worked on. Publish or archive it first.`);
    const latest = await tx.legalDocumentVersion.findFirst({ where: { documentId: document.id }, orderBy: { version: "desc" } });
    const content = input ?? (latest ? { title: latest.title, intro: latest.intro, lead: latest.lead, clauses: latest.clauses } : null);
    if (!content) throw badRequest("There is no earlier version to copy. Provide the content for the first version.");
    const version = await tx.legalDocumentVersion.create({
      data: { documentId: document.id, version: (latest?.version ?? 0) + 1, ...content, clauses: content.clauses as object, status: "DRAFT", createdById: user.id },
    });
    await recordAudit({ actorId: user.id, action: "legal.draft", entityType: "LegalDocumentVersion", entityId: version.id, metadata: { kind, version: version.version }, ...meta }, tx);
    return version;
  });
}

export async function updateLegalDraft(user: SessionUser, versionId: string, input: z.infer<typeof legalVersionUpdateSchema>, meta: Meta) {
  assertGroupRight(user, "legal.update");
  const before = await prisma.legalDocumentVersion.findUnique({ where: { id: versionId } });
  if (!before) throw notFound("Version not found.");
  if (before.status !== "DRAFT") throw badRequest("Only a draft can be edited. Reject it back to draft first.");
  const version = await prisma.legalDocumentVersion.update({ where: { id: versionId }, data: { ...input, ...(input.clauses ? { clauses: input.clauses as object } : {}) } });
  await recordAudit({ actorId: user.id, action: "legal.update", entityType: "LegalDocumentVersion", entityId: versionId, metadata: { fields: Object.keys(input) }, ...meta });
  return version;
}

export async function legalWorkflow(user: SessionUser, versionId: string, action: Extract<WorkflowAction, "submit" | "approve" | "reject" | "publish" | "archive">, meta: Meta) {
  assertGroupRight(user, action === "submit" ? "legal.update" : "legal.publish");
  return prisma.$transaction(async (tx) => {
    const before = await tx.legalDocumentVersion.findUnique({ where: { id: versionId } });
    if (!before) throw notFound("Version not found.");
    if (action === "archive" && before.status === "PUBLISHED") throw badRequest("Publish a newer version instead; the site must always have a live version.");
    const change = workflowTransition(before.status, action);
    if (typeof change === "string") throw badRequest(change);
    if (change.status === "PUBLISHED") {
      await tx.legalDocumentVersion.updateMany({ where: { documentId: before.documentId, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
    }
    const { approve, ...data } = change;
    const version = await tx.legalDocumentVersion.update({ where: { id: versionId }, data: { ...data, ...(approve ? { approvedById: user.id } : {}) } });
    await recordAudit({ actorId: user.id, action: `legal.${action}`, entityType: "LegalDocumentVersion", entityId: versionId, metadata: { version: version.version, before: before.status, after: version.status }, ...meta }, tx);
    return version;
  });
}
