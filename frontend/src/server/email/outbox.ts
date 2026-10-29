import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import type { EmailTemplate } from "@/server/email/templates";

type Db = PrismaClient | Prisma.TransactionClient;

export type OutboxEmail = {
  idempotencyKey: string; // same key twice → one email
  template: EmailTemplate;
  to: string;
  subject: string;
  payload: Prisma.InputJsonValue;
};

// Emails are written to the outbox inside the same transaction as the change
// that triggers them, then delivered by email/sender.ts (Resend). Payloads
// with one-time links are cleared by the sender after delivery.
export async function enqueueEmail(email: OutboxEmail, db: Db = prisma): Promise<string> {
  await db.emailOutbox.upsert({
    where: { idempotencyKey: email.idempotencyKey },
    create: {
      idempotencyKey: email.idempotencyKey,
      template: email.template,
      toAddress: email.to,
      subject: email.subject,
      payload: email.payload,
    },
    update: {},
  });
  return email.idempotencyKey;
}

// Base URL for links in emails. Never derived from the Host header in
// production, which an attacker could spoof to steal reset tokens.
export function siteUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  return new URL(request.url).origin;
}
