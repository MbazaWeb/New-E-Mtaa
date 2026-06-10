import { describe, it, expect } from "vitest";
import {
  validateLocation,
  formatLocationPath,
  formatLocationBreadcrumb,
  parseLocationCode,
  matchTextToHierarchy,
} from "../lib/locationValidation";

// ─── Location Validation ────────────────────────────────
describe("Location Validation", () => {
  it("validates complete location (full)", () => {
    const result = validateLocation({
      region_id: "r1", region_name: "Dar es Salaam",
      council_id: "c1", council_name: "Ilala MC",
      ward_id: "w1", ward_name: "Kariakoo",
      street_id: "s1", street_name: "Mkunguni",
    }, "street");
    expect(result.valid).toBe(true);
    expect(result.completeness).toBe("full");
    expect(result.errors).toHaveLength(0);
  });

  it("rejects incomplete location when street required", () => {
    const result = validateLocation({
      region_id: "r1", region_name: "Dar es Salaam",
      council_id: "c1", council_name: "Ilala MC",
      ward_id: "w1", ward_name: "Kariakoo",
    }, "street");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Street is required");
    expect(result.completeness).toBe("partial");
  });

  it("accepts ward-level when only ward required", () => {
    const result = validateLocation({
      region_id: "r1", region_name: "Dar es Salaam",
      council_id: "c1", council_name: "Ilala MC",
      ward_id: "w1", ward_name: "Kariakoo",
    }, "ward");
    expect(result.valid).toBe(true);
  });

  it("returns none completeness for empty selection", () => {
    const result = validateLocation({});
    expect(result.completeness).toBe("none");
    expect(result.valid).toBe(false);
  });

  it("requires region at minimum", () => {
    const result = validateLocation({}, "region");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Region is required");
  });
});

// ─── Format Location ────────────────────────────────────
describe("Location Formatting", () => {
  const loc = {
    region_name: "Dar es Salaam",
    council_name: "Ilala MC",
    ward_name: "Kariakoo",
    street_name: "Mkunguni",
  };

  it("formats as address path (street-first)", () => {
    expect(formatLocationPath(loc)).toBe("Mkunguni, Kariakoo, Ilala MC, Dar es Salaam");
  });

  it("formats as breadcrumb (region-first)", () => {
    expect(formatLocationBreadcrumb(loc)).toBe("Dar es Salaam › Ilala MC › Kariakoo › Mkunguni");
  });

  it("handles partial location", () => {
    expect(formatLocationPath({ region_name: "Mwanza" })).toBe("Mwanza");
    expect(formatLocationBreadcrumb({ region_name: "Mwanza", council_name: "Mwanza CC" })).toBe("Mwanza › Mwanza CC");
  });
});

// ─── Code Parser ────────────────────────────────────────
describe("Location Code Parser", () => {
  it("parses street code (4-part)", () => {
    const parsed = parseLocationCode("ILA-KRK-MKG-01");
    expect(parsed.region).toBe("ILA");
    expect(parsed.council).toBe("ILA-KRK-MKG");
    expect(parsed.ward).toBe("ILA-KRK");
    expect(parsed.street).toBe("ILA-KRK-MKG-01");
  });

  it("parses 3-part code as council", () => {
    const parsed = parseLocationCode("DSM-ILA-MC");
    expect(parsed.region).toBe("DSM");
    expect(parsed.council).toBe("DSM-ILA-MC");
  });

  it("parses ward code", () => {
    const parsed = parseLocationCode("ILA-KRK");
    expect(parsed.region).toBe("ILA");
    expect(parsed.ward).toBe("ILA-KRK");
  });
});

// ─── Text Matching (Backfill) ───────────────────────────
describe("Text-to-Hierarchy Matching", () => {
  const regions = [
    { id: "r1", name: "Dar es Salaam" },
    { id: "r2", name: "Iringa" },
    { id: "r3", name: "Mwanza" },
  ];

  const councils = [
    { id: "c1", name: "Ilala", region_id: "r1" },
    { id: "c2", name: "Iringa Municipal", region_id: "r2" },
  ];

  const wards = [
    { id: "w1", name: "Kariakoo", council_id: "c1" },
    { id: "w2", name: "Mtwivila", council_id: "c2" },
  ];

  it("matches region from text", () => {
    const result = matchTextToHierarchy("Dar es Salaam", regions);
    expect(result.region_id).toBe("r1");
    expect(result.region_name).toBe("Dar es Salaam");
  });

  it("matches council within region", () => {
    const result = matchTextToHierarchy("Ilala, Dar es Salaam", regions, councils);
    expect(result.region_id).toBe("r1");
    expect(result.council_id).toBe("c1");
  });

  it("matches ward within council", () => {
    const result = matchTextToHierarchy("Mtwivila, Iringa Municipal, Iringa", regions, councils, wards);
    expect(result.region_id).toBe("r2");
    expect(result.council_id).toBe("c2");
    expect(result.ward_id).toBe("w2");
  });

  it("returns empty for unmatched text", () => {
    const result = matchTextToHierarchy("Unknown Place", regions);
    expect(result.region_id).toBeUndefined();
  });
});
