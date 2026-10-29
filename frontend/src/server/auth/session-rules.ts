// Pure session rules (no I/O), shared by the session store and unit tests.

export const SESSION_COOKIE = "sg_session";
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000; // re-login at least every 12 hours
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000; // signed out after 2 hours idle
export const SESSION_TOUCH_MS = 5 * 60 * 1000; // refresh lastSeenAt at most every 5 minutes

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
export const RESET_TOKEN_MS = 60 * 60 * 1000; // password reset links last 1 hour
export const INVITE_TOKEN_MS = 72 * 60 * 60 * 1000; // invite links last 3 days

export type SessionState = {
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
};

export type SessionUserState = {
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  passwordChangedAt: Date | null;
};

export type SessionVerdict = "ok" | "revoked" | "expired" | "idle" | "user_inactive" | "password_changed";

export function checkSession(session: SessionState, user: SessionUserState, now = new Date()): SessionVerdict {
  if (session.revokedAt) return "revoked";
  if (session.expiresAt.getTime() <= now.getTime()) return "expired";
  if (now.getTime() - session.lastSeenAt.getTime() > SESSION_IDLE_MS) return "idle";
  if (user.status !== "ACTIVE") return "user_inactive";
  // Every session that started before the last password change is invalid.
  if (user.passwordChangedAt && session.createdAt.getTime() < user.passwordChangedAt.getTime()) return "password_changed";
  return "ok";
}

export function shouldTouch(session: Pick<SessionState, "lastSeenAt">, now = new Date()): boolean {
  return now.getTime() - session.lastSeenAt.getTime() >= SESSION_TOUCH_MS;
}

export function isLocked(user: { lockedUntil: Date | null }, now = new Date()): boolean {
  return Boolean(user.lockedUntil && user.lockedUntil.getTime() > now.getTime());
}
