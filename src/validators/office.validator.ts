import { z } from 'zod';

export const OfficeSchema = z.object({
  office_id: z.string().optional().describe('Office ID (auto-generated if not provided)'),
  office_code: z.string().optional().describe('Office code (auto-generated if not provided)'),
  office_type: z.enum(['MTAA_OFFICE', 'WARD_OFFICE', 'DISTRICT_OFFICE', 'REGION_OFFICE', 'DEPARTMENT', 'AGENCY', 'MINISTRY']),
  office_name: z.string().min(1, 'Office name is required'),
  office_name_sw: z.string().optional().describe('Office name in Swahili'),
  region_id: z.string().uuid().optional(),
  district_id: z.string().uuid().optional(),
  ward_id: z.string().uuid().optional(),
  mtaa_id: z.string().uuid().optional(),
  mtaa_name: z.string().optional().describe('Mtaa name for ID generation'),
  parent_office_id: z.string().uuid().optional(),
  physical_address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  latitude: z.string().or(z.number()).optional(),
  longitude: z.string().or(z.number()).optional(),
  street_mappings: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type OfficeInput = z.infer<typeof OfficeSchema>;
