import { hashIdentifier } from "@/server/security/crypto";
import { clientIp } from "@/server/security/rate-limit";

// Request details kept for rate limiting and the audit log. The IP is only
// ever stored as a keyed hash.
export function requestMeta(request: Request) {
  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent");
  return { ip, userAgent, ipHash: hashIdentifier(ip) };
}
