/**
 * Office data types for Phase 2 Office Registry
 */

export type OfficeType = 
  | 'MTAA_OFFICE' 
  | 'WARD_OFFICE' 
  | 'DISTRICT_OFFICE' 
  | 'REGION_OFFICE' 
  | 'DEPARTMENT' 
  | 'AGENCY' 
  | 'MINISTRY';

export type OfficeStatus = 'ACTIVE' | 'INACTIVE';

export interface Office {
  id: string;
  office_id: string;              // DSM-ILA-KAR-Mchikichini-001
  office_code: string;            // MTAA-0042
  office_type: OfficeType;
  office_name: string;
  office_name_sw?: string;
  region_id?: string;
  district_id?: string;
  ward_id?: string;
  mtaa_id?: string;
  parent_office_id?: string;
  physical_address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  street_mappings?: string[];
  status: OfficeStatus;
  created_at: string;
  updated_at: string;
}

export interface OfficeCreateInput {
  office_type: OfficeType;
  office_name: string;
  office_name_sw?: string;
  region_id?: string;
  district_id?: string;
  ward_id?: string;
  mtaa_id?: string;
  mtaa_name?: string;
  parent_office_id?: string;
  physical_address?: string;
  phone?: string;
  email?: string;
  latitude?: string | number;
  longitude?: string | number;
  street_mappings?: string[];
}

export interface OfficeUpdateInput {
  office_name?: string;
  office_name_sw?: string;
  physical_address?: string;
  phone?: string;
  email?: string;
  latitude?: string | number;
  longitude?: string | number;
  status?: OfficeStatus;
}

export interface OfficeListResponse {
  data: Office[];
  total: number;
  skip: number;
  take: number;
}

export interface OfficeHierarchy {
  id: string;
  office_id: string;
  office_type: OfficeType;
  office_name: string;
  children: OfficeHierarchy[];
}

export interface LocationHierarchy {
  region?: { id: string; name: string; code: string };
  district?: { id: string; name: string; code: string };
  ward?: { id: string; name: string; code: string };
  mtaa?: { id: string; name: string; code: string };
}

export interface ApiError {
  error: string;
  details?: Array<{ path: string[]; message: string }>;
}

export const OFFICE_TYPES: { value: OfficeType; label: string }[] = [
  { value: 'MTAA_OFFICE', label: 'Mtaa Office' },
  { value: 'WARD_OFFICE', label: 'Ward Office' },
  { value: 'DISTRICT_OFFICE', label: 'District Office' },
  { value: 'REGION_OFFICE', label: 'Region Office' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'AGENCY', label: 'Agency' },
  { value: 'MINISTRY', label: 'Ministry' },
];
