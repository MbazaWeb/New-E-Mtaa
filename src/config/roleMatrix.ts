/**
 * SPRINT 2: Role Matrix & Permission Architecture
 * ================================================
 * 6-tier role hierarchy for national multi-halmashauri platform.
 *
 * Each role has a SCOPE that limits what data they can see/modify.
 * Higher roles inherit lower-role permissions within their scope.
 */

import type { AdminLevel } from "./governmentHierarchy";

// ─── Role Definitions ───────────────────────────────────
export const SYSTEM_ROLES = [
  "citizen",
  "mtaa_officer",
  "ward_officer",
  "council_admin",
  "regional_admin",
  "national_admin",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

/** Legacy role mapping (existing system → new roles) */
export const LEGACY_ROLE_MAP: Record<string, SystemRole> = {
  citizen: "citizen",
  staff: "mtaa_officer",    // existing staff → mtaa_officer
  admin: "council_admin",   // existing admin → council_admin
};

export interface RoleDefinition {
  role: SystemRole;
  level: AdminLevel;
  title: { sw: string; en: string };
  description: { sw: string; en: string };
  scope: AdminLevel; // data visibility scope
  rank: number;      // hierarchy rank (1=lowest, 6=highest)
  canApprove: boolean;
  canIssue: boolean;
  canManageStaff: boolean;
  canViewAnalytics: boolean;
  canManageServices: boolean;
  canExportData: boolean;
  maxEscalationLevel: AdminLevel;
}

export const ROLE_DEFINITIONS: Record<SystemRole, RoleDefinition> = {
  citizen: {
    role: "citizen",
    level: "street",
    title: { sw: "Raia", en: "Citizen" },
    description: {
      sw: "Mwananchi anayeomba huduma za serikali ya mtaa",
      en: "Citizen applying for local government services",
    },
    scope: "street", // can only see own data
    rank: 1,
    canApprove: false,
    canIssue: false,
    canManageStaff: false,
    canViewAnalytics: false,
    canManageServices: false,
    canExportData: false,
    maxEscalationLevel: "ward",
  },

  mtaa_officer: {
    role: "mtaa_officer",
    level: "street",
    title: { sw: "Afisa wa Mtaa", en: "Mtaa Officer" },
    description: {
      sw: "Mtendaji wa Mtaa — anashughulikia maombi ya raia wa mtaa husika",
      en: "Street Executive Officer — handles citizen applications in their street",
    },
    scope: "street", // sees data from their assigned street only
    rank: 2,
    canApprove: true,
    canIssue: true,
    canManageStaff: false,
    canViewAnalytics: true,
    canManageServices: false,
    canExportData: true,
    maxEscalationLevel: "ward",
  },

  ward_officer: {
    role: "ward_officer",
    level: "ward",
    title: { sw: "Afisa Kata", en: "Ward Officer" },
    description: {
      sw: "Afisa Mtendaji wa Kata — anasimamia mitaa yote ya kata husika",
      en: "Ward Executive Officer — supervises all streets in their ward",
    },
    scope: "ward", // sees all streets in their ward
    rank: 3,
    canApprove: true,
    canIssue: true,
    canManageStaff: true,
    canViewAnalytics: true,
    canManageServices: false,
    canExportData: true,
    maxEscalationLevel: "council",
  },

  council_admin: {
    role: "council_admin",
    level: "council",
    title: { sw: "Msimamizi wa Halmashauri", en: "Council Administrator" },
    description: {
      sw: "Mkurugenzi wa Halmashauri — anasimamia kata na mitaa yote ya halmashauri",
      en: "Council Director — manages all wards and streets in the council",
    },
    scope: "council", // sees all wards in their council
    rank: 4,
    canApprove: true,
    canIssue: true,
    canManageStaff: true,
    canViewAnalytics: true,
    canManageServices: true,
    canExportData: true,
    maxEscalationLevel: "region",
  },

  regional_admin: {
    role: "regional_admin",
    level: "region",
    title: { sw: "Msimamizi wa Mkoa", en: "Regional Administrator" },
    description: {
      sw: "Katibu Tawala wa Mkoa — anasimamia halmashauri zote za mkoa",
      en: "Regional Administrative Secretary — oversees all councils in the region",
    },
    scope: "region", // sees all councils in their region
    rank: 5,
    canApprove: true,
    canIssue: true,
    canManageStaff: true,
    canViewAnalytics: true,
    canManageServices: true,
    canExportData: true,
    maxEscalationLevel: "national",
  },

  national_admin: {
    role: "national_admin",
    level: "national",
    title: { sw: "Msimamizi wa Taifa", en: "National Administrator" },
    description: {
      sw: "PMO-RALG / TAMISEMI — anasimamia mfumo mzima wa kitaifa",
      en: "PMO-RALG / TAMISEMI — manages the entire national system",
    },
    scope: "national", // sees everything
    rank: 6,
    canApprove: true,
    canIssue: true,
    canManageStaff: true,
    canViewAnalytics: true,
    canManageServices: true,
    canExportData: true,
    maxEscalationLevel: "national",
  },
};

// ─── Permission Check Utilities ─────────────────────────

/** Check if a role outranks another */
export function outranks(a: SystemRole, b: SystemRole): boolean {
  return ROLE_DEFINITIONS[a].rank > ROLE_DEFINITIONS[b].rank;
}

/** Check if a role has a specific permission */
export function hasPermission(
  role: SystemRole,
  permission: keyof Pick<
    RoleDefinition,
    "canApprove" | "canIssue" | "canManageStaff" | "canViewAnalytics" | "canManageServices" | "canExportData"
  >,
): boolean {
  return ROLE_DEFINITIONS[role][permission];
}

/** Get all roles at or above a given level */
export function getRolesAtOrAbove(level: AdminLevel): SystemRole[] {
  const levelRank: Record<AdminLevel, number> = {
    street: 1,
    ward: 2,
    council: 3,
    region: 4,
    national: 5,
  };
  const minRank = levelRank[level];
  return SYSTEM_ROLES.filter((r) => {
    const rl = ROLE_DEFINITIONS[r].level;
    return levelRank[rl] >= minRank;
  });
}

/** Get display label for a role */
export function getRoleLabel(role: SystemRole, lang: string): string {
  const def = ROLE_DEFINITIONS[role];
  return lang === "sw" ? def.title.sw : def.title.en;
}

// ─── Permission Matrix (readable) ───────────────────────
/**
 * PERMISSION MATRIX:
 * ┌───────────────────┬────────┬──────┬───────┬──────────┬──────────┬────────────┬────────┐
 * │ Role              │ Scope  │ Rank │ Appr. │ Issue    │ Staff    │ Analytics  │ Export │
 * ├───────────────────┼────────┼──────┼───────┼──────────┼──────────┼────────────┼────────┤
 * │ Citizen           │ Self   │  1   │  ✗    │  ✗       │  ✗       │  ✗         │  ✗     │
 * │ Mtaa Officer      │ Street │  2   │  ✓    │  ✓       │  ✗       │  ✓         │  ✓     │
 * │ Ward Officer      │ Ward   │  3   │  ✓    │  ✓       │  ✓       │  ✓         │  ✓     │
 * │ Council Admin     │ Council│  4   │  ✓    │  ✓       │  ✓       │  ✓         │  ✓     │
 * │ Regional Admin    │ Region │  5   │  ✓    │  ✓       │  ✓       │  ✓         │  ✓     │
 * │ National Admin    │ All    │  6   │  ✓    │  ✓       │  ✓       │  ✓         │  ✓     │
 * └───────────────────┴────────┴──────┴───────┴──────────┴──────────┴────────────┴────────┘
 *
 * SCOPE ISOLATION:
 * - National Admin → all records in all regions
 * - Regional Admin → only records in their assigned region
 * - Council Admin  → only records in their assigned council
 * - Ward Officer   → only records in their assigned ward
 * - Mtaa Officer   → only records in their assigned street
 * - Citizen        → only their own records
 */
