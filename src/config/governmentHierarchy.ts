/**
 * SPRINT 2: Government Hierarchy Configuration
 * =============================================
 * Tanzania's administrative structure:
 *   National → Region → Council (Halmashauri) → Ward (Kata) → Street (Mtaa/Kijiji)
 *
 * This file defines the COMPLETE hierarchy model for multi-halmashauri support.
 */

// ─── Administrative Levels ──────────────────────────────
export const ADMIN_LEVELS = [
  "national",
  "region",
  "council",
  "ward",
  "street",
] as const;

export type AdminLevel = (typeof ADMIN_LEVELS)[number];

// ─── Council Types (Tanzania) ───────────────────────────
export const COUNCIL_TYPES = [
  "city_council",      // Halmashauri ya Jiji (Dar, Dodoma, etc.)
  "municipal_council", // Halmashauri ya Manispaa
  "town_council",      // Halmashauri ya Mji
  "district_council",  // Halmashauri ya Wilaya
] as const;

export type CouncilType = (typeof COUNCIL_TYPES)[number];

export const COUNCIL_TYPE_LABELS: Record<CouncilType, { sw: string; en: string }> = {
  city_council:      { sw: "Halmashauri ya Jiji",    en: "City Council" },
  municipal_council: { sw: "Halmashauri ya Manispaa", en: "Municipal Council" },
  town_council:      { sw: "Halmashauri ya Mji",     en: "Town Council" },
  district_council:  { sw: "Halmashauri ya Wilaya",  en: "District Council" },
};

// ─── Government Hierarchy Interfaces ────────────────────
export interface NationalLevel {
  level: "national";
  name: string; // "Jamhuri ya Muungano wa Tanzania"
}

export interface Region {
  id: string;
  code: string;        // e.g. "DSM", "ARU", "DDM"
  name: string;        // e.g. "Dar es Salaam"
  name_sw: string;     // Swahili name
  active: boolean;
}

export interface Council {
  id: string;
  region_id: string;
  code: string;        // e.g. "ILA-MC", "KIN-DC"
  name: string;        // e.g. "Ilala Municipal Council"
  name_sw: string;
  council_type: CouncilType;
  active: boolean;
  // Operational metadata
  established_year?: number;
  population?: number;
  area_sq_km?: number;
}

export interface Ward {
  id: string;
  council_id: string;
  code: string;        // e.g. "KARI-01"
  name: string;        // e.g. "Kariakoo"
  name_sw: string;
  active: boolean;
}

export interface Street {
  id: string;
  ward_id: string;
  code: string;        // e.g. "KARI-01-MKU"
  name: string;        // e.g. "Mkunguni"
  name_sw: string;
  active: boolean;
  mtaa_type: "mtaa" | "kijiji" | "kitongoji"; // Urban street / Village / Sub-village
}

// ─── Hierarchy Path ─────────────────────────────────────
/** Full path from national down to street */
export interface HierarchyPath {
  region_id?: string;
  region_name?: string;
  council_id?: string;
  council_name?: string;
  ward_id?: string;
  ward_name?: string;
  street_id?: string;
  street_name?: string;
}

/** Resolve admin level from a hierarchy path */
export function resolveAdminLevel(path: HierarchyPath): AdminLevel {
  if (path.street_id) return "street";
  if (path.ward_id) return "ward";
  if (path.council_id) return "council";
  if (path.region_id) return "region";
  return "national";
}

// ─── Tanzania Regions (31) ──────────────────────────────
export const TANZANIA_REGIONS: { code: string; name: string; name_sw: string }[] = [
  { code: "ARU", name: "Arusha", name_sw: "Arusha" },
  { code: "DSM", name: "Dar es Salaam", name_sw: "Dar es Salaam" },
  { code: "DDM", name: "Dodoma", name_sw: "Dodoma" },
  { code: "GTA", name: "Geita", name_sw: "Geita" },
  { code: "IRG", name: "Iringa", name_sw: "Iringa" },
  { code: "KGR", name: "Kagera", name_sw: "Kagera" },
  { code: "KAT", name: "Katavi", name_sw: "Katavi" },
  { code: "KGM", name: "Kigoma", name_sw: "Kigoma" },
  { code: "KLM", name: "Kilimanjaro", name_sw: "Kilimanjaro" },
  { code: "KDW", name: "Kindondwe", name_sw: "Kindondwe" },
  { code: "LND", name: "Lindi", name_sw: "Lindi" },
  { code: "MYR", name: "Manyara", name_sw: "Manyara" },
  { code: "MRA", name: "Mara", name_sw: "Mara" },
  { code: "MBY", name: "Mbeya", name_sw: "Mbeya" },
  { code: "MRG", name: "Morogoro", name_sw: "Morogoro" },
  { code: "MTW", name: "Mtwara", name_sw: "Mtwara" },
  { code: "MWZ", name: "Mwanza", name_sw: "Mwanza" },
  { code: "NJB", name: "Njombe", name_sw: "Njombe" },
  { code: "PWN", name: "Pwani", name_sw: "Pwani" },
  { code: "RKW", name: "Rukwa", name_sw: "Rukwa" },
  { code: "RVR", name: "Ruvuma", name_sw: "Ruvuma" },
  { code: "SHY", name: "Shinyanga", name_sw: "Shinyanga" },
  { code: "SMK", name: "Simiyu", name_sw: "Simiyu" },
  { code: "SNG", name: "Singida", name_sw: "Singida" },
  { code: "SHM", name: "Songwe", name_sw: "Songwe" },
  { code: "TBR", name: "Tabora", name_sw: "Tabora" },
  { code: "TNG", name: "Tanga", name_sw: "Tanga" },
  // Zanzibar
  { code: "KSK", name: "Kaskazini Unguja", name_sw: "Kaskazini Unguja" },
  { code: "KSP", name: "Kusini Unguja", name_sw: "Kusini Unguja" },
  { code: "MJU", name: "Mjini Magharibi", name_sw: "Mjini Magharibi" },
  { code: "KPB", name: "Kaskazini Pemba", name_sw: "Kaskazini Pemba" },
  { code: "KSB", name: "Kusini Pemba", name_sw: "Kusini Pemba" },
];

// ─── Council Code Generator ─────────────────────────────
export function generateCouncilCode(regionCode: string, councilName: string, type: CouncilType): string {
  const prefix = regionCode;
  const suffix = councilName.substring(0, 3).toUpperCase();
  const typeCode = type === "city_council" ? "CC" : type === "municipal_council" ? "MC" : type === "town_council" ? "TC" : "DC";
  return `${prefix}-${suffix}-${typeCode}`;
}
