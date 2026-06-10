import prisma from '../lib/prisma';

/**
 * Generates office ID with format: {RegionAbbr}-{DistrictAbbr}-{WardAbbr}-{MtaaName}-{Serial}
 * Example: DSM-ILA-KAR-Mchikichini-001
 */
export async function generateOfficeId(
  region_id: string | null | undefined,
  district_id: string | null | undefined,
  ward_id: string | null | undefined,
  mtaa_id: string | null | undefined,
  mtaa_name: string | null | undefined,
): Promise<string> {
  const parts: string[] = [];

  // Region abbreviation (first 3 letters, uppercase)
  if (region_id) {
    const region = await prisma.regions.findUnique({ where: { id: region_id } });
    if (region?.code) parts.push(region.code.toUpperCase().substring(0, 3));
  }

  // District abbreviation
  if (district_id) {
    const district = await prisma.districts.findUnique({ where: { id: district_id } });
    if (district?.code) parts.push(district.code.toUpperCase().substring(0, 3));
  }

  // Ward abbreviation
  if (ward_id) {
    const ward = await prisma.wards.findUnique({ where: { id: ward_id } });
    if (ward?.code) parts.push(ward.code.toUpperCase().substring(0, 3));
  }

  // Mtaa name (or if no mtaa, use code from mtaa table)
  if (mtaa_name) {
    parts.push(mtaa_name);
  } else if (mtaa_id) {
    const mtaa = await prisma.mtaas.findUnique({ where: { id: mtaa_id } });
    if (mtaa?.name) parts.push(mtaa.name);
  }

  // Get serial number (auto-increment counter for this office hierarchy)
  const officeCount = await prisma.officeRegistry.count({
    where: {
      region_id: region_id || undefined,
      district_id: district_id || undefined,
      ward_id: ward_id || undefined,
      mtaa_id: mtaa_id || undefined,
    },
  });

  const serial = String(officeCount + 1).padStart(3, '0');
  parts.push(serial);

  return parts.filter(Boolean).join('-');
}

/**
 * Generates office code with format: {OfficeTypePrefix}{RandomSerial}
 * Example: MTAA-0001, WARD-0042, REGION-0007
 */
export function generateOfficeCode(officeType: string = 'MTAA'): string {
  const typeMap: Record<string, string> = {
    MTAA_OFFICE: 'MTAA',
    WARD_OFFICE: 'WARD',
    DISTRICT_OFFICE: 'DIST',
    REGION_OFFICE: 'REGION',
    DEPARTMENT: 'DEPT',
    AGENCY: 'AGCY',
    MINISTRY: 'MIN',
  };

  const prefix = typeMap[officeType] || 'OFF';
  const serial = Math.floor(Math.random() * 10000);
  return `${prefix}-${String(serial).padStart(4, '0')}`;
}
