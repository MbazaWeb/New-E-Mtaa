/**
 * SPRINT 3: Location Validation & Utilities
 * ==========================================
 * Validates location hierarchy consistency and provides helpers.
 */

import type { LocationSelection } from "@/hooks/useLocationEngine";

// ─── Validation ─────────────────────────────────────────

export interface LocationValidationResult {
  valid: boolean;
  errors: string[];
  completeness: "none" | "partial" | "full";
}

/** Validate a location selection for completeness and consistency */
export function validateLocation(
  selection: LocationSelection,
  requiredLevel: "region" | "council" | "ward" | "street" = "ward",
): LocationValidationResult {
  const errors: string[] = [];

  // Check required fields based on level
  if (!selection.region_id) {
    errors.push("Region is required");
  }

  if (["council", "ward", "street"].includes(requiredLevel) && !selection.council_id) {
    errors.push("Council is required");
  }

  if (["ward", "street"].includes(requiredLevel) && !selection.ward_id) {
    errors.push("Ward is required");
  }

  if (requiredLevel === "street" && !selection.street_id) {
    errors.push("Street is required");
  }

  // Determine completeness
  const hasRegion = !!selection.region_id;
  const hasCouncil = !!selection.council_id;
  const hasWard = !!selection.ward_id;
  const hasStreet = !!selection.street_id;

  let completeness: "none" | "partial" | "full" = "none";
  if (hasRegion && hasCouncil && hasWard && hasStreet) {
    completeness = "full";
  } else if (hasRegion || hasCouncil || hasWard || hasStreet) {
    completeness = "partial";
  }

  return {
    valid: errors.length === 0,
    errors,
    completeness,
  };
}

// ─── Display Helpers ────────────────────────────────────

/** Format a location selection as a display string */
export function formatLocationPath(
  selection: LocationSelection,
  lang = "en",
): string {
  const parts: string[] = [];
  if (selection.street_name) parts.push(selection.street_name);
  if (selection.ward_name) parts.push(selection.ward_name);
  if (selection.council_name) parts.push(selection.council_name);
  if (selection.region_name) parts.push(selection.region_name);
  return parts.join(", ");
}

/** Format as breadcrumb with separator */
export function formatLocationBreadcrumb(
  selection: LocationSelection,
  separator = " › ",
): string {
  const parts: string[] = [];
  if (selection.region_name) parts.push(selection.region_name);
  if (selection.council_name) parts.push(selection.council_name);
  if (selection.ward_name) parts.push(selection.ward_name);
  if (selection.street_name) parts.push(selection.street_name);
  return parts.join(separator);
}

// ─── Location Code Parser ───────────────────────────────

/** Parse a street code to extract hierarchy info */
export function parseLocationCode(code: string): {
  region?: string;
  council?: string;
  ward?: string;
  street?: string;
} {
  const parts = code.split("-");
  if (parts.length >= 4) {
    return {
      region: parts[0],
      council: `${parts[0]}-${parts[1]}-${parts[2]}`,
      ward: `${parts[0]}-${parts[1]}`,
      street: code,
    };
  }
  if (parts.length === 3) {
    return { region: parts[0], council: code };
  }
  if (parts.length === 2) {
    return { region: parts[0], ward: code };
  }
  return { region: code };
}

// ─── Backfill Helper ────────────────────────────────────

/** Map legacy text locations to hierarchy IDs (for migration) */
export function matchTextToHierarchy(
  text: string,
  regions: { id: string; name: string }[],
  councils?: { id: string; name: string; region_id: string }[],
  wards?: { id: string; name: string; council_id: string }[],
): Partial<LocationSelection> {
  const lower = text.toLowerCase().trim();
  const result: Partial<LocationSelection> = {};

  // Try to match region
  const region = regions.find(
    (r) => lower.includes(r.name.toLowerCase()),
  );
  if (region) {
    result.region_id = region.id;
    result.region_name = region.name;
  }

  // Try to match council
  if (councils && result.region_id) {
    const council = councils
      .filter((c) => c.region_id === result.region_id)
      .find((c) => lower.includes(c.name.toLowerCase()));
    if (council) {
      result.council_id = council.id;
      result.council_name = council.name;
    }
  }

  // Try to match ward
  if (wards && result.council_id) {
    const ward = wards
      .filter((w) => w.council_id === result.council_id)
      .find((w) => lower.includes(w.name.toLowerCase()));
    if (ward) {
      result.ward_id = ward.id;
      result.ward_name = ward.name;
    }
  }

  return result;
}
