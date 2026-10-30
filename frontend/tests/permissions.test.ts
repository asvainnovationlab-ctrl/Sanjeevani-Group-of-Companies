import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PERMISSIONS, roleHasPermission, SYSTEM_ROLES, type PermissionKey } from "../src/server/auth/permissions";

const ALL = Object.keys(PERMISSIONS) as PermissionKey[];

describe("role permission matrix", () => {
  it("every role only grants permissions that exist", () => {
    for (const [key, role] of Object.entries(SYSTEM_ROLES)) {
      for (const permission of role.permissions) {
        assert.ok(ALL.includes(permission), `${key} grants unknown permission ${permission}`);
      }
    }
  });

  it("only the two administrator roles manage users, and only the super administrator roles", () => {
    for (const key of Object.keys(SYSTEM_ROLES)) {
      assert.equal(roleHasPermission(key, "user.manage"), key === "SUPER_ADMIN" || key === "GROUP_ADMIN", `${key} user.manage`);
      assert.equal(roleHasPermission(key, "role.manage"), key === "SUPER_ADMIN", `${key} role.manage`);
    }
  });

  it("HR managers handle recruitment but not content or users", () => {
    assert.ok(roleHasPermission("HR_MANAGER", "application.read"));
    assert.ok(roleHasPermission("HR_MANAGER", "vacancy.publish"));
    assert.ok(!roleHasPermission("HR_MANAGER", "content.update"));
    assert.ok(!roleHasPermission("HR_MANAGER", "legal.publish"));
    assert.ok(!roleHasPermission("HR_MANAGER", "settings.manage"));
  });

  it("content editors cannot publish (separation of duties)", () => {
    assert.ok(roleHasPermission("CONTENT_EDITOR", "content.update"));
    assert.ok(!roleHasPermission("CONTENT_EDITOR", "content.publish"));
    assert.ok(!roleHasPermission("CONTENT_EDITOR", "legal.publish"));
    assert.ok(roleHasPermission("CONTENT_PUBLISHER", "content.publish"));
  });

  it("content roles cannot read private job applications", () => {
    for (const key of ["CONTENT_EDITOR", "CONTENT_PUBLISHER"]) {
      assert.ok(!roleHasPermission(key, "application.read"), key);
    }
  });

  it("auditors are read-only", () => {
    const writes = SYSTEM_ROLES.AUDITOR.permissions.filter((permission) => !/\.read$/.test(permission));
    assert.deepEqual(writes, []);
  });

  it("unknown roles grant nothing", () => {
    assert.equal(roleHasPermission("NOT_A_ROLE", "company.read"), false);
  });
});
