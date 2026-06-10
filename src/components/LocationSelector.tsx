/**
 * SPRINT 3: Location Selector Component
 * ======================================
 * Cascading dropdown: Region → Council → Ward → Street
 * Each selection triggers loading the next level.
 */

import React, { useEffect } from "react";
import { MapPin, ChevronDown, Loader2, Building2, Map, Home } from "lucide-react";
import {
  useRegions,
  useCouncils,
  useWards,
  useStreets,
  type LocationSelection,
} from "@/hooks/useLocationEngine";

interface LocationSelectorProps {
  value: LocationSelection;
  onChange: (selection: LocationSelection) => void;
  lang: string;
  /** Which levels to show. Default: all 4 */
  levels?: ("region" | "council" | "ward" | "street")[];
  /** Whether selection is required */
  required?: boolean;
  /** Compact layout */
  compact?: boolean;
  /** Disable editing */
  disabled?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  lang,
  levels = ["region", "council", "ward", "street"],
  required = false,
  compact = false,
  disabled = false,
}) => {
  const sw = lang === "sw";
  const { regions, loading: regionsLoading } = useRegions();
  const { councils, loading: councilsLoading } = useCouncils(value.region_id);
  const { wards, loading: wardsLoading } = useWards(value.council_id);
  const { streets, loading: streetsLoading } = useStreets(value.ward_id);

  // Auto-set names when IDs change
  useEffect(() => {
    if (value.region_id && !value.region_name) {
      const r = regions.find((x) => x.id === value.region_id);
      if (r) onChange({ ...value, region_name: sw ? r.name_sw : r.name });
    }
  }, [value.region_id, regions]);

  const selectStyle = `w-full text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 pr-8
    appearance-none cursor-pointer hover:border-emerald-300 focus:border-emerald-500
    focus:ring-2 focus:ring-emerald-100 outline-none transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    ${compact ? "py-2 text-xs" : ""}`;

  const labelStyle = `text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1`;

  const handleRegionChange = (regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    onChange({
      region_id: regionId,
      region_name: region ? (sw ? region.name_sw : region.name) : undefined,
      council_id: undefined,
      council_name: undefined,
      ward_id: undefined,
      ward_name: undefined,
      street_id: undefined,
      street_name: undefined,
    });
  };

  const handleCouncilChange = (councilId: string) => {
    const council = councils.find((c) => c.id === councilId);
    onChange({
      ...value,
      council_id: councilId,
      council_name: council ? (sw ? council.name_sw : council.name) : undefined,
      ward_id: undefined,
      ward_name: undefined,
      street_id: undefined,
      street_name: undefined,
    });
  };

  const handleWardChange = (wardId: string) => {
    const ward = wards.find((w) => w.id === wardId);
    onChange({
      ...value,
      ward_id: wardId,
      ward_name: ward ? (sw ? ward.name_sw : ward.name) : undefined,
      street_id: undefined,
      street_name: undefined,
    });
  };

  const handleStreetChange = (streetId: string) => {
    const street = streets.find((s) => s.id === streetId);
    onChange({
      ...value,
      street_id: streetId,
      street_name: street ? (sw ? street.name_sw : street.name) : undefined,
    });
  };

  return (
    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
      {/* Region */}
      {levels.includes("region") && (
        <div>
          <label className={labelStyle}>
            <Map size={10} />
            {sw ? "Mkoa" : "Region"} {required && "*"}
          </label>
          <div className="relative">
            <select
              value={value.region_id || ""}
              onChange={(e) => handleRegionChange(e.target.value)}
              className={selectStyle}
              disabled={disabled || regionsLoading}
            >
              <option value="">{sw ? "— Chagua Mkoa —" : "— Select Region —"}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {sw ? r.name_sw : r.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {regionsLoading ? <Loader2 size={14} className="animate-spin text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Council */}
      {levels.includes("council") && value.region_id && (
        <div>
          <label className={labelStyle}>
            <Building2 size={10} />
            {sw ? "Halmashauri" : "Council"} {required && "*"}
          </label>
          <div className="relative">
            <select
              value={value.council_id || ""}
              onChange={(e) => handleCouncilChange(e.target.value)}
              className={selectStyle}
              disabled={disabled || councilsLoading}
            >
              <option value="">{sw ? "— Chagua Halmashauri —" : "— Select Council —"}</option>
              {councils.map((c) => (
                <option key={c.id} value={c.id}>
                  {sw ? c.name_sw : c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {councilsLoading ? <Loader2 size={14} className="animate-spin text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Ward */}
      {levels.includes("ward") && value.council_id && (
        <div>
          <label className={labelStyle}>
            <MapPin size={10} />
            {sw ? "Kata" : "Ward"} {required && "*"}
          </label>
          <div className="relative">
            <select
              value={value.ward_id || ""}
              onChange={(e) => handleWardChange(e.target.value)}
              className={selectStyle}
              disabled={disabled || wardsLoading}
            >
              <option value="">{sw ? "— Chagua Kata —" : "— Select Ward —"}</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {sw ? w.name_sw : w.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {wardsLoading ? <Loader2 size={14} className="animate-spin text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Street */}
      {levels.includes("street") && value.ward_id && (
        <div>
          <label className={labelStyle}>
            <Home size={10} />
            {sw ? "Mtaa / Kijiji" : "Street / Village"} {required && "*"}
          </label>
          <div className="relative">
            <select
              value={value.street_id || ""}
              onChange={(e) => handleStreetChange(e.target.value)}
              className={selectStyle}
              disabled={disabled || streetsLoading}
            >
              <option value="">{sw ? "— Chagua Mtaa —" : "— Select Street —"}</option>
              {streets.map((s) => (
                <option key={s.id} value={s.id}>
                  {sw ? s.name_sw : s.name} {s.mtaa_type !== "mtaa" ? `(${s.mtaa_type})` : ""}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {streetsLoading ? <Loader2 size={14} className="animate-spin text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Selection summary */}
      {value.region_name && (
        <div className="flex flex-wrap items-center gap-1 text-[10px] text-stone-400">
          <MapPin size={10} />
          <span>{value.region_name}</span>
          {value.council_name && <><span>›</span><span>{value.council_name}</span></>}
          {value.ward_name && <><span>›</span><span>{value.ward_name}</span></>}
          {value.street_name && <><span>›</span><span className="text-emerald-600 font-bold">{value.street_name}</span></>}
        </div>
      )}
    </div>
  );
};
