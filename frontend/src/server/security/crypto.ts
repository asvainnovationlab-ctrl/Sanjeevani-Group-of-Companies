import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// A URL-safe random token (256 bits) for sessions, invites and resets.
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

// Tokens are stored only as SHA-256 hashes, so a database leak does not leak
// usable session or reset tokens.
export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  }
  return secret;
}

// Keyed hash for identifiers we must not store in clear (IP addresses, emails
// in rate-limit keys): stable for matching, not reversible.
export function hashIdentifier(value: string): string {
  return createHmac("sha256", authSecret()).update(value.trim().toLowerCase()).digest("hex").slice(0, 40);
}

export function assertAuthConfigured() {
  authSecret();
}
