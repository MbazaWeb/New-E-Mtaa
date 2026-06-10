import { describe, it, expect } from "vitest";
import {
  ADMIN_LEVELS,
  TANZANIA_REGIONS,
  resolveAdminLevel,
  generateCouncilCode,
} from "../config/governmentHierarchy";
import {
  SYSTEM_ROLES,
  ROLE_DEFINITIONS,
  LEGACY_ROLE_MAP,
  outranks,
  hasPermission,
  getRolesAtOrAbove,
  getRoleLabel,
} from "../config/roleMatrix";
import {
  resolveUserScope,
  buildScopeFilters,
  getEscalationTarget,
} from "../config/councilArchitecture";

// ─── Government Hierarchy ───────────────────────────────
describe("Government Hierarchy", () => {
  it("has 5 administrative levels", () => {
    expect(ADMIN_LEVELS).toEqual(["national", "region", "council", "ward", "street"]);
  });

  it("has 31+ Tanzania regions", () => {
    expect(TANZANIA_REGIONS.length).toBeGreaterThanOrEqual(31);
  });

  it("includes key regions", () => {
    const names = TANZANIA_REGIONS.map((r) => r.name);
    expect(names).toContain("Dar es Salaam");
    expect(names).toContain("Dodoma");
    expect(names).toContain("Arusha");
    expect(names).toContain("Mwanza");
  });

  it("each region has code and name", () => {
    TANZANIA_REGIONS.forEach((r) => {
      expect(r.code).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.name_sw).toBeTruthy();
    });
  });

  it("resolves admin level from hierarchy path", () => {
    expect(resolveAdminLevel({})).toBe("national");
    expect(resolveAdminLevel({ region_id: "r1" })).toBe("region");
    expect(resolveAdminLevel({ region_id: "r1", council_id: "c1" })).toBe("council");
    expect(resolveAdminLevel({ region_id: "r1", council_id: "c1", ward_id: "w1" })).toBe("ward");
    expect(resolveAdminLevel({ region_id: "r1", council_id: "c1", ward_id: "w1", street_id: "s1" })).toBe("street");
  });

  it("generates council codes", () => {
    expect(generateCouncilCode("DSM", "Ilala", "municipal_council")).toBe("DSM-ILA-MC");
    expect(generateCouncilCode("ARU", "Arusha", "city_council")).toBe("ARU-ARU-CC");
    expect(generateCouncilCode("MWZ", "Kwimba", "district_council")).toBe("MWZ-KWI-DC");
  });
});

// ─── Role Matrix ────────────────────────────────────────
describe("Role Matrix", () => {
  it("defines 6 system roles", () => {
    expect(SYSTEM_ROLES).toHaveLength(6);
    expect(SYSTEM_ROLES).toContain("citizen");
    expect(SYSTEM_ROLES).toContain("mtaa_officer");
    expect(SYSTEM_ROLES).toContain("national_admin");
  });

  it("ranks roles correctly (citizen lowest, national highest)", () => {
    expect(ROLE_DEFINITIONS.citizen.rank).toBe(1);
    expect(ROLE_DEFINITIONS.mtaa_officer.rank).toBe(2);
    expect(ROLE_DEFINITIONS.ward_officer.rank).toBe(3);
    expect(ROLE_DEFINITIONS.council_admin.rank).toBe(4);
    expect(ROLE_DEFINITIONS.regional_admin.rank).toBe(5);
    expect(ROLE_DEFINITIONS.national_admin.rank).toBe(6);
  });

  it("citizens cannot approve or manage staff", () => {
    expect(hasPermission("citizen", "canApprove")).toBe(false);
    expect(hasPermission("citizen", "canManageStaff")).toBe(false);
    expect(hasPermission("citizen", "canExportData")).toBe(false);
  });

  it("mtaa officers can approve and issue", () => {
    expect(hasPermission("mtaa_officer", "canApprove")).toBe(true);
    expect(hasPermission("mtaa_officer", "canIssue")).toBe(true);
    expect(hasPermission("mtaa_officer", "canManageStaff")).toBe(false);
  });

  it("council admin can manage staff and services", () => {
    expect(hasPermission("council_admin", "canManageStaff")).toBe(true);
    expect(hasPermission("council_admin", "canManageServices")).toBe(true);
  });

  it("national admin has all permissions", () => {
    expect(hasPermission("national_admin", "canApprove")).toBe(true);
    expect(hasPermission("national_admin", "canIssue")).toBe(true);
    expect(hasPermission("national_admin", "canManageStaff")).toBe(true);
    expect(hasPermission("national_admin", "canViewAnalytics")).toBe(true);
    expect(hasPermission("national_admin", "canManageServices")).toBe(true);
    expect(hasPermission("national_admin", "canExportData")).toBe(true);
  });

  it("correctly identifies rank ordering", () => {
    expect(outranks("national_admin", "citizen")).toBe(true);
    expect(outranks("council_admin", "mtaa_officer")).toBe(true);
    expect(outranks("citizen", "mtaa_officer")).toBe(false);
    expect(outranks("mtaa_officer", "mtaa_officer")).toBe(false);
  });

  it("legacy role mapping preserves backwards compatibility", () => {
    expect(LEGACY_ROLE_MAP.citizen).toBe("citizen");
    expect(LEGACY_ROLE_MAP.staff).toBe("mtaa_officer");
    expect(LEGACY_ROLE_MAP.admin).toBe("council_admin");
  });

  it("gets roles at or above a level", () => {
    const councilUp = getRolesAtOrAbove("council");
    expect(councilUp).toContain("council_admin");
    expect(councilUp).toContain("regional_admin");
    expect(councilUp).toContain("national_admin");
    expect(councilUp).not.toContain("citizen");
  });

  it("provides bilingual role labels", () => {
    expect(getRoleLabel("citizen", "sw")).toBe("Raia");
    expect(getRoleLabel("citizen", "en")).toBe("Citizen");
    expect(getRoleLabel("mtaa_officer", "sw")).toBe("Afisa wa Mtaa");
    expect(getRoleLabel("national_admin", "en")).toBe("National Administrator");
  });
});

// ─── Council Architecture ───────────────────────────────
describe("Council Architecture — Scope Isolation", () => {
  it("citizen scope is self-only", () => {
    const scope = resolveUserScope({
      user_id: "u1",
      role: "citizen",
      active: true,
      assigned_at: "",
    });
    expect(scope.level).toBe("self");
    expect(scope.user_id).toBe("u1");
  });

  it("mtaa officer scope is street", () => {
    const scope = resolveUserScope({
      user_id: "u2",
      role: "mtaa_officer",
      region_id: "r1",
      council_id: "c1",
      ward_id: "w1",
      street_id: "s1",
      active: true,
      assigned_at: "",
    });
    expect(scope.level).toBe("street");
    expect(scope.street_id).toBe("s1");
  });

  it("ward officer scope is ward", () => {
    const scope = resolveUserScope({
      user_id: "u3",
      role: "ward_officer",
      region_id: "r1",
      council_id: "c1",
      ward_id: "w1",
      active: true,
      assigned_at: "",
    });
    expect(scope.level).toBe("ward");
    expect(scope.ward_id).toBe("w1");
  });

  it("council admin scope is council", () => {
    const scope = resolveUserScope({
      user_id: "u4",
      role: "council_admin",
      region_id: "r1",
      council_id: "c1",
      active: true,
      assigned_at: "",
    });
    expect(scope.level).toBe("council");
    expect(scope.council_id).toBe("c1");
  });

  it("national admin scope is national (no filters)", () => {
    const scope = resolveUserScope({
      user_id: "u6",
      role: "national_admin",
      active: true,
      assigned_at: "",
    });
    expect(scope.level).toBe("national");
    const filters = buildScopeFilters(scope);
    expect(Object.keys(filters)).toHaveLength(0);
  });

  it("builds correct scope filters", () => {
    expect(buildScopeFilters({ level: "self", user_id: "u1" })).toEqual({ user_id: "u1" });
    expect(buildScopeFilters({ level: "street", street_id: "s1" })).toEqual({ street_id: "s1" });
    expect(buildScopeFilters({ level: "ward", ward_id: "w1" })).toEqual({ ward_id: "w1" });
    expect(buildScopeFilters({ level: "council", council_id: "c1" })).toEqual({ council_id: "c1" });
    expect(buildScopeFilters({ level: "region", region_id: "r1" })).toEqual({ region_id: "r1" });
    expect(buildScopeFilters({ level: "national" })).toEqual({});
  });
});

// ─── Escalation Chain ───────────────────────────────────
describe("Escalation Chain", () => {
  it("mtaa officer escalates to ward officer", () => {
    const target = getEscalationTarget("mtaa_officer", { ward_id: "w1" });
    expect(target?.targetRole).toBe("ward_officer");
  });

  it("ward officer escalates to council admin", () => {
    const target = getEscalationTarget("ward_officer", { council_id: "c1" });
    expect(target?.targetRole).toBe("council_admin");
  });

  it("council admin escalates to regional admin", () => {
    const target = getEscalationTarget("council_admin", { region_id: "r1" });
    expect(target?.targetRole).toBe("regional_admin");
  });

  it("regional admin escalates to national admin", () => {
    const target = getEscalationTarget("regional_admin", {});
    expect(target?.targetRole).toBe("national_admin");
  });

  it("national admin cannot escalate further", () => {
    const target = getEscalationTarget("national_admin", {});
    expect(target).toBeNull();
  });

  it("citizen cannot escalate", () => {
    const target = getEscalationTarget("citizen", {});
    expect(target).toBeNull();
  });
});
