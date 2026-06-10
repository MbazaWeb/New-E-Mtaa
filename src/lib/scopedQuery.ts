/**
 * SPRINT 4: Scoped Query Builder
 * ================================
 * Wraps Supabase queries to enforce multi-tenant data isolation.
 * Every query goes through this to ensure council isolation.
 */

import { supabase } from "@/lib/supabase";
import type { DataScope } from "@/config/councilArchitecture";
import type { SystemRole } from "@/config/roleMatrix";
import type { PermissionContext } from "./permissionEngine";
import { getScopeFilter } from "./permissionEngine";

type SupabaseQuery = ReturnType<typeof supabase.from>;

// ─── Scoped Select ──────────────────────────────────────

/**
 * Create a scoped SELECT query.
 * Automatically applies scope filters based on user's role + assignment.
 *
 * Usage:
 *   const { data } = await scopedSelect(userCtx, "applications", "*, users:user_id(first_name)")
 *   // → Council admin only sees applications in their council
 *   // → National admin sees all applications
 */
export async function scopedSelect<T = Record<string, unknown>>(
  ctx: PermissionContext,
  table: string,
  select = "*",
  options?: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    additionalFilters?: Record<string, string | number | boolean>;
  },
): Promise<{ data: T[] | null; error: unknown }> {
  let query = supabase.from(table).select(select);

  // Apply scope filters
  const filters = getScopeFilter(ctx);
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value) as typeof query;
  }

  // Apply additional filters
  if (options?.additionalFilters) {
    for (const [key, value] of Object.entries(options.additionalFilters)) {
      query = query.eq(key, value) as typeof query;
    }
  }

  // Apply ordering
  if (options?.orderBy) {
    query = query.order(options.orderBy, {
      ascending: options.ascending ?? false,
    }) as typeof query;
  }

  // Apply limit
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  const { data, error } = await query;
  return { data: data as T[] | null, error };
}

/**
 * Create a scoped COUNT query.
 */
export async function scopedCount(
  ctx: PermissionContext,
  table: string,
  additionalFilters?: Record<string, string | number | boolean>,
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  const filters = getScopeFilter(ctx);
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value) as typeof query;
  }

  if (additionalFilters) {
    for (const [key, value] of Object.entries(additionalFilters)) {
      query = query.eq(key, value) as typeof query;
    }
  }

  const { count } = await query;
  return count || 0;
}

// ─── Scoped Insert ──────────────────────────────────────

/**
 * Insert a record with automatic scope tagging.
 * Adds council_id, ward_id_v2, street_id, region_id from user's scope.
 */
export async function scopedInsert<T extends Record<string, unknown>>(
  ctx: PermissionContext,
  table: string,
  record: T,
): Promise<{ data: T | null; error: unknown }> {
  // Auto-tag record with hierarchy from user's scope
  const tagged = {
    ...record,
    ...(ctx.scope.region_id && { region_id: ctx.scope.region_id }),
    ...(ctx.scope.council_id && { council_id: ctx.scope.council_id }),
    ...(ctx.scope.ward_id && { ward_id_v2: ctx.scope.ward_id }),
    ...(ctx.scope.street_id && { street_id: ctx.scope.street_id }),
  };

  const { data, error } = await supabase.from(table).insert(tagged).select().single();
  return { data: data as T | null, error };
}

// ─── Scope Context Builder ──────────────────────────────

/**
 * Build a PermissionContext from the current user's profile.
 * Call once on login / app mount.
 */
export function buildPermissionContext(user: {
  id: string;
  role?: string;
  system_role?: string;
  region_id?: string;
  council_id?: string;
  ward_id?: string;
  ward_id_v2?: string;
  street_id?: string;
}): PermissionContext {
  const role = (user.system_role || user.role || "citizen") as SystemRole;

  // Map scope based on role
  let scope: DataScope;
  switch (role) {
    case "national_admin":
      scope = { level: "national" };
      break;
    case "regional_admin":
      scope = { level: "region", region_id: user.region_id };
      break;
    case "council_admin":
      scope = { level: "council", region_id: user.region_id, council_id: user.council_id };
      break;
    case "ward_officer":
      scope = { level: "ward", region_id: user.region_id, council_id: user.council_id, ward_id: user.ward_id_v2 || user.ward_id };
      break;
    case "mtaa_officer":
      scope = { level: "street", region_id: user.region_id, council_id: user.council_id, ward_id: user.ward_id_v2 || user.ward_id, street_id: user.street_id };
      break;
    default:
      scope = { level: "self", user_id: user.id };
  }

  return { role, scope };
}
