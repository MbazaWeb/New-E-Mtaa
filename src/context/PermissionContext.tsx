/**
 * SPRINT 4: Permission Context
 * ==============================
 * React context providing the current user's role, scope, and permission checks.
 * Wraps the app to make permissions available everywhere.
 */

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { SystemRole } from "@/config/roleMatrix";
import { ROLE_DEFINITIONS, getRoleLabel } from "@/config/roleMatrix";
import type { DataScope } from "@/config/councilArchitecture";
import { type Action, can, canOnResource, getAllowedActions, type PermissionContext as PermCtx } from "@/lib/permissionEngine";
import { buildPermissionContext } from "@/lib/scopedQuery";

// ─── Context Type ───────────────────────────────────────
interface PermissionContextType {
  /** Current user's system role */
  role: SystemRole;
  /** Current user's data scope */
  scope: DataScope;
  /** Role rank (1-6) */
  rank: number;
  /** Role display label */
  roleLabel: string;
  /** Full permission context (for query builders) */
  permCtx: PermCtx;

  /** Check if current user can perform an action */
  can: (action: Action) => boolean;

  /** Check if current user can act on a specific resource */
  canOn: (action: Action, resource: {
    user_id?: string;
    region_id?: string;
    council_id?: string;
    ward_id?: string;
    street_id?: string;
  }) => boolean;

  /** All actions the current user can perform */
  allowedActions: Action[];

  /** Quick checks */
  isStaff: boolean;      // mtaa_officer+
  isAdmin: boolean;      // council_admin+
  isNational: boolean;   // national_admin
}

const PermissionCtx = createContext<PermissionContextType | null>(null);

// ─── Provider ───────────────────────────────────────────
interface PermissionProviderProps {
  children: React.ReactNode;
  lang?: string;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  lang = "en",
}) => {
  const { user } = useAuth();

  const value = useMemo<PermissionContextType>(() => {
    if (!user) {
      // Not logged in — no permissions
      return {
        role: "citizen",
        scope: { level: "self" },
        rank: 1,
        roleLabel: getRoleLabel("citizen", lang),
        permCtx: { role: "citizen", scope: { level: "self" } },
        can: () => false,
        canOn: () => false,
        allowedActions: [],
        isStaff: false,
        isAdmin: false,
        isNational: false,
      };
    }

    const permCtx = buildPermissionContext(user as {
      id: string;
      role?: string;
      system_role?: string;
      region_id?: string;
      council_id?: string;
      ward_id?: string;
      ward_id_v2?: string;
      street_id?: string;
    });

    const roleDef = ROLE_DEFINITIONS[permCtx.role];

    return {
      role: permCtx.role,
      scope: permCtx.scope,
      rank: roleDef.rank,
      roleLabel: getRoleLabel(permCtx.role, lang),
      permCtx,
      can: (action: Action) => can(permCtx.role, action),
      canOn: (action, resource) => canOnResource(permCtx, action, resource),
      allowedActions: getAllowedActions(permCtx.role),
      isStaff: roleDef.rank >= 2,
      isAdmin: roleDef.rank >= 4,
      isNational: roleDef.rank >= 6,
    };
  }, [user, lang]);

  return <PermissionCtx.Provider value={value}>{children}</PermissionCtx.Provider>;
};

// ─── Hook ───────────────────────────────────────────────
export function usePermissions(): PermissionContextType {
  const ctx = useContext(PermissionCtx);
  if (!ctx) {
    // Fallback if provider not mounted (shouldn't happen)
    return {
      role: "citizen",
      scope: { level: "self" },
      rank: 1,
      roleLabel: "Citizen",
      permCtx: { role: "citizen", scope: { level: "self" } },
      can: () => false,
      canOn: () => false,
      allowedActions: [],
      isStaff: false,
      isAdmin: false,
      isNational: false,
    };
  }
  return ctx;
}

// ─── Guard Component ────────────────────────────────────
/**
 * Only renders children if the current user has the required permission.
 *
 * Usage:
 *   <PermissionGate action="manage_staff">
 *     <StaffManagementPanel />
 *   </PermissionGate>
 *
 *   <PermissionGate role="council_admin">
 *     <CouncilSettings />
 *   </PermissionGate>
 */
interface PermissionGateProps {
  children: React.ReactNode;
  /** Required action */
  action?: Action;
  /** Minimum role required */
  role?: SystemRole;
  /** Fallback to show when denied (default: nothing) */
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  action,
  role: minRole,
  fallback = null,
}) => {
  const { can: canDo, rank } = usePermissions();

  if (action && !canDo(action)) return <>{fallback}</>;

  if (minRole) {
    const minRank = ROLE_DEFINITIONS[minRole].rank;
    if (rank < minRank) return <>{fallback}</>;
  }

  return <>{children}</>;
};
