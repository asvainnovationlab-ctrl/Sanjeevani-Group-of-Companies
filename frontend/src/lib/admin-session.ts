import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "sanjeevani-admin-session";
const sessionDurationSeconds = 8 * 60 * 60;

function getAdminConfiguration() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 12 || !secret || secret.length < 32) {
    return null;
  }
  return { password, secret };
}

export function hasAdminConfiguration() {
  return getAdminConfiguration() !== null;
}

export function isValidAdminPassword(candidate: string) {
  const configuration = getAdminConfiguration();
  if (!configuration) return false;
  const expected = createHash("sha256").update(configuration.password).digest();
  const actual = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expected, actual);
}

function signature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(expiresAt).digest("hex");
}

export function createAdminSession() {
  const configuration = getAdminConfiguration();
  if (!configuration) throw new Error("Admin authentication is not configured.");

  const expiresAt = String(Date.now() + sessionDurationSeconds * 1000);
  const value = `${expiresAt}.${signature(expiresAt, configuration.secret)}`;
  cookies().set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionDurationSeconds,
  });
}

export function clearAdminSession() {
  cookies().set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function isAdminAuthenticated() {
  const configuration = getAdminConfiguration();
  const value = cookies().get(cookieName)?.value;
  if (!configuration || !value) return false;

  const [expiresAt, providedSignature] = value.split(".");
  const expiration = Number(expiresAt);
  if (!expiresAt || !providedSignature || !Number.isFinite(expiration) || expiration <= Date.now()) return false;

  const expected = Buffer.from(signature(expiresAt, configuration.secret), "hex");
  const provided = Buffer.from(providedSignature, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
