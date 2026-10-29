import type { PermissionKey } from "@/server/auth/permissions";

// Pure authorization logic (no I/O). An AccessContext is built once per
// request from the user's memberships; every protected operation asks it.
//
// A membership grants its role's permissions either group-wide
// (companyId null → every company) or for exactly one company.

export type MembershipGrant = {
  roleKey: string;
  companyId: string | null;
  permissions: string[];
};

export type AccessContext = {
  userId: string;
  roles: string[];
  // permission → "all" (group-wide) or the set of companies it applies to
  grants: Map<string, "all" | Set<string>>;
};

export function buildAccess(userId: string, memberships: MembershipGrant[]): AccessContext {
  const grants = new Map<string, "all" | Set<string>>();
  for (const membership of memberships) {
    for (const permission of membership.permissions) {
      const current = grants.get(permission);
      if (current === "all") continue;
      if (membership.companyId === null) {
        grants.set(permission, "all");
      } else {
        const set = current ?? new Set<string>();
        set.add(membership.companyId);
        grants.set(permission, set);
      }
    }
  }
  return { userId, roles: [...new Set(memberships.map((m) => m.roleKey))], grants };
}

// Can the user do `permission`, optionally on a record owned by `companyId`?
// - companyId omitted: true only for a group-wide grant (platform actions).
// - companyId null: a group-level record (e.g. group news): group-wide only.
// - companyId string: group-wide grant, or a grant for that company.
export function can(ctx: AccessContext, permission: PermissionKey, companyId?: string | null): boolean {
  const grant = ctx.grants.get(permission);
  if (!grant) return false;
  if (grant === "all") return true;
  if (companyId === undefined || companyId === null) return false;
  return grant.has(companyId);
}

// Does the user hold `permission` anywhere (used to show an admin section)?
export function canAny(ctx: AccessContext, permission: PermissionKey): boolean {
  return ctx.grants.has(permission);
}

// For list queries: which companies' records may the user see?
// { all: true } → no company filter; otherwise filter by companyIds (possibly
// empty, meaning nothing).
export function companyScope(ctx: AccessContext, permission: PermissionKey): { all: true } | { all: false; companyIds: string[] } {
  const grant = ctx.grants.get(permission);
  if (grant === "all") return { all: true };
  return { all: false, companyIds: grant ? [...grant] : [] };
}

// A Prisma `where` fragment for company-owned rows.
export function companyWhere(ctx: AccessContext, permission: PermissionKey): { companyId?: { in: string[] } } {
  const scope = companyScope(ctx, permission);
  return scope.all ? {} : { companyId: { in: scope.companyIds } };
}
