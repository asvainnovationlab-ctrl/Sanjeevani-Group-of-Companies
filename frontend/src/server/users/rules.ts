import { SYSTEM_ROLES } from "@/server/auth/permissions";

// Pure checks for membership changes (no I/O).

export type MembershipRequest = { roleKey: string; companyId: string | null };

// Returns a reason the requested memberships are invalid, or null.
export function membershipProblem(memberships: MembershipRequest[], knownCompanyIds: Set<string>): string | null {
  const seen = new Set<string>();
  for (const m of memberships) {
    const role = SYSTEM_ROLES[m.roleKey];
    if (!role) return `Unknown role "${m.roleKey}".`;
    if (role.scope === "group" && m.companyId !== null) return `${role.name} is a group-wide role and cannot be limited to one company.`;
    if (role.scope === "company" && m.companyId === null) return `${role.name} must be assigned to a company.`;
    if (m.companyId !== null && !knownCompanyIds.has(m.companyId)) return "One of the selected companies does not exist.";
    const key = `${m.roleKey}:${m.companyId ?? "group"}`;
    if (seen.has(key)) return "The same role is listed twice for the same company.";
    seen.add(key);
  }
  return null;
}

export function isGroupSuperAdmin(memberships: MembershipRequest[]): boolean {
  return memberships.some((m) => m.roleKey === "SUPER_ADMIN" && m.companyId === null);
}
