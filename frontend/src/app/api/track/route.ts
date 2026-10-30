import { isSameOrigin } from "@/server/auth/origin";
import { configuredSiteUrl } from "@/server/email/outbox";
import { clientIp, consumeRateLimit } from "@/server/security/rate-limit";
import { hashIdentifier } from "@/server/security/crypto";
import { isBot, recordVisit, trackablePath } from "@/server/traffic/service";

export const dynamic = "force-dynamic";

// Page-view beacon from the public site. Always answers 204 and never fails
// the page: bad input, bots, do-not-track and bursts are dropped quietly.
export async function POST(request: Request) {
  try {
    const site = configuredSiteUrl();
    if (!isSameOrigin(request.headers, site ? [site] : [])) return new Response(null, { status: 204 });
    if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
    const userAgent = request.headers.get("user-agent");
    if (isBot(userAgent)) return new Response(null, { status: 204 });

    const body = (await request.json().catch(() => null)) as { path?: unknown } | null;
    const path = trackablePath(body?.path);
    if (!path) return new Response(null, { status: 204 });

    const ip = clientIp(request);
    const { allowed } = await consumeRateLimit(`track:ip:${hashIdentifier(ip)}`, 120, 60 * 1000);
    if (allowed) await recordVisit(path, ip, userAgent!);
  } catch (error) {
    console.error("Visit not recorded:", error instanceof Error ? error.message.split("\n")[0] : error);
  }
  return new Response(null, { status: 204 });
}
