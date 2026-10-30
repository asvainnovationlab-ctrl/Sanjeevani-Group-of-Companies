import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { can, companyWhere } from "@/server/auth/access";
import type { SessionUser } from "@/server/auth/session";
import { enqueueEmail } from "@/server/email/outbox";
import { deliverSoon } from "@/server/email/sender";
import { badRequest, notFound } from "@/server/http/errors";
import { toCsv } from "@/server/recruitment/rules";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { formatKathmandu } from "@/server/time";

// Website enquiries: stored, HR notified by email (without the message text),
// handled in the admin inbox. No confirmation is emailed to the sender, so
// the form cannot be used to send mail to arbitrary addresses.

type Meta = { ipHash: string; userAgent: string | null };
const HOUR = 60 * 60 * 1000;

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(40).regex(/^$|^[+\d][\d\s\-()]{5,39}$/, "Enter a valid phone number.").optional().transform((v) => v || null),
  subject: z.string().trim().max(160).optional().transform((v) => v || null),
  message: z.string().trim().min(10, "Write a message of at least 10 characters.").max(4000),
  companySlug: z.string().trim().max(100).optional(),
  website: z.string().optional(), // honeypot
});

export const contactUpdateSchema = z
  .object({
    status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]).optional(),
    assignedToId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.assignedToId !== undefined, "Nothing to update.");

export const contactListQuery = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]).optional(),
  companyId: z.string().uuid().optional(), // narrows within the user's own scope, never widens it
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function submitContact(input: z.infer<typeof contactFormSchema>, meta: Meta, baseUrl: string) {
  if (input.website?.trim()) return; // bots fill the hidden field; pretend success
  await enforceRateLimit(`contact:ip:${meta.ipHash}`, 5, HOUR, "Too many messages from this connection. Please try again later.");

  const company = input.companySlug ? await prisma.company.findFirst({ where: { slug: input.companySlug, status: "PUBLISHED" }, select: { id: true, name: true } }) : null;
  const keys = await prisma.$transaction(async (tx) => {
    const message = await tx.contactMessage.create({
      data: { name: input.name, email: input.email, phone: input.phone, subject: input.subject, message: input.message, companyId: company?.id ?? null, ipHash: meta.ipHash },
    });
    const to = (process.env.CONTACT_NOTIFICATION_EMAIL || process.env.HR_NOTIFICATION_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
    const queued: string[] = [];
    for (const address of to) {
      queued.push(await enqueueEmail({
        idempotencyKey: `contact-new:${message.id}:${address}`,
        template: "contact-new",
        to: address,
        subject: `New website enquiry${input.subject ? `: ${input.subject.slice(0, 80)}` : ""}`,
        payload: { name: input.name, subject: input.subject ?? "", companyName: company?.name ?? "Sanjeevani Group", submittedAt: formatKathmandu(message.createdAt, true), link: `${baseUrl}/admin?contact=${message.id}` },
      }, tx));
    }
    await recordAudit({ action: "contact.submit", entityType: "ContactMessage", entityId: message.id, companyId: message.companyId, ...meta }, tx);
    return queued;
  });
  await deliverSoon(keys);
}

function where(user: SessionUser, query: { status?: string; q?: string; companyId?: string }): Prisma.ContactMessageWhereInput {
  return {
    AND: [
      companyWhere(user.access, "contact.read"),
      query.status ? { status: query.status as Prisma.EnumContactMessageStatusFilter["equals"] } : {},
      query.companyId ? { companyId: query.companyId } : {},
      query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { email: { contains: query.q, mode: "insensitive" } }, { subject: { contains: query.q, mode: "insensitive" } }] } : {},
    ],
  };
}

const listSelect = {
  id: true, name: true, email: true, phone: true, subject: true, status: true, createdAt: true, handledAt: true,
  company: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.ContactMessageSelect;

export async function listContactMessages(user: SessionUser, query: z.infer<typeof contactListQuery>) {
  const filter = where(user, query);
  const [total, items] = await prisma.$transaction([
    prisma.contactMessage.count({ where: filter }),
    prisma.contactMessage.findMany({ where: filter, select: listSelect, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items };
}

async function load(user: SessionUser, id: string, permission: "contact.read" | "contact.update") {
  const row = await prisma.contactMessage.findUnique({ where: { id }, include: { company: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } } });
  if (!row || !can(user.access, "contact.read", row.companyId) || !can(user.access, permission, row.companyId)) throw notFound("Message not found.");
  return row;
}

export async function getContactMessage(user: SessionUser, id: string, meta: Meta) {
  const row = await load(user, id, "contact.read");
  await recordAudit({ actorId: user.id, action: "contact.view", entityType: "ContactMessage", entityId: id, companyId: row.companyId, ...meta });
  return row;
}

export async function updateContactMessage(user: SessionUser, id: string, input: z.infer<typeof contactUpdateSchema>, meta: Meta) {
  const before = await load(user, id, "contact.update");
  if (input.assignedToId) {
    const assignee = await prisma.user.findFirst({ where: { id: input.assignedToId, status: "ACTIVE" }, select: { id: true } });
    if (!assignee) throw badRequest("The selected person is not an active admin user.");
  }
  const done = input.status === "RESOLVED" || input.status === "SPAM";
  const row = await prisma.contactMessage.update({
    where: { id },
    data: { ...input, ...(input.status ? { handledAt: done ? new Date() : null } : {}) },
    include: { company: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
  });
  await recordAudit({ actorId: user.id, action: "contact.update", entityType: "ContactMessage", entityId: id, companyId: row.companyId, metadata: { before: { status: before.status, assignedToId: before.assignedTo?.id ?? null }, after: input }, ...meta });
  return row;
}

export async function exportContactCsv(user: SessionUser, query: { status?: string; q?: string; companyId?: string }, meta: Meta) {
  const rows = await prisma.contactMessage.findMany({ where: where(user, query), include: { company: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5000 });
  await recordAudit({ actorId: user.id, action: "contact.export", entityType: "ContactMessage", metadata: { count: rows.length, filters: query }, ...meta });
  return toCsv(
    ["Received (Nepal time)", "Status", "Name", "Email", "Phone", "Subject", "Company", "Message"],
    rows.map((r) => [formatKathmandu(r.createdAt, true), r.status, r.name, r.email, r.phone, r.subject, r.company?.name ?? "Group", r.message]),
  );
}
