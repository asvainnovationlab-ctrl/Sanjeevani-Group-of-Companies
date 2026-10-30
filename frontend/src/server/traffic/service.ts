import { createHmac } from "node:crypto";
import { prisma } from "@/server/db";
import { kathmanduDate } from "@/server/time";

// Cookie-free visit counting for the dashboard chart. Nothing personal is
// stored: a visitor is a keyed hash of (Nepal day, IP, browser) that changes
// daily, used only to count each visitor once per day and pruned after two
// days. Bots, admin pages and visitors asking not to be tracked are skipped.

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch/i;

// Public paths only, without query strings, at most 200 characters.
export function trackablePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.split(/[?#]/)[0].slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (/^\/(admin|api|_next)(\/|$)/.test(path)) return null;
  if (!/^[\w\-./%~]*$/.test(path)) return null;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

// The Nepal calendar day of an instant, as a UTC-midnight Date for @db.Date.
export function trafficDay(now = new Date()): Date {
  const { year, month, day } = kathmanduDate(now);
  return new Date(Date.UTC(year, month - 1, day));
}

function visitorHash(day: Date, ip: string, userAgent: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", secret).update(`${day.toISOString().slice(0, 10)}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

export async function recordVisit(path: string, ip: string, userAgent: string, now = new Date()) {
  const day = trafficDay(now);
  const hash = visitorHash(day, ip, userAgent);
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.siteVisitorDay.createMany({ data: [{ day, visitorHash: hash }], skipDuplicates: true });
    // One atomic upsert each, so simultaneous first visits of a day cannot collide.
    await tx.$executeRaw`
      INSERT INTO "SiteTrafficDay" ("day", "views", "visitors") VALUES (${day}::date, 1, ${fresh.count})
      ON CONFLICT ("day") DO UPDATE SET "views" = "SiteTrafficDay"."views" + 1, "visitors" = "SiteTrafficDay"."visitors" + ${fresh.count}`;
    await tx.$executeRaw`
      INSERT INTO "SitePageDay" ("day", "path", "views") VALUES (${day}::date, ${path}, 1)
      ON CONFLICT ("day", "path") DO UPDATE SET "views" = "SitePageDay"."views" + 1`;
  });
}

export type TrafficPoint = { date: string; views: number; visitors: number };

export async function trafficSummary(days = 30, now = new Date()) {
  const end = trafficDay(now);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const [rows, pages, first] = await Promise.all([
    prisma.siteTrafficDay.findMany({ where: { day: { gte: start, lte: end } }, orderBy: { day: "asc" } }),
    prisma.sitePageDay.groupBy({ by: ["path"], where: { day: { gte: start, lte: end } }, _sum: { views: true }, orderBy: { _sum: { views: "desc" } }, take: 5 }),
    prisma.siteTrafficDay.findFirst({ orderBy: { day: "asc" }, select: { day: true } }),
  ]);
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r]));
  const series: TrafficPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    const row = byDay.get(date);
    series.push({ date, views: row?.views ?? 0, visitors: row?.visitors ?? 0 });
  }
  return {
    series,
    totals: { views: series.reduce((s, p) => s + p.views, 0), visitors: series.reduce((s, p) => s + p.visitors, 0) },
    topPages: pages.map((p) => ({ path: p.path, views: p._sum.views ?? 0 })),
    countingSince: first ? first.day.toISOString().slice(0, 10) : null,
  };
}

export async function pruneVisitorHashes(now = new Date()) {
  const cutoff = new Date(trafficDay(now).getTime() - 2 * 86400000);
  return (await prisma.siteVisitorDay.deleteMany({ where: { day: { lt: cutoff } } })).count;
}
