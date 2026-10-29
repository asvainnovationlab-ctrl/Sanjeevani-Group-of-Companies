import { prisma } from "@/server/db";
import { tooManyRequests } from "@/server/http/errors";

// Fixed-window counter stored in PostgreSQL, so limits hold across server
// restarts and multiple instances. One atomic statement per hit. Timestamps
// come from the app clock so they match how Prisma stores DateTime (UTC).
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; count: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count", "updatedAt")
    VALUES (${key}, ${now}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowStart" < ${windowStart} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" < ${windowStart} THEN ${now} ELSE "RateLimitBucket"."windowStart" END,
      "updatedAt" = ${now}
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  return { allowed: count <= limit, count };
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number, message?: string) {
  const { allowed } = await consumeRateLimit(key, limit, windowMs);
  if (!allowed) throw tooManyRequests(message);
}

export async function pruneRateLimits(olderThanMs = 24 * 60 * 60 * 1000) {
  await prisma.rateLimitBucket.deleteMany({ where: { updatedAt: { lt: new Date(Date.now() - olderThanMs) } } });
}

// Best-effort client IP behind a proxy (Vercel / Nginx set x-forwarded-for).
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
