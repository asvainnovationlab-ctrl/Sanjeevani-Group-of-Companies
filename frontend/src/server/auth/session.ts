import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { randomToken, sha256 } from "@/server/security/crypto";
import { SESSION_ABSOLUTE_MS, SESSION_COOKIE, checkSession, shouldTouch } from "@/server/auth/session-rules";
import { buildAccess, type AccessContext } from "@/server/auth/access";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  sessionId: string;
  access: AccessContext;
};

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

// Creates a session row and sets the cookie. Only the token hash is stored.
export async function createSession(userId: string, meta: { ipHash?: string | null; userAgent?: string | null }) {
  const token = randomToken(32);
  // createdAt from the app clock, the same clock that sets passwordChangedAt,
  // so a session made right after a password change is never rejected by skew.
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MS);
  const session = await prisma.session.create({
    data: {
      userId,
      createdAt: now,
      lastSeenAt: now,
      tokenHash: sha256(token),
      expiresAt,
      ipHash: meta.ipHash ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
  cookies().set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return session;
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", cookieOptions(new Date(0)));
}

// Resolves the signed-in user from the cookie, or null. Loads memberships
// with their role permissions so authorization needs no further queries.
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: {
          memberships: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        },
      },
    },
  });
  if (!session) return null;

  const now = new Date();
  if (checkSession(session, session.user, now) !== "ok") return null;

  if (shouldTouch(session, now)) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: now } });
  }

  const { user } = session;
  const access = buildAccess(
    user.id,
    user.memberships.map((m) => ({
      roleKey: m.role.key,
      companyId: m.companyId,
      permissions: m.role.permissions.map((rp) => rp.permission.key),
    })),
  );
  return { id: user.id, email: user.email, name: user.name, sessionId: session.id, access };
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string, db: Prisma.TransactionClient = prisma) {
  await db.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
}
