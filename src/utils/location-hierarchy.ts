import prisma from '../lib/prisma';

/**
 * Street mapping fallback chain:
 * 1. Check Mtaa office's street_mappings array (direct match)
 * 2. Check Ward office's street_mappings (parent)
 * 3. Check District office's street_mappings (grandparent)
 * 4. Check Region office's street_mappings (great-grandparent)
 * Returns the office_id of the matching office, or null
 */
export async function resolveOfficeFromStreet(street: string): Promise<string | null> {
  // 1. Check Mtaa offices
  const mtaaOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'MTAA_OFFICE',
      street_mappings: {
        has: street,
      },
    },
  });
  if (mtaaOffice) return mtaaOffice.office_id;

  // 2. Check Ward offices
  const wardOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'WARD_OFFICE',
      street_mappings: {
        has: street,
      },
    },
  });
  if (wardOffice) return wardOffice.office_id;

  // 3. Check District offices
  const districtOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'DISTRICT_OFFICE',
      street_mappings: {
        has: street,
      },
    },
  });
  if (districtOffice) return districtOffice.office_id;

  // 4. Check Region offices
  const regionOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'REGION_OFFICE',
      street_mappings: {
        has: street,
      },
    },
  });
  if (regionOffice) return regionOffice.office_id;

  return null;
}

/**
 * Get the complete location hierarchy for a given office
 * Returns { region, district, ward, mtaa } objects
 */
export async function getLocationHierarchy(officeId: string) {
  const office = await prisma.officeRegistry.findUnique({
    where: { id: officeId },
  });

  if (!office) return null;

  const hierarchy: any = {
    region: office.region_id ? await prisma.regions.findUnique({ where: { id: office.region_id } }) : null,
    district: office.district_id ? await prisma.districts.findUnique({ where: { id: office.district_id } }) : null,
    ward: office.ward_id ? await prisma.wards.findUnique({ where: { id: office.ward_id } }) : null,
    mtaa: office.mtaa_id ? await prisma.mtaas.findUnique({ where: { id: office.mtaa_id } }) : null,
  };

  return hierarchy;
}

/**
 * Get parent office in hierarchy
 * Mtaa → Ward → District → Region
 */
export async function getParentOffice(officeId: string): Promise<any | null> {
  const office = await prisma.officeRegistry.findUnique({
    where: { id: officeId },
  });

  if (!office) return null;

  // If this is Mtaa, get Ward office
  if (office.office_type === 'MTAA_OFFICE' && office.ward_id) {
    return prisma.officeRegistry.findFirst({
      where: { office_type: 'WARD_OFFICE', ward_id: office.ward_id },
    });
  }

  // If Ward, get District office
  if (office.office_type === 'WARD_OFFICE' && office.district_id) {
    return prisma.officeRegistry.findFirst({
      where: { office_type: 'DISTRICT_OFFICE', district_id: office.district_id },
    });
  }

  // If District, get Region office
  if (office.office_type === 'DISTRICT_OFFICE' && office.region_id) {
    return prisma.officeRegistry.findFirst({
      where: { office_type: 'REGION_OFFICE', region_id: office.region_id },
    });
  }

  // If custom parent_office_id is set
  if (office.parent_office_id) {
    return prisma.officeRegistry.findUnique({
      where: { id: office.parent_office_id },
    });
  }

  return null;
}

/**
 * Get child offices in hierarchy
 * Region → District → Ward → Mtaa
 */
export async function getChildOffices(officeId: string): Promise<any[]> {
  const office = await prisma.officeRegistry.findUnique({
    where: { id: officeId },
  });

  if (!office) return [];

  // If Region, get Districts
  if (office.office_type === 'REGION_OFFICE' && office.region_id) {
    return prisma.officeRegistry.findMany({
      where: { office_type: 'DISTRICT_OFFICE', region_id: office.region_id },
    });
  }

  // If District, get Wards
  if (office.office_type === 'DISTRICT_OFFICE' && office.district_id) {
    return prisma.officeRegistry.findMany({
      where: { office_type: 'WARD_OFFICE', district_id: office.district_id },
    });
  }

  // If Ward, get Mtaas
  if (office.office_type === 'WARD_OFFICE' && office.ward_id) {
    return prisma.officeRegistry.findMany({
      where: { office_type: 'MTAA_OFFICE', ward_id: office.ward_id },
    });
  }

  // Or if custom children referenced via parent_office_id
  return prisma.officeRegistry.findMany({
    where: { parent_office_id: officeId },
  });
}
