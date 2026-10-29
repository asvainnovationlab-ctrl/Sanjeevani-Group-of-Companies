import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAccess, can, canAny, companyScope, companyWhere } from "../src/server/auth/access";
import { SYSTEM_ROLES } from "../src/server/auth/permissions";

const HOSPITAL = "11111111-1111-1111-1111-111111111111";
const SCHOOL = "22222222-2222-2222-2222-222222222222";

const grant = (roleKey: string, companyId: string | null) => ({ roleKey, companyId, permissions: SYSTEM_ROLES[roleKey].permissions });

describe("company-scoped access", () => {
  it("an HR manager for one company cannot see another company's applications", () => {
    const ctx = buildAccess("u1", [grant("HR_MANAGER", HOSPITAL)]);
    assert.equal(can(ctx, "application.read", HOSPITAL), true);
    assert.equal(can(ctx, "application.read", SCHOOL), false);
    assert.deepEqual(companyWhere(ctx, "application.read"), { companyId: { in: [HOSPITAL] } });
  });

  it("a company role never grants group-level or platform actions", () => {
    const ctx = buildAccess("u1", [grant("COMPANY_ADMIN", HOSPITAL)]);
    assert.equal(can(ctx, "company.update"), false);
    assert.equal(can(ctx, "company.update", null), false);
    assert.equal(can(ctx, "user.manage"), false);
  });

  it("a group-wide role applies to every company and to group records", () => {
    const ctx = buildAccess("u1", [grant("GROUP_ADMIN", null)]);
    assert.equal(can(ctx, "vacancy.publish", SCHOOL), true);
    assert.equal(can(ctx, "content.publish", null), true);
    assert.deepEqual(companyScope(ctx, "vacancy.read"), { all: true });
    assert.deepEqual(companyWhere(ctx, "vacancy.read"), {});
    assert.equal(can(ctx, "user.manage"), false);
  });

  it("grants from several memberships combine", () => {
    const ctx = buildAccess("u1", [grant("HR_MANAGER", HOSPITAL), grant("HR_MANAGER", SCHOOL), grant("CONTENT_EDITOR", null)]);
    assert.deepEqual(new Set((companyScope(ctx, "application.read") as { companyIds: string[] }).companyIds), new Set([HOSPITAL, SCHOOL]));
    assert.equal(can(ctx, "content.update", null), true);
    assert.equal(can(ctx, "content.publish", null), false);
    assert.deepEqual(ctx.roles.sort(), ["CONTENT_EDITOR", "HR_MANAGER"]);
  });

  it("a group-wide grant wins over company grants for the same permission", () => {
    const ctx = buildAccess("u1", [grant("HR_MANAGER", HOSPITAL), grant("GROUP_ADMIN", null)]);
    assert.deepEqual(companyScope(ctx, "application.read"), { all: true });
  });

  it("no memberships means no access and an empty scope", () => {
    const ctx = buildAccess("u1", []);
    assert.equal(canAny(ctx, "company.read"), false);
    assert.deepEqual(companyWhere(ctx, "company.read"), { companyId: { in: [] } });
  });

  it("the auditor can read but never change anything", () => {
    const ctx = buildAccess("u1", [grant("AUDITOR", null)]);
    assert.equal(can(ctx, "application.read", HOSPITAL), true);
    for (const write of ["application.update", "vacancy.update", "content.update", "user.manage", "media.upload"] as const) {
      assert.equal(can(ctx, write, HOSPITAL), false, write);
    }
  });
});
