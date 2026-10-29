import { forbidden, unauthorized } from "@/server/http/errors";
import { can, canAny } from "@/server/auth/access";
import { isSameOrigin } from "@/server/auth/origin";
import { getSessionUser, type SessionUser } from "@/server/auth/session";
import type { PermissionKey } from "@/server/auth/permissions";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function assertSameOrigin(request: Request) {
  if (!UNSAFE.has(request.method)) return;
  const allowed = process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : [];
  if (!isSameOrigin(request.headers, allowed)) throw forbidden("Cross-site request blocked.");
}

export async function requireUser(request?: Request): Promise<SessionUser> {
  if (request) assertSameOrigin(request);
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

// companyId: undefined → needs a group-wide grant; null → group-level record;
// string → that company; "any" → the permission anywhere (list endpoints,
// which then filter rows with companyWhere()).
export async function requirePermission(request: Request | undefined, permission: PermissionKey, companyId?: string | null | "any") {
  const user = await requireUser(request);
  const allowed = companyId === "any" ? canAny(user.access, permission) : can(user.access, permission, companyId);
  if (!allowed) throw forbidden();
  return user;
}
