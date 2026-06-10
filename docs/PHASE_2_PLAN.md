# PHASE 2: OFFICE REGISTRY MODULE
**Goal:** Build complete office registry system with CRUD operations, street-to-office mapping, hierarchy management, and API endpoints.

## API Endpoints

| Endpoint | Method | Purpose | Permissions |
|----------|--------|---------|-------------|
| `/api/offices` | GET | List offices with filters | Staff+ |
| `/api/offices` | POST | Create new office | Admin |
| `/api/offices/:id` | GET | Get office details | Staff+ |
| `/api/offices/:id` | PUT | Update office | Admin |
| `/api/offices/:id` | DELETE | Deactivate office | Admin |
| `/api/offices/bulk-import` | POST | Bulk CSV import | Admin |
| `/api/offices/street-mapping` | PUT | Map streets to office | Admin |
| `/api/offices/hierarchy/:id` | GET | Get child offices | Staff+ |

## Office ID Generation Rule

Format: `{RegionAbbr}-{DistrictAbbr}-{WardAbbr}-{MtaaName}-{Serial}`

Examples:
- Mtaa Office: `DSM-ILA-KAR-Mchikichini-001`
- Ward Office: `DSM-ILA-KAR-Ward-001`
- District Office: `DSM-ILA-District-001`
- Regional Office: `DSM-Regional-001`
- Department Office: `DSM-ILA-KAR-Police-001`

## UI Components

| Component | Purpose | Visual Pattern |
|-----------|---------|-----------------|
| `OfficeList.tsx` | Table of all offices with filters | Extend existing Table |
| `OfficeForm.tsx` | Create/edit office with dynamic fields | Extend existing Form |
| `OfficeDetail.tsx` | Full office profile with staff list | Existing Card layout |
| `StreetMappingManager.tsx` | Assign streets to Mtaa office | Tag input + multiselect |
| `OfficeHierarchyTree.tsx` | Visual tree of office hierarchy | New component, match styles |
| `BulkImportModal.tsx` | CSV upload with preview | Modal + Dropzone |

## Street-to-Office Mapping Logic

```typescript
// apps/api/src/lib/officeMapping.ts
export async function assignOfficeToCitizen(
  streetId: string,
  regionId: string,
  districtId: string,
  wardId: string
): Promise<string | null> {
  // 1. Try direct mapping from street to Mtaa office
  const mtaaOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'MTAA_OFFICE',
      street_mappings: {
        hasSome: [streetId]
      }
    },
    select: { id: true }
  });
  
  if (mtaaOffice) return mtaaOffice.id;
  
  // 2. Fallback to Ward office
  const wardOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'WARD_OFFICE',
      ward_id: wardId
    },
    select: { id: true }
  });
  
  if (wardOffice) {
    // Alert admin about unmapped street
    await createUnmappedStreetAlert(streetId, wardId);
    return wardOffice.id;
  }
  
  // 3. Final fallback to District office
  const districtOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'DISTRICT_OFFICE',
      district_id: districtId
    },
    select: { id: true }
  });
  
  if (districtOffice) return districtOffice.id;
  
  // 4. Regional office as last resort
  const regionalOffice = await prisma.officeRegistry.findFirst({
    where: {
      office_type: 'REGIONAL_OFFICE',
      region_id: regionId
    },
    select: { id: true }
  });
  
  return regionalOffice?.id || null;
}
```

## Implementation Order

1. ✅ Database schema & migrations (Phase 1 complete)
2. 📋 API Backend (CRUD + mapping logic)
3. 🎨 UI Components (forms, lists, trees)
4. 🔗 Frontend integration with API
5. ✓ Testing (unit + E2E)
6. 📦 Deployment verification

## Success Criteria for Phase 2

- [ ] All 7 endpoints fully functional
- [ ] Street mapping logic tested with edge cases
- [ ] UI components match visual identity
- [ ] Bulk import CSV parser working
- [ ] Office hierarchy tree renders correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Swahili/English translations applied
