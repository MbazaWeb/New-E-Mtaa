import { describe, it, expect } from "vitest";
import {
  ACTIONS,
  can,
  canOnResource,
  isInScope,
  getAllowedActions,
  getScopeFilter,
} from "../lib/permissionEngine";
import { buildPermissionContext } from "../lib/scopedQuery";

// ─── Role-Based Permission Checks ───────────────────────
describe("Permission Engine — Role Checks", () => {
  it("citizen can create and view applications", () => {
    expect(can("citizen", ACTIONS.CREATE_APPLICATION)).toBe(true);
    expect(can("citizen", ACTIONS.VIEW_APPLICATION)).toBe(true);
  });

  it("citizen cannot approve or manage", () => {
    expect(can("citizen", ACTIONS.APPROVE_APPLICATION)).toBe(false);
    expect(can("citizen", ACTIONS.MANAGE_STAFF)).toBe(false);
    expect(can("citizen", ACTIONS.SYSTEM_SETTINGS)).toBe(false);
  });

  it("mtaa officer can approve and issue", () => {
    expect(can("mtaa_officer", ACTIONS.APPROVE_APPLICATION)).toBe(true);
    expect(can("mtaa_officer", ACTIONS.ISSUE_DOCUMENT)).toBe(true);
    expect(can("mtaa_officer", ACTIONS.VIEW_ANALYTICS)).toBe(true);
    expect(can("mtaa_officer", ACTIONS.EXPORT_DATA)).toBe(true);
  });

  it("mtaa officer cannot manage staff", () => {
    expect(can("mtaa_officer", ACTIONS.MANAGE_STAFF)).toBe(false);
  });

  it("ward officer can manage staff", () => {
    expect(can("ward_officer", ACTIONS.MANAGE_STAFF)).toBe(true);
    expect(can("ward_officer", ACTIONS.ASSIGN_ROLES)).toBe(true);
  });

  it("council admin can manage services and view audit logs", () => {
    expect(can("council_admin", ACTIONS.MANAGE_SERVICES)).toBe(true);
    expect(can("council_admin", ACTIONS.VIEW_AUDIT_LOGS)).toBe(true);
    expect(can("council_admin", ACTIONS.MANAGE_LOCATIONS)).toBe(true);
  });

  it("national admin can do everything", () => {
    const allActions = Object.values(ACTIONS);
    allActions.forEach((action) => {
      expect(can("national_admin", action)).toBe(true);
    });
  });

  it("getAllowedActions returns correct count per role", () => {
    const citizenActions = getAllowedActions("citizen");
    const mtaaActions = getAllowedActions("mtaa_officer");
    const nationalActions = getAllowedActions("national_admin");

    expect(citizenActions.length).toBe(2); // view + create
    expect(mtaaActions.length).toBeGreaterThan(citizenActions.length);
    expect(nationalActions.length).toBe(Object.values(ACTIONS).length);
  });
});

// ─── Scope-Based Access ─────────────────────────────────
describe("Permission Engine — Scope Isolation", () => {
  it("national admin sees all resources", () => {
    expect(isInScope({ level: "national" }, { council_id: "any" })).toBe(true);
    expect(isInScope({ level: "national" }, { region_id: "any" })).toBe(true);
  });

  it("regional admin sees only their region", () => {
    const scope = { level: "region" as const, region_id: "r1" };
    expect(isInScope(scope, { region_id: "r1" })).toBe(true);
    expect(isInScope(scope, { region_id: "r2" })).toBe(false);
  });

  it("council admin sees only their council", () => {
    const scope = { level: "council" as const, council_id: "c1" };
    expect(isInScope(scope, { council_id: "c1" })).toBe(true);
    expect(isInScope(scope, { council_id: "c2" })).toBe(false);
  });

  it("ward officer sees only their ward", () => {
    const scope = { level: "ward" as const, ward_id: "w1" };
    expect(isInScope(scope, { ward_id: "w1" })).toBe(true);
    expect(isInScope(scope, { ward_id: "w2" })).toBe(false);
  });

  it("citizen sees only own records", () => {
    const scope = { level: "self" as const, user_id: "u1" };
    expect(isInScope(scope, { user_id: "u1" })).toBe(true);
    expect(isInScope(scope, { user_id: "u2" })).toBe(false);
  });

  it("canOnResource combines role + scope", () => {
    const ctx = {
      role: "council_admin" as const,
      scope: { level: "council" as const, council_id: "c1" },
    };

    // Can approve in own council
    expect(canOnResource(ctx, ACTIONS.APPROVE_APPLICATION, { council_id: "c1" })).toBe(true);
    // Cannot approve in another council
    expect(canOnResource(ctx, ACTIONS.APPROVE_APPLICATION, { council_id: "c2" })).toBe(false);
  });

  it("citizen cannot approve even in own scope", () => {
    const ctx = {
      role: "citizen" as const,
      scope: { level: "self" as const, user_id: "u1" },
    };
    expect(canOnResource(ctx, ACTIONS.APPROVE_APPLICATION, { user_id: "u1" })).toBe(false);
  });
});

// ─── Scope Filter Generation ────────────────────────────
describe("Scope Filter Generation", () => {
  it("national admin generates no filters", () => {
    const filters = getScopeFilter({
      role: "national_admin",
      scope: { level: "national" },
    });
    expect(Object.keys(filters)).toHaveLength(0);
  });

  it("council admin generates council_id filter", () => {
    const filters = getScopeFilter({
      role: "council_admin",
      scope: { level: "council", council_id: "c1" },
    });
    expect(filters).toEqual({ council_id: "c1" });
  });

  it("citizen generates user_id filter", () => {
    const filters = getScopeFilter({
      role: "citizen",
      scope: { level: "self", user_id: "u1" },
    });
    expect(filters).toEqual({ user_id: "u1" });
  });
});

// ─── Context Builder ────────────────────────────────────
describe("Permission Context Builder", () => {
  it("builds citizen context from legacy user", () => {
    const ctx = buildPermissionContext({ id: "u1", role: "citizen" });
    expect(ctx.role).toBe("citizen");
    expect(ctx.scope.level).toBe("self");
    expect(ctx.scope.user_id).toBe("u1");
  });

  it("builds staff context → mtaa_officer (legacy mapping)", () => {
    const ctx = buildPermissionContext({
      id: "u2",
      role: "staff",
      system_role: "mtaa_officer",
      council_id: "c1",
      ward_id_v2: "w1",
      street_id: "s1",
      region_id: "r1",
    });
    expect(ctx.role).toBe("mtaa_officer");
    expect(ctx.scope.level).toBe("street");
    expect(ctx.scope.street_id).toBe("s1");
  });

  it("builds admin context → council_admin (legacy mapping)", () => {
    const ctx = buildPermissionContext({
      id: "u3",
      role: "admin",
      system_role: "council_admin",
      council_id: "c1",
      region_id: "r1",
    });
    expect(ctx.role).toBe("council_admin");
    expect(ctx.scope.level).toBe("council");
    expect(ctx.scope.council_id).toBe("c1");
  });

  it("builds national admin context", () => {
    const ctx = buildPermissionContext({
      id: "u4",
      system_role: "national_admin",
    });
    expect(ctx.role).toBe("national_admin");
    expect(ctx.scope.level).toBe("national");
  });

  it("defaults to citizen when no role specified", () => {
    const ctx = buildPermissionContext({ id: "u5" });
    expect(ctx.role).toBe("citizen");
    expect(ctx.scope.level).toBe("self");
  });

  it("system_role takes precedence over legacy role", () => {
    const ctx = buildPermissionContext({
      id: "u6",
      role: "staff",
      system_role: "ward_officer",
      ward_id_v2: "w1",
      council_id: "c1",
      region_id: "r1",
    });
    expect(ctx.role).toBe("ward_officer");
    expect(ctx.scope.level).toBe("ward");
  });
});
