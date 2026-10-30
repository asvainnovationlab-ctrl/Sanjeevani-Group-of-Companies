import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSameOrigin } from "../src/server/auth/origin";
import { hashPassword, passwordProblem, verifyPassword } from "../src/server/auth/password";
import { SESSION_IDLE_MS, checkSession, isLocked, shouldTouch } from "../src/server/auth/session-rules";
import { hashIdentifier, randomToken, safeEqual, sha256 } from "../src/server/security/crypto";
import { highRoleProblem, isGroupSuperAdmin, membershipProblem } from "../src/server/users/rules";

const now = new Date("2026-10-29T06:00:00Z");
const minutes = (n: number) => new Date(now.getTime() - n * 60 * 1000);
const session = (overrides: Partial<Parameters<typeof checkSession>[0]> = {}) => ({
  createdAt: minutes(60),
  expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
  lastSeenAt: minutes(10),
  revokedAt: null,
  ...overrides,
});
const active = { status: "ACTIVE" as const, passwordChangedAt: minutes(24 * 60) };

describe("session rules", () => {
  it("accepts a fresh session of an active user", () => {
    assert.equal(checkSession(session(), active, now), "ok");
  });
  it("rejects revoked, expired and idle sessions", () => {
    assert.equal(checkSession(session({ revokedAt: minutes(1) }), active, now), "revoked");
    assert.equal(checkSession(session({ expiresAt: minutes(1) }), active, now), "expired");
    assert.equal(checkSession(session({ lastSeenAt: new Date(now.getTime() - SESSION_IDLE_MS - 1) }), active, now), "idle");
  });
  it("rejects sessions of suspended or invited users", () => {
    assert.equal(checkSession(session(), { ...active, status: "SUSPENDED" }, now), "user_inactive");
    assert.equal(checkSession(session(), { ...active, status: "INVITED" }, now), "user_inactive");
  });
  it("rejects sessions created before the last password change", () => {
    assert.equal(checkSession(session({ createdAt: minutes(60) }), { ...active, passwordChangedAt: minutes(30) }, now), "password_changed");
    assert.equal(checkSession(session({ createdAt: minutes(30) }), { ...active, passwordChangedAt: minutes(30) }, now), "ok");
  });
  it("only refreshes lastSeenAt every few minutes", () => {
    assert.equal(shouldTouch({ lastSeenAt: minutes(1) }, now), false);
    assert.equal(shouldTouch({ lastSeenAt: minutes(10) }, now), true);
  });
  it("lockout ends when lockedUntil passes", () => {
    assert.equal(isLocked({ lockedUntil: new Date(now.getTime() + 1000) }, now), true);
    assert.equal(isLocked({ lockedUntil: minutes(1) }, now), false);
    assert.equal(isLocked({ lockedUntil: null }, now), false);
  });
});

describe("passwords", () => {
  it("hashes with Argon2id and verifies only the right password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.match(hash, /^\$argon2id\$/);
    assert.equal(await verifyPassword(hash, "correct horse battery staple"), true);
    assert.equal(await verifyPassword(hash, "wrong horse battery staple"), false);
    assert.equal(await verifyPassword("not-a-hash", "anything"), false);
  });
  it("rejects weak passwords", () => {
    assert.ok(passwordProblem("short"));
    assert.ok(passwordProblem("aaaaaaaaaaaaaaaa"));
    assert.ok(passwordProblem("myPassword2026!"));
    assert.ok(passwordProblem("ramesh-hospital-2026", "ramesh@example.com"));
    assert.equal(passwordProblem("blue tiger walks home at nine", "ramesh@example.com"), null);
  });
});

describe("tokens and hashing", () => {
  it("random tokens are long and unique", () => {
    const a = randomToken();
    assert.equal(a.length, 43);
    assert.notEqual(a, randomToken());
  });
  it("sha256 and safeEqual behave", () => {
    assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("abc", "abcd"), false);
  });
  it("hashIdentifier is keyed, stable and case-insensitive", () => {
    const previous = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "test-secret-that-is-at-least-32-characters";
    try {
      assert.equal(hashIdentifier("Ram@Example.com "), hashIdentifier("ram@example.com"));
      assert.notEqual(hashIdentifier("ram@example.com"), sha256("ram@example.com").slice(0, 40));
      process.env.AUTH_SECRET = "short";
      assert.throws(() => hashIdentifier("x"));
    } finally {
      process.env.AUTH_SECRET = previous;
    }
  });
});

describe("same-origin check", () => {
  const headers = (h: Record<string, string>) => new Headers(h);
  it("allows same-origin requests and rejects cross-site ones", () => {
    assert.equal(isSameOrigin(headers({ origin: "https://sanjeevani.com.np", host: "sanjeevani.com.np" })), true);
    assert.equal(isSameOrigin(headers({ origin: "https://evil.example", host: "sanjeevani.com.np" })), false);
    assert.equal(isSameOrigin(headers({ origin: "null", host: "sanjeevani.com.np" })), false);
  });
  it("uses Fetch-Metadata when Origin is missing", () => {
    assert.equal(isSameOrigin(headers({ host: "a", "sec-fetch-site": "same-origin" })), true);
    assert.equal(isSameOrigin(headers({ host: "a", "sec-fetch-site": "cross-site" })), false);
  });
  it("accepts a configured public origin behind a proxy", () => {
    assert.equal(isSameOrigin(headers({ origin: "https://www.sanjeevani.com.np", host: "internal:3000" }), ["https://www.sanjeevani.com.np"]), true);
  });
});

describe("membership rules", () => {
  const companies = new Set(["c1"]);
  it("enforces role scope", () => {
    assert.match(membershipProblem([{ roleKey: "SUPER_ADMIN", companyId: "c1" }], companies) ?? "", /group-wide/);
    assert.match(membershipProblem([{ roleKey: "HR_MANAGER", companyId: null }], companies) ?? "", /assigned to a company/);
    assert.equal(membershipProblem([{ roleKey: "CONTENT_EDITOR", companyId: null }, { roleKey: "CONTENT_EDITOR", companyId: "c1" }], companies), null);
  });
  it("rejects unknown roles, unknown companies and duplicates", () => {
    assert.ok(membershipProblem([{ roleKey: "OWNER", companyId: null }], companies));
    assert.ok(membershipProblem([{ roleKey: "HR_MANAGER", companyId: "c2" }], companies));
    assert.ok(membershipProblem([{ roleKey: "HR_MANAGER", companyId: "c1" }, { roleKey: "HR_MANAGER", companyId: "c1" }], companies));
  });
  it("detects a group-wide super admin", () => {
    assert.equal(isGroupSuperAdmin([{ roleKey: "SUPER_ADMIN", companyId: null }]), true);
    assert.equal(isGroupSuperAdmin([{ roleKey: "GROUP_ADMIN", companyId: null }]), false);
  });
  it("keeps the high-level roles in a Super Administrator's hands", () => {
    const hr = [{ roleKey: "HR_MANAGER", companyId: "c1" }];
    const group = [{ roleKey: "GROUP_ADMIN", companyId: null }];
    const superAdmin = [{ roleKey: "SUPER_ADMIN", companyId: null }];
    assert.equal(highRoleProblem(["GROUP_ADMIN"], [], hr), null);
    assert.equal(highRoleProblem(["GROUP_ADMIN"], hr, [{ roleKey: "CONTENT_EDITOR", companyId: null }]), null);
    assert.ok(highRoleProblem(["GROUP_ADMIN"], [], group));
    assert.ok(highRoleProblem(["GROUP_ADMIN"], hr, superAdmin));
    assert.ok(highRoleProblem(["GROUP_ADMIN"], superAdmin));
    assert.ok(highRoleProblem(["GROUP_ADMIN"], group, hr));
    assert.equal(highRoleProblem(["SUPER_ADMIN"], superAdmin, group), null);
  });
});
