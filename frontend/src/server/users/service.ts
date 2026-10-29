import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { badRequest, conflict, notFound } from "@/server/http/errors";
import { issuePasswordToken } from "@/server/auth/service";
import { revokeAllSessions, type SessionUser } from "@/server/auth/session";
import { INVITE_TOKEN_MS } from "@/server/auth/session-rules";
import { isGroupSuperAdmin, membershipProblem, type MembershipRequest } from "@/server/users/rules";

// Admin user management. Routes check "user.manage" (group-wide) before
// calling these; the services enforce the invariants that must always hold.

// Serializable so two admins demoting each other at the same moment cannot
// both pass the last-Super-Administrator check.
const SERIALIZABLE = { isolationLevel: "Serializable" as const };

const userSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
  memberships: { select: { id: true, companyId: true, role: { select: { key: true, name: true } }, company: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.UserSelect;

export function listUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: [{ status: "asc" }, { name: "asc" }] });
}

async function validateMemberships(db: Prisma.TransactionClient, memberships: MembershipRequest[]) {
  const companyIds = [...new Set(memberships.flatMap((m) => (m.companyId ? [m.companyId] : [])))];
  const companies = companyIds.length ? await db.company.findMany({ where: { id: { in: companyIds } }, select: { id: true } }) : [];
  const problem = membershipProblem(memberships, new Set(companies.map((c) => c.id)));
  if (problem) throw badRequest(problem);

  const roles = await db.role.findMany({ where: { key: { in: [...new Set(memberships.map((m) => m.roleKey))] } } });
  const roleIds = new Map(roles.map((r) => [r.key, r.id]));
  return memberships.map((m) => {
    const roleId = roleIds.get(m.roleKey);
    if (!roleId) throw badRequest(`Role "${m.roleKey}" is not set up. Run the database seed.`);
    return { roleId, companyId: m.companyId };
  });
}

// At least one active, group-wide Super Administrator must always remain,
// otherwise nobody could manage users again.
async function assertAnotherSuperAdmin(db: Prisma.TransactionClient, excludingUserId: string) {
  const others = await db.user.count({
    where: {
      id: { not: excludingUserId },
      status: "ACTIVE",
      memberships: { some: { companyId: null, role: { key: "SUPER_ADMIN" } } },
    },
  });
  if (others === 0) throw conflict("This is the last active Super Administrator. Add another one first.");
}

async function isActiveSuperAdmin(db: Prisma.TransactionClient, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true, memberships: { select: { companyId: true, role: { select: { key: true } } } } },
  });
  if (!user) throw notFound("User not found.");
  return user.status === "ACTIVE" && isGroupSuperAdmin(user.memberships.map((m) => ({ roleKey: m.role.key, companyId: m.companyId })));
}

export async function inviteUser(
  actor: SessionUser,
  input: { email: string; name: string; memberships: MembershipRequest[] },
  baseUrl: string,
  meta: { ipHash: string; userAgent: string | null },
) {
  return prisma.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
      throw conflict("An admin account with this email already exists.");
    }
    const memberships = await validateMemberships(tx, input.memberships);
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, status: "INVITED", memberships: { create: memberships } },
      select: userSelect,
    });
    await issuePasswordToken(tx, user, "user-invite", baseUrl, INVITE_TOKEN_MS);
    await recordAudit(
      { actorId: actor.id, action: "user.invite", entityType: "User", entityId: user.id, metadata: { email: user.email, memberships: input.memberships }, ...meta },
      tx,
    );
    return user;
  });
}

export async function updateUser(
  actor: SessionUser,
  userId: string,
  input: { name?: string; status?: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" },
  meta: { ipHash: string; userAgent: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId }, select: { status: true, name: true, passwordHash: true } });
    if (!before) throw notFound("User not found.");

    if (input.status && input.status !== "ACTIVE") {
      if (userId === actor.id) throw badRequest("You cannot suspend or deactivate your own account.");
      if (await isActiveSuperAdmin(tx, userId)) await assertAnotherSuperAdmin(tx, userId);
    }
    if (input.status === "ACTIVE" && !before.passwordHash) {
      throw badRequest("This person has not accepted their invite yet, so the account cannot be activated.");
    }

    const user = await tx.user.update({
      where: { id: userId },
      // Re-activating also clears a login lockout.
      data: { name: input.name, status: input.status, ...(input.status === "ACTIVE" ? { failedLoginCount: 0, lockedUntil: null } : {}) },
      select: userSelect,
    });
    if (input.status && input.status !== "ACTIVE") await revokeAllSessions(userId, undefined, tx);

    await recordAudit(
      {
        actorId: actor.id,
        action: input.status && input.status !== before.status ? `user.status.${input.status.toLowerCase()}` : "user.update",
        entityType: "User",
        entityId: userId,
        metadata: { before: { status: before.status, name: before.name }, after: { status: user.status, name: user.name } },
        ...meta,
      },
      tx,
    );
    return user;
  }, SERIALIZABLE);
}

// Replaces all of a user's memberships. Takes effect on their next request,
// because the access context is rebuilt from the database every time.
export async function setMemberships(
  actor: SessionUser,
  userId: string,
  requested: MembershipRequest[],
  meta: { ipHash: string; userAgent: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.membership.findMany({ where: { userId }, select: { companyId: true, role: { select: { key: true } } } });
    const before = current.map((m) => ({ roleKey: m.role.key, companyId: m.companyId }));
    if (!(await tx.user.findUnique({ where: { id: userId }, select: { id: true } }))) throw notFound("User not found.");

    if (isGroupSuperAdmin(before) && !isGroupSuperAdmin(requested) && (await isActiveSuperAdmin(tx, userId))) {
      await assertAnotherSuperAdmin(tx, userId);
    }
    const memberships = await validateMemberships(tx, requested);
    await tx.membership.deleteMany({ where: { userId } });
    if (memberships.length) await tx.membership.createMany({ data: memberships.map((m) => ({ ...m, userId })) });

    await recordAudit(
      { actorId: actor.id, action: "user.memberships.set", entityType: "User", entityId: userId, metadata: { before, after: requested }, ...meta },
      tx,
    );
    return tx.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });
  }, SERIALIZABLE);
}
