import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { deliverOutbox } from "@/server/email/sender";
import { HttpError, handle } from "@/server/http/errors";
import { countApplicationsPastRetention } from "@/server/recruitment/applications";
import { refreshCareerPages } from "@/server/public/vacancies";
import { closeExpiredVacancies } from "@/server/recruitment/vacancies";
import { safeEqual } from "@/server/security/crypto";
import { pruneRateLimits } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

// Scheduled housekeeping, every 5–15 minutes (Vercel Cron, a server crontab or
// any uptime pinger): send queued emails, close vacancies past their
// deadline, prune old rate-limit and session rows.
// Requires `Authorization: Bearer <CRON_SECRET>`.
export const GET = handle(async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || secret.length < 16 || !safeEqual(given, secret)) throw new HttpError(401, "Not authorised.", "unauthorized");

  const now = new Date();
  const emails = await deliverOutbox({ limit: 50 });
  const closedVacancies = await closeExpiredVacancies(now);
  if (closedVacancies > 0) refreshCareerPages();
  await pruneRateLimits();
  const sessions = await prisma.session.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date(now.getTime() - 7 * 86400000) } }, { revokedAt: { lt: new Date(now.getTime() - 7 * 86400000) } }] } });
  const tokens = await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 7 * 86400000) } } });
  const applicationsPastRetention = await countApplicationsPastRetention(now);

  return NextResponse.json({ emails, closedVacancies, deletedSessions: sessions.count, deletedTokens: tokens.count, applicationsPastRetention });
});
