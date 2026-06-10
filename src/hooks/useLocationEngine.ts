/**
 * SPRINT 3: Location Engine — API Hooks
 * ======================================
 * React hooks for fetching location hierarchy data.
 * Cascading: Region → Council → Ward → Street
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────
export interface LocationRecord {
  id: string;
  code: string;
  name: string;
  name_sw: string;
  active?: boolean;
}

export interface CouncilRecord extends LocationRecord {
  region_id: string;
  council_type: string;
}

export interface WardRecord extends LocationRecord {
  council_id: string;
}

export interface StreetRecord extends LocationRecord {
  ward_id: string;
  mtaa_type: string;
}

export interface LocationSelection {
  region_id?: string;
  region_name?: string;
  council_id?: string;
  council_name?: string;
  ward_id?: string;
  ward_name?: string;
  street_id?: string;
  street_name?: string;
}

// ─── useRegions ─────────────────────────────────────────
export function useRegions() {
  const [regions, setRegions] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("regions")
        .select("id, code, name, name_sw, active")
        .eq("active", true)
        .order("name");
      if (!cancelled) {
        setRegions((data as LocationRecord[]) || []);
        setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { regions, loading };
}

// ─── useCouncils ────────────────────────────────────────
export function useCouncils(regionId?: string) {
  const [councils, setCouncils] = useState<CouncilRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!regionId) {
      setCouncils([]);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("councils")
        .select("id, code, name, name_sw, region_id, council_type, active")
        .eq("region_id", regionId)
        .eq("active", true)
        .order("name");
      if (!cancelled) {
        setCouncils((data as CouncilRecord[]) || []);
        setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [regionId]);

  return { councils, loading };
}

// ─── useWards ───────────────────────────────────────────
export function useWards(councilId?: string) {
  const [wards, setWards] = useState<WardRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!councilId) {
      setWards([]);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("wards")
        .select("id, code, name, name_sw, council_id, active")
        .eq("council_id", councilId)
        .eq("active", true)
        .order("name");
      if (!cancelled) {
        setWards((data as WardRecord[]) || []);
        setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [councilId]);

  return { wards, loading };
}

// ─── useStreets ─────────────────────────────────────────
export function useStreets(wardId?: string) {
  const [streets, setStreets] = useState<StreetRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!wardId) {
      setStreets([]);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("streets")
        .select("id, code, name, name_sw, ward_id, mtaa_type, active")
        .eq("ward_id", wardId)
        .eq("active", true)
        .order("name");
      if (!cancelled) {
        setStreets((data as StreetRecord[]) || []);
        setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [wardId]);

  return { streets, loading };
}

// ─── useLocationLookup ──────────────────────────────────
/** Resolve a full hierarchy path from any level ID */
export function useLocationLookup() {
  const resolve = useCallback(
    async (params: {
      street_id?: string;
      ward_id?: string;
      council_id?: string;
      region_id?: string;
    }): Promise<LocationSelection> => {
      const result: LocationSelection = {};

      if (params.street_id) {
        const { data: street } = await supabase
          .from("streets")
          .select("id, name, ward_id")
          .eq("id", params.street_id)
          .single();
        if (street) {
          result.street_id = street.id;
          result.street_name = street.name;
          params.ward_id = street.ward_id;
        }
      }

      if (params.ward_id) {
        const { data: ward } = await supabase
          .from("wards")
          .select("id, name, council_id")
          .eq("id", params.ward_id)
          .single();
        if (ward) {
          result.ward_id = ward.id;
          result.ward_name = ward.name;
          params.council_id = ward.council_id;
        }
      }

      if (params.council_id) {
        const { data: council } = await supabase
          .from("councils")
          .select("id, name, region_id")
          .eq("id", params.council_id)
          .single();
        if (council) {
          result.council_id = council.id;
          result.council_name = council.name;
          params.region_id = council.region_id;
        }
      }

      if (params.region_id) {
        const { data: region } = await supabase
          .from("regions")
          .select("id, name")
          .eq("id", params.region_id)
          .single();
        if (region) {
          result.region_id = region.id;
          result.region_name = region.name;
        }
      }

      return result;
    },
    [],
  );

  return { resolve };
}
