/**
 * SPRINT 2: Migration Roadmap
 * ===========================
 * Step-by-step plan to migrate from single-ward to national multi-halmashauri.
 *
 * CURRENT STATE:
 * - Single ward system (one set of applications, one admin)
 * - Roles: citizen / staff / admin
 * - Location: flat strings (ward, district, region as text fields)
 * - No council isolation
 *
 * TARGET STATE:
 * - National platform (31 regions, 185+ councils, 3,900+ wards, 12,000+ streets)
 * - Roles: citizen / mtaa_officer / ward_officer / council_admin / regional_admin / national_admin
 * - Location: hierarchical (region_id → council_id → ward_id → street_id)
 * - Full council isolation via RLS
 */

export const MIGRATION_ROADMAP = {
  phases: [
    {
      phase: 1,
      name: "Schema Extension",
      sprint: "Sprint 2",
      status: "current",
      tasks: [
        "Create regions, councils, wards, streets tables",
        "Create staff_assignments table",
        "Create council_services table",
        "Add council_id, ward_id_v2, street_id, region_id to applications",
        "Add council_id, ward_id_v2, street_id, system_role to users",
        "Add RLS policies for all new tables",
        "Create get_user_scope() function",
      ],
    },
    {
      phase: 2,
      name: "Data Seeding",
      sprint: "Sprint 3",
      status: "upcoming",
      tasks: [
        "Seed all 31 regions",
        "Seed pilot council(s) with wards + streets",
        "Build location selector components",
        "Map existing text locations to new hierarchy IDs",
        "Backfill existing applications with council_id + ward_id_v2",
        "Backfill existing users with council_id + ward_id_v2",
      ],
    },
    {
      phase: 3,
      name: "Role Migration",
      sprint: "Sprint 4",
      status: "upcoming",
      tasks: [
        "Migrate role='staff' → system_role='mtaa_officer'",
        "Migrate role='admin' → system_role='council_admin'",
        "Create staff_assignments for all existing staff",
        "Build role assignment UI for council admins",
        "Update ProtectedRoute to use system_role",
        "Update all permission checks to use roleMatrix",
      ],
    },
    {
      phase: 4,
      name: "Scope Enforcement",
      sprint: "Sprint 4",
      status: "upcoming",
      tasks: [
        "Update all Supabase queries to include scope filters",
        "Update RLS policies to enforce council isolation",
        "Update dashboards to scope data by user assignment",
        "Test: Mtaa officer cannot see other street's data",
        "Test: Council admin sees all wards in their council",
        "Test: Regional admin sees all councils in their region",
      ],
    },
    {
      phase: 5,
      name: "UI Adaptation",
      sprint: "Sprint 5+",
      status: "future",
      tasks: [
        "Add council context to all page headers",
        "Update sidebar to show council name",
        "Add council switcher for regional/national admins",
        "Update analytics to aggregate by council/region",
        "Update PDF documents with council letterhead",
        "Build national dashboard for PMO-RALG",
      ],
    },
  ],

  // Backward compatibility strategy
  compatibility: {
    approach: "Additive migration — new columns and tables, no breaking changes",
    details: [
      "New columns are nullable → existing code continues to work",
      "Old role values (citizen/staff/admin) still recognized via LEGACY_ROLE_MAP",
      "Existing RLS policies remain → new policies are additional",
      "system_role defaults to 'citizen' → existing users unaffected",
      "Applications without council_id are visible to national admins",
    ],
  },

  // Risk mitigation
  risks: [
    {
      risk: "Data loss during backfill",
      mitigation: "Backfill is additive (new columns), never deletes existing data",
    },
    {
      risk: "Existing staff locked out after role migration",
      mitigation: "LEGACY_ROLE_MAP ensures old roles still work during transition",
    },
    {
      risk: "Performance with 12,000+ streets",
      mitigation: "Indexed lookups, cascading selects (region→council→ward→street)",
    },
    {
      risk: "Cross-council data leaks",
      mitigation: "RLS enforced at database level — client code cannot bypass",
    },
  ],
} as const;
