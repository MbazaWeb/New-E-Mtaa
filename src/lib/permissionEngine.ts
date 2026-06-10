/**
 * SPRINT 4: Permission Engine
 * ============================
 * Enterprise RBAC with scope-based access control.
 * Determines if a user can perform an action on a resource.
 */

import { ROLE_DEFINITIONS, type SystemRole } from "@/config/roleMatrix";
import { type DataScope, buildScopeFilters } from "@/config/councilArchitecture";

// ─── Action Types ───────────────────────────────────────
export const ACTIONS = {
  // Applications
  VIEW_APPLICATION: "view_application",
  CREATE_APPLICATION: "create_application",
  APPROVE_APPLICATION: "approve_application",
  REJECT_APPLICATION: "reject_application",
  ISSUE_DOCUMENT: "issue_document",
  ESCALATE_APPLICATION: "escalate_application",

  // Users / Staff
  VIEW_CITIZENS: "view_citizens",
  MANAGE_STAFF: "manage_staff",
  ASSIGN_ROLES: "assign_roles",

  // Analytics / Reports
  VIEW_ANALYTICS: "view_analytics",
  EXPORT_DATA: "export_data",
  VIEW_AUDIT_LOGS: "view_audit_logs",

  // Services / Config
  MANAGE_SERVICES: "manage_services",
  MANAGE_COUNCIL_CONFIG: "manage_council_config",
  MANAGE_LOCATIONS: "manage_locations",

  // System
  SYSTEM_SETTINGS: "system_settings",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

// ─── Permission Rules ───────────────────────────────────
/** Minimum role required for each action */
const ACTION_REQUIREMENTS: Record<Action, SystemRole> = {
  // Citizens can do these
  [ACTIONS.VIEW_APPLICATION]: "citizen",
  [ACTIONS.CREATE_APPLICATION]: "citizen",

  // Mtaa officers+
  [ACTIONS.APPROVE_APPLICATION]: "mtaa_officer",
  [ACTIONS.REJECT_APPLICATION]: "mtaa_officer",
  [ACTIONS.ISSUE_DOCUMENT]: "mtaa_officer",
  [ACTIONS.ESCALATE_APPLICATION]: "mtaa_officer",
  [ACTIONS.VIEW_CITIZENS]: "mtaa_officer",
  [ACTIONS.VIEW_ANALYTICS]: "mtaa_officer",
  [ACTIONS.EXPORT_DATA]: "mtaa_officer",

  // Ward officers+
  [ACTIONS.MANAGE_STAFF]: "ward_officer",
  [ACTIONS.ASSIGN_ROLES]: "ward_officer",

  // Council admins+
  [ACTIONS.MANAGE_SERVICES]: "council_admin",
  [ACTIONS.MANAGE_COUNCIL_CONFIG]: "council_admin",
  [ACTIONS.VIEW_AUDIT_LOGS]: "council_admin",
  [ACTIONS.MANAGE_LOCATIONS]: "council_admin",

  // National admin only
  [ACTIONS.SYSTEM_SETTINGS]: "national_admin",
};

// ─── Permission Checker ─────────────────────────────────

export interface PermissionContext {
  role: SystemRole;
  scope: DataScope;
}

/**
 * Check if a user can perform an action.
 * Does NOT check scope — only checks role-level permission.
 */
export function can(userRole: SystemRole, action: Action): boolean {
  const requiredRole = ACTION_REQUIREMENTS[action];
  if (!requiredRole) return false;

  const userRank = ROLE_DEFINITIONS[userRole].rank;
  const requiredRank = ROLE_DEFINITIONS[requiredRole].rank;

  return userRank >= requiredRank;
}

/**
 * Check if a user can perform an action on a specific resource.
 * Checks both role permission AND scope ownership.
 */
export function canOnResource(
  ctx: PermissionContext,
  action: Action,
  resource: {
    user_id?: string;
    region_id?: string;
    council_id?: string;
    ward_id?: string;
    street_id?: string;
  },
): boolean {
  // Step 1: Role check
  if (!can(ctx.role, action)) return false;

  // Step 2: Scope check — does the resource fall within user's scope?
  return isInScope(ctx.scope, resource);
}

/**
 * Check if a resource falls within a user's scope.
 */
export function isInScope(
  scope: DataScope,
  resource: {
    user_id?: string;
    region_id?: string;
    council_id?: string;
    ward_id?: string;
    street_id?: string;
  },
): boolean {
  switch (scope.level) {
    case "national":
      return true; // national sees everything

    case "region":
      return resource.region_id === scope.region_id;

    case "council":
      return resource.council_id === scope.council_id;

    case "ward":
      return resource.ward_id === scope.ward_id;

    case "street":
      return resource.street_id === scope.street_id;

    case "self":
      return resource.user_id === scope.user_id;

    default:
      return false;
  }
}

/**
 * Get all actions a role can perform.
 */
export function getAllowedActions(role: SystemRole): Action[] {
  return (Object.values(ACTIONS) as Action[]).filter((action) => can(role, action));
}

/**
 * Get the scope filter for Supabase queries.
 * Use this to apply multi-tenant isolation to any query.
 *
 * Usage:
 *   const filters = getScopeFilter(userCtx);
 *   let query = supabase.from("applications").select("*");
 *   Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
 */
export function getScopeFilter(ctx: PermissionContext): Record<string, string> {
  return buildScopeFilters(ctx.scope);
}
