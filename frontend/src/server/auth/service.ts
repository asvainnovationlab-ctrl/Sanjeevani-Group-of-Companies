import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { enqueueEmail } from "@/server/email/outbox";
import { deliverSoon } from "@/server/email/sender";
import { badRequest, unauthorized } from "@/server/http/errors";
import { hashIdentifier, randomToken, sha256 } from "@/server/security/crypto";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { hashPassword, passwordProblem, verifyAgainstDummy, verifyPassword } from "@/server/auth/password";
import { clearSessionCookie, createSession, revokeAllSessions, revokeSession, type SessionUser } from "@/server/auth/session";
import { LOGIN_LOCK_MS, LOGIN_MAX_FAILURES, RESET_TOKEN_MS, isLocked } from "@/server/auth/session-rules";

export type RequestMeta = { ip: string; userAgent: string | null };

const MINUTE = 60 * 1000;
const BAD_LOGIN = "Email or password is incorrect.";

// Same message for unknown email, wrong password, locked or inactive account,
// so the login form never reveals which accounts exist.
export async function login(input: { email: string; password: string }, meta: RequestMeta) {
  const ipHash = hashIdentifier(meta.ip);
  await enforceRateLimit(`login:ip:${ipHash}`, 20, 15 * MINUTE);
  await enforceRateLimit(`login:email:${hashIdentifier(input.email)}`, 10, 15 * MINUTE);

  const audit = { ipHash, userAgent: meta.userAgent };
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user?.passwordHash) {
    await verifyAgainstDummy(input.password);
    await recordAudit({ ...audit, action: "auth.login.failure", metadata: { reason: "unknown_account" } });
    throw unauthorized(BAD_LOGIN);
  }
  if (isLocked(user)) {
    await verifyAgainstDummy(input.password);
    await recordAudit({ ...audit, actorId: user.id, action: "auth.login.failure", entityType: "User", entityId: user.id, metadata: { reason: "locked" } });
    throw unauthorized(BAD_LOGIN);
  }

  if (!(await verifyPassword(user.passwordHash, input.password))) {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } } });
    const lock = updated.failedLoginCount >= LOGIN_MAX_FAILURES;
    if (lock) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOGIN_LOCK_MS) } });
    }
    await recordAudit({ ...audit, actorId: user.id, action: lock ? "auth.lockout" : "auth.login.failure", entityType: "User", entityId: user.id, metadata: { reason: "bad_password" } });
    throw unauthorized(BAD_LOGIN);
  }

  if (user.status !== "ACTIVE") {
    await recordAudit({ ...audit, actorId: user.id, action: "auth.login.failure", entityType: "User", entityId: user.id, metadata: { reason: user.status.toLowerCase() } });
    throw unauthorized(BAD_LOGIN);
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession(user.id, { ipHash, userAgent: meta.userAgent });
  await recordAudit({ ...audit, actorId: user.id, action: "auth.login.success", entityType: "User", entityId: user.id });
  return { id: user.id, email: user.email, name: user.name };
}

export async function logout(user: SessionUser, meta: RequestMeta) {
  await revokeSession(user.sessionId);
  clearSessionCookie();
  await recordAudit({ actorId: user.id, action: "auth.logout", entityType: "User", entityId: user.id, ipHash: hashIdentifier(meta.ip), userAgent: meta.userAgent });
}

// Creates a one-time token (hash stored) and queues the email. Earlier unused
// tokens for the same user are invalidated. Returns nothing the caller could
// use to tell whether the account exists.
export async function issuePasswordToken(
  db: Prisma.TransactionClient,
  user: { id: string; email: string; name: string },
  kind: "password-reset" | "user-invite",
  baseUrl: string,
  validMs: number,
): Promise<string> {
  const token = randomToken(32);
  const now = new Date();
  await db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } });
  const row = await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(now.getTime() + validMs) },
  });
  const path = kind === "user-invite" ? "/admin/accept-invite" : "/admin/reset-password";
  return enqueueEmail(
    {
      idempotencyKey: `${kind}:${row.id}`,
      template: kind,
      to: user.email,
      subject: kind === "user-invite" ? "You have been invited to the Sanjeevani Group admin" : "Reset your Sanjeevani Group admin password",
      payload: { name: user.name, link: `${baseUrl}${path}?token=${encodeURIComponent(token)}`, expiresAt: row.expiresAt.toISOString() },
    },
    db,
  );
}

export async function requestPasswordReset(email: string, meta: RequestMeta, baseUrl: string) {
  const ipHash = hashIdentifier(meta.ip);
  await enforceRateLimit(`reset:ip:${ipHash}`, 10, 15 * MINUTE);
  await enforceRateLimit(`reset:email:${hashIdentifier(email)}`, 3, 60 * MINUTE);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || (user.status !== "ACTIVE" && user.status !== "INVITED")) return;

  const key = await prisma.$transaction(async (tx) => {
    const queued = await issuePasswordToken(tx, user, "password-reset", baseUrl, RESET_TOKEN_MS);
    await recordAudit({ actorId: user.id, action: "auth.password_reset.request", entityType: "User", entityId: user.id, ipHash, userAgent: meta.userAgent }, tx);
    return queued;
  });
  await deliverSoon([key]);
}

// Used for both password resets and accepting an invite (which activates the
// account). Signs out every existing session.
export async function resetPassword(input: { token: string; password: string }, meta: RequestMeta) {
  const ipHash = hashIdentifier(meta.ip);
  await enforceRateLimit(`reset-confirm:ip:${ipHash}`, 10, 15 * MINUTE);

  const invalid = badRequest("This link is invalid or has expired. Request a new one.");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(input.token) }, include: { user: true } });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) throw invalid;
  const { user } = row;
  if (user.status !== "ACTIVE" && user.status !== "INVITED") throw invalid;

  const problem = passwordProblem(input.password, user.email);
  if (problem) throw badRequest(problem);
  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    // Claim the token atomically so two concurrent requests cannot both use it.
    const claimed = await tx.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) throw invalid;
    const now = new Date();
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: now,
        status: "ACTIVE",
        emailVerifiedAt: user.emailVerifiedAt ?? now,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await revokeAllSessions(user.id, undefined, tx);
    await recordAudit(
      { actorId: user.id, action: user.status === "INVITED" ? "auth.invite.accept" : "auth.password_reset.complete", entityType: "User", entityId: user.id, ipHash, userAgent: meta.userAgent },
      tx,
    );
  });
}

// Signs out every other session and replaces the current one, because
// sessions older than passwordChangedAt are no longer accepted.
export async function changePassword(sessionUser: SessionUser, input: { currentPassword: string; newPassword: string }, meta: RequestMeta) {
  const ipHash = hashIdentifier(meta.ip);
  await enforceRateLimit(`password-change:user:${sessionUser.id}`, 5, 15 * MINUTE);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  if (!user.passwordHash || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw badRequest("Your current password is incorrect.");
  }
  const problem = passwordProblem(input.newPassword, user.email);
  if (problem) throw badRequest(problem);
  if (await verifyPassword(user.passwordHash, input.newPassword)) throw badRequest("Choose a password different from your current one.");

  const passwordHash = await hashPassword(input.newPassword);
  const key = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash, passwordChangedAt: new Date() } });
    await revokeAllSessions(user.id, undefined, tx);
    const queued = await enqueueEmail(
      {
        idempotencyKey: `password-changed:${user.id}:${Date.now()}`,
        template: "password-changed",
        to: user.email,
        subject: "Your Sanjeevani Group admin password was changed",
        payload: { name: user.name },
      },
      tx,
    );
    await recordAudit({ actorId: user.id, action: "auth.password.change", entityType: "User", entityId: user.id, ipHash, userAgent: meta.userAgent }, tx);
    return queued;
  });
  await createSession(user.id, { ipHash, userAgent: meta.userAgent });
  await deliverSoon([key]);
}
