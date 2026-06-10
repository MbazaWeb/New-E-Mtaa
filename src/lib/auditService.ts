/**
 * SPRINT 5: Audit Service
 * ========================
 * Government-grade auditing answering: Who? Did what? When? Where?
 *
 * Three audit layers:
 * 1. Activity Logs — action history (approve, reject, issue, etc.)
 * 2. Change Log    — before/after snapshots for data mutations
 * 3. Login History — authentication events
 */

import { supabase } from "@/lib/supabase";
import type { PermissionContext } from "./permissionEngine";

// ─── Activity Log ───────────────────────────────────────

export interface AuditEntry {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  council_id?: string;
  region_id?: string;
}

/**
 * Log an action to the audit trail.
 * Called from action handlers throughout the app.
 *
 * Usage:
 *   await audit.log({
 *     action: "approve_application",
 *     entity_type: "application",
 *     entity_id: appId,
 *     details: { status: "approved", reason: "Documents verified" }
 *   }, permCtx);
 */
export async function logActivity(
  entry: AuditEntry,
  ctx?: PermissionContext,
): Promise<void> {
  try {
    await supabase.from("activity_logs").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      action: entry.action,
      entity_type: entry.entity_type || null,
      entity_id: entry.entity_id || null,
      details: entry.details || {},
      council_id: entry.council_id || ctx?.scope.council_id || null,
      region_id: entry.region_id || ctx?.scope.region_id || null,
    });
  } catch {
    // Audit logging should never block the main action
  }
}

// ─── Change Tracking ────────────────────────────────────

/**
 * Record a data change with before/after snapshots.
 *
 * Usage:
 *   await audit.trackChange("applications", appId, "update",
 *     oldApp, newApp, "Status changed to approved");
 */
export async function trackChange(
  tableName: string,
  recordId: string,
  action: "insert" | "update" | "delete",
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null,
  reason?: string,
  ctx?: PermissionContext,
): Promise<void> {
  try {
    // Calculate which fields changed
    const changedFields: string[] = [];
    if (oldData && newData) {
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      for (const key of allKeys) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changedFields.push(key);
        }
      }
    }

    await supabase.from("change_log").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      table_name: tableName,
      record_id: recordId,
      action,
      old_data: oldData || null,
      new_data: newData || null,
      changed_fields: changedFields.length > 0 ? changedFields : null,
      reason: reason || null,
      council_id: ctx?.scope.council_id || null,
    });
  } catch {
    // Never block the main operation
  }
}

// ─── Login History ──────────────────────────────────────

export type LoginEvent =
  | "login"
  | "logout"
  | "token_refresh"
  | "password_change"
  | "failed_login"
  | "session_expired"
  | "forced_logout";

/**
 * Record a login/auth event.
 *
 * Usage:
 *   await audit.logLogin("login");
 *   await audit.logLogin("logout");
 */
export async function logLogin(
  event: LoginEvent,
  userId?: string,
): Promise<void> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;

    await supabase.from("login_history").insert({
      user_id: uid,
      event,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      device_info: {
        platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        language: typeof navigator !== "undefined" ? navigator.language : "unknown",
        screen: typeof screen !== "undefined"
          ? `${screen.width}x${screen.height}`
          : "unknown",
      },
    });
  } catch {
    // Never block auth flow
  }
}

// ─── Compliance Queries ─────────────────────────────────

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  councilId?: string;
  limit?: number;
}

/**
 * Fetch audit log entries with filters.
 * For compliance reporting and admin review.
 */
export async function queryAuditLog(
  filters: AuditFilter,
): Promise<{
  data: {
    id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: Record<string, unknown>;
    user_id: string;
    created_at: string;
    user?: { first_name: string; last_name: string; system_role: string };
  }[];
  count: number;
}> {
  let query = supabase
    .from("activity_logs")
    .select(
      "id, action, entity_type, entity_id, details, user_id, created_at, council_id, users:user_id(first_name, last_name, system_role, role)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters.startDate) query = query.gte("created_at", filters.startDate);
  if (filters.endDate) query = query.lte("created_at", filters.endDate);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.councilId) query = query.eq("council_id", filters.councilId);

  query = query.limit(filters.limit || 100);

  const { data, count } = await query;
  return {
    data: (data || []) as typeof data & { user?: { first_name: string; last_name: string; system_role: string } }[],
    count: count || 0,
  };
}

/**
 * Fetch login history for a user or all users.
 */
export async function queryLoginHistory(
  filters: { userId?: string; event?: LoginEvent; limit?: number },
): Promise<{
  id: string;
  user_id: string;
  event: string;
  user_agent: string | null;
  device_info: Record<string, unknown>;
  created_at: string;
}[]> {
  let query = supabase
    .from("login_history")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.event) query = query.eq("event", filters.event);

  const { data } = await query.limit(filters.limit || 50);
  return (data || []) as {
    id: string; user_id: string; event: string;
    user_agent: string | null; device_info: Record<string, unknown>;
    created_at: string;
  }[];
}

/**
 * Fetch change log entries.
 */
export async function queryChangeLog(
  filters: { tableName?: string; recordId?: string; userId?: string; limit?: number },
): Promise<{
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  reason: string | null;
  user_id: string;
  created_at: string;
}[]> {
  let query = supabase
    .from("change_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.tableName) query = query.eq("table_name", filters.tableName);
  if (filters.recordId) query = query.eq("record_id", filters.recordId);
  if (filters.userId) query = query.eq("user_id", filters.userId);

  const { data } = await query.limit(filters.limit || 50);
  return (data || []) as {
    id: string; table_name: string; record_id: string; action: string;
    old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null;
    changed_fields: string[] | null; reason: string | null;
    user_id: string; created_at: string;
  }[];
}

// ─── Compliance Report Generator ────────────────────────

export interface ComplianceReport {
  period: { start: string; end: string };
  summary: {
    totalActions: number;
    totalLogins: number;
    totalChanges: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
  };
  generatedAt: string;
  generatedBy: string;
}

/**
 * Generate a compliance report for a given period.
 */
export async function generateComplianceReport(
  startDate: string,
  endDate: string,
): Promise<ComplianceReport> {
  // Activity counts
  const { count: totalActions } = await supabase
    .from("activity_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // Login counts
  const { count: totalLogins } = await supabase
    .from("login_history")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // Change counts
  const { count: totalChanges } = await supabase
    .from("change_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // Unique users
  const { data: activityData } = await supabase
    .from("activity_logs")
    .select("user_id, action")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const uniqueUsers = new Set((activityData || []).map((a) => a.user_id)).size;

  // Top actions
  const actionCounts: Record<string, number> = {};
  (activityData || []).forEach((a) => {
    actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
  });
  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const user = (await supabase.auth.getUser()).data.user;

  return {
    period: { start: startDate, end: endDate },
    summary: {
      totalActions: totalActions || 0,
      totalLogins: totalLogins || 0,
      totalChanges: totalChanges || 0,
      uniqueUsers,
      topActions,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: user?.id || "system",
  };
}

// ─── Convenience Export ─────────────────────────────────
export const audit = {
  log: logActivity,
  trackChange,
  logLogin,
  queryAuditLog,
  queryLoginHistory,
  queryChangeLog,
  generateReport: generateComplianceReport,
};
