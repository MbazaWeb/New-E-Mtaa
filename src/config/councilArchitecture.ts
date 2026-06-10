/**
 * SPRINT 2: Council Architecture — Multi-Tenant Isolation
 * ========================================================
 * Every data record belongs to a council. Officers only see data
 * from their assigned scope. This file defines the isolation model.
 */

import type { SystemRole } from "./roleMatrix";
import type { AdminLevel, HierarchyPath } from "./governmentHierarchy";
import { ROLE_DEFINITIONS } from "./roleMatrix";

// ─── User Assignment ────────────────────────────────────
/** A user's assignment to a specific point in the hierarchy */
export interface UserAssignment {
  user_id: string;
  role: SystemRole;
  // Scope assignment (set based on role level)
  region_id?: string;
  council_id?: string;
  ward_id?: string;
  street_id?: string;
  // Metadata
  assigned_at: string;
  assigned_by?: string;
  active: boolean;
}

// ─── Scope Resolution ───────────────────────────────────
/** Determine the data scope for a user based on their role + assignment */
export function resolveUserScope(assignment: UserAssignment): DataScope {
  const roleDef = ROLE_DEFINITIONS[assignment.role];

  switch (roleDef.scope) {
    case "national":
      return { level: "national" };
    case "region":
      return { level: "region", region_id: assignment.region_id! };
    case "council":
      return {
        level: "council",
        region_id: assignment.region_id!,
        council_id: assignment.council_id!,
      };
    case "ward":
      return {
        level: "ward",
        region_id: assignment.region_id!,
        council_id: assignment.council_id!,
        ward_id: assignment.ward_id!,
      };
    case "street":
      if (assignment.role === "citizen") {
        return { level: "self", user_id: assignment.user_id };
      }
      return {
        level: "street",
        region_id: assignment.region_id!,
        council_id: assignment.council_id!,
        ward_id: assignment.ward_id!,
        street_id: assignment.street_id!,
      };
  }
}

export interface DataScope {
  level: AdminLevel | "self";
  user_id?: string;
  region_id?: string;
  council_id?: string;
  ward_id?: string;
  street_id?: string;
}

// ─── Scope-Based Query Builder ──────────────────────────
/**
 * Build Supabase query filters based on user's scope.
 * This is the core of multi-tenant isolation.
 *
 * Usage:
 *   let query = supabase.from("applications").select("*");
 *   query = applyScopeFilter(query, userScope, "council_id", "ward_id", "street_id");
 */
export function buildScopeFilters(scope: DataScope): Record<string, string> {
  const filters: Record<string, string> = {};

  switch (scope.level) {
    case "self":
      filters["user_id"] = scope.user_id!;
      break;
    case "street":
      filters["street_id"] = scope.street_id!;
      break;
    case "ward":
      filters["ward_id"] = scope.ward_id!;
      break;
    case "council":
      filters["council_id"] = scope.council_id!;
      break;
    case "region":
      filters["region_id"] = scope.region_id!;
      break;
    case "national":
      // No filters — sees everything
      break;
  }

  return filters;
}

// ─── Data Ownership ─────────────────────────────────────
/**
 * Every record in the system has an ownership chain:
 * application.council_id → council.region_id → region
 *
 * When a citizen submits an application, the system automatically
 * assigns council_id, ward_id, street_id based on the citizen's
 * registered address.
 */
export interface OwnedRecord {
  id: string;
  user_id: string;       // who created it
  region_id: string;     // which region
  council_id: string;    // which council (halmashauri)
  ward_id: string;       // which ward (kata)
  street_id?: string;    // which street (mtaa)
  created_at: string;
}

// ─── Council Isolation Rules ────────────────────────────
/**
 * ISOLATION RULES:
 *
 * 1. DATA ISOLATION
 *    - Applications, documents, payments, messages are tagged with council_id
 *    - Officers can ONLY query records matching their scope
 *    - RLS policies enforce this at the database level
 *
 * 2. STAFF ISOLATION
 *    - Staff accounts belong to one council
 *    - Council admins manage staff within their council only
 *    - Regional admins can view staff across councils in their region
 *
 * 3. CITIZEN MOBILITY
 *    - Citizens register in one council but can be referenced in others
 *    - Cross-council agreements (e.g. land sales) link to both councils
 *    - Citizens relocating: update address → new council_id assignment
 *
 * 4. SERVICE ISOLATION
 *    - Each council can enable/disable services
 *    - Fee schedules can vary by council
 *    - Workflow approval chains are council-specific
 *
 * 5. REPORTING ISOLATION
 *    - Analytics aggregate by council → ward → street
 *    - Regional admins see cross-council comparisons
 *    - National admins see full national aggregation
 */

// ─── Cross-Council References ───────────────────────────
/** For records that span multiple councils (e.g. land disputes on borders) */
export interface CrossCouncilReference {
  primary_council_id: string;
  secondary_council_id: string;
  reference_type: "agreement" | "dispute" | "transfer";
  application_id: string;
}

// ─── Escalation Chain ───────────────────────────────────
/**
 * Escalation follows the hierarchy:
 * Street → Ward → Council → Region → National
 *
 * Each level can escalate to the next if they cannot resolve.
 */
export function getEscalationTarget(
  currentRole: SystemRole,
  currentPath: HierarchyPath,
): { targetRole: SystemRole; targetPath: Partial<HierarchyPath> } | null {
  switch (currentRole) {
    case "mtaa_officer":
      return {
        targetRole: "ward_officer",
        targetPath: { ward_id: currentPath.ward_id },
      };
    case "ward_officer":
      return {
        targetRole: "council_admin",
        targetPath: { council_id: currentPath.council_id },
      };
    case "council_admin":
      return {
        targetRole: "regional_admin",
        targetPath: { region_id: currentPath.region_id },
      };
    case "regional_admin":
      return {
        targetRole: "national_admin",
        targetPath: {},
      };
    default:
      return null; // national_admin or citizen can't escalate
  }
}
