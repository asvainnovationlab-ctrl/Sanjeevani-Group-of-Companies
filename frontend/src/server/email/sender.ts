import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { renderEmail, type EmailTemplate } from "@/server/email/templates";

// Delivers EmailOutbox rows through Resend. Safe to run from several places
// at once (each row is claimed atomically) and safe to retry (Resend's
// Idempotency-Key stops duplicates). Called right after a request queues an
// email, and by the cron endpoint for retries.

const MAX_ATTEMPTS = 6;
const STALE_SENDING_MS = 10 * 60 * 1000;

export function retryDelayMs(attempts: number): number {
  return Math.min(60 * 60 * 1000, 60 * 1000 * 2 ** Math.max(0, attempts - 1)); // 1, 2, 4 … 60 minutes
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

// One-time links are removed once delivered, so the outbox never holds a
// usable token longer than needed.
function redact(payload: Prisma.JsonValue): Prisma.InputJsonValue {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "link" in payload) {
    const { link: _link, ...rest } = payload as Record<string, Prisma.JsonValue>;
    return { ...rest, link: "[sent]" } as Prisma.InputJsonValue;
  }
  return (payload ?? {}) as Prisma.InputJsonValue;
}

async function sendOne(id: string): Promise<"sent" | "failed" | "skipped"> {
  const now = new Date();
  // Claim the row; a second worker gets count 0 and skips it.
  const claimed = await prisma.emailOutbox.updateMany({
    where: {
      id,
      OR: [
        { status: "PENDING", nextAttemptAt: { lte: now } },
        { status: "SENDING", updatedAt: { lt: new Date(now.getTime() - STALE_SENDING_MS) } },
      ],
    },
    data: { status: "SENDING", attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return "skipped";
  const row = await prisma.emailOutbox.findUniqueOrThrow({ where: { id } });

  try {
    const { html, text } = renderEmail(row.template as EmailTemplate, (row.payload ?? {}) as Record<string, unknown>);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": row.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [row.toAddress], subject: row.subject, html, text }),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) throw new Error(`Resend ${response.status}: ${body.message ?? "error"}`);
    await prisma.emailOutbox.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), providerMessageId: body.id ?? null, lastError: null, payload: redact(row.payload) },
    });
    return "sent";
  } catch (error) {
    const attempts = row.attempts;
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
    await prisma.emailOutbox.update({
      where: { id },
      data:
        attempts >= MAX_ATTEMPTS
          ? { status: "FAILED", lastError: message, payload: redact(row.payload) }
          : { status: "PENDING", lastError: message, nextAttemptAt: new Date(Date.now() + retryDelayMs(attempts)) },
    });
    return "failed";
  }
}

export async function deliverOutbox(options: { ids?: string[]; limit?: number } = {}) {
  const result = { sent: 0, failed: 0, skipped: 0 };
  if (!isEmailConfigured()) return result;
  const now = new Date();
  const rows = await prisma.emailOutbox.findMany({
    where: {
      ...(options.ids ? { id: { in: options.ids } } : {}),
      OR: [
        { status: "PENDING", nextAttemptAt: { lte: now } },
        { status: "SENDING", updatedAt: { lt: new Date(now.getTime() - STALE_SENDING_MS) } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: options.limit ?? 20,
  });
  for (const { id } of rows) result[await sendOne(id)] += 1;
  return result;
}

// For request handlers: try to send what was just queued, never fail the
// request because of email. Anything not sent is retried by the cron job.
export async function deliverSoon(idempotencyKeys: string[]) {
  if (!isEmailConfigured() || idempotencyKeys.length === 0) return;
  try {
    const rows = await prisma.emailOutbox.findMany({ where: { idempotencyKey: { in: idempotencyKeys } }, select: { id: true } });
    await deliverOutbox({ ids: rows.map((r) => r.id) });
  } catch (error) {
    console.error("Email delivery deferred:", error instanceof Error ? error.message : error);
  }
}
