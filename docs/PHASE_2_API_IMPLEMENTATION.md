# Phase 2 API Implementation Checklist

## Backend (✅ COMPLETE)

### Core Files
- [x] `apps/api/src/services/office.service.ts` — Enhanced with full CRUD + business logic
- [x] `apps/api/src/routes/offices.ts` — All 9 endpoints with error handling
- [x] `apps/api/src/validators/office.validator.ts` — Zod schema with enums
- [x] `apps/api/src/utils/office-id-generator.ts` — Auto-generated office IDs + codes
- [x] `apps/api/src/utils/location-hierarchy.ts` — Street-to-office mapping fallback chain
- [x] `apps/api/src/lib/prisma.ts` — Already exists, PrismaClient singleton
- [x] `docs/PHASE_2_API_DOCS.md` — Complete API documentation

### Endpoints (All 9 Implemented)
- [x] `GET /api/offices` — List with filtering + pagination
- [x] `POST /api/offices` — Create with auto-generated ID + code
- [x] `GET /api/offices/:id` — Get by UUID, office_id, or office_code
- [x] `PUT /api/offices/:id` — Update office details
- [x] `DELETE /api/offices/:id` — Soft delete (deactivate)
- [x] `PUT /api/offices/street-mapping/:id` — Add streets to office
- [x] `POST /api/offices/bulk-import` — Bulk create from array
- [x] `GET /api/offices/hierarchy/:id` — Get office tree (office + descendants)
- [x] `POST /api/offices/resolve-street` — Resolve office from citizen's street

### Database Features
- [x] Prisma schema with OfficeRegistry model (19 migrations applied)
- [x] Indexing on office_type, parent_office_id, location fields
- [x] Support for file fallback when DATABASE_URL not set
- [x] RLS policies skeleton (in migrations, ready for Supabase auth)

### Validation & Error Handling
- [x] Zod schemas with enums for office_type
- [x] Email validation
- [x] UUID validation for location fields
- [x] Try-catch blocks in all service methods
- [x] Proper HTTP status codes (201 for create, 404 for not found, etc.)
- [x] Descriptive error messages

### Office ID Generation Logic
- [x] Format: `{RegionCode}-{DistrictCode}-{WardCode}-{MtaaName}-{Serial}`
- [x] Example: `DSM-ILA-KAR-Mchikichini-001`
- [x] Auto-incremental serial per office hierarchy level
- [x] Fallback to timestamp-based ID if location unavailable

### Office Code Generation Logic
- [x] Format: `{TypePrefix}-{RandomSerial}`
- [x] Examples: `MTAA-0042`, `WARD-0089`, `DIST-0001`, `REGION-0005`
- [x] Type prefixes: MTAA, WARD, DIST, REGION, DEPT, AGCY, MIN

### Street Mapping Logic
- [x] Fallback chain implemented:
  1. Check Mtaa office street_mappings (direct)
  2. Check Ward office street_mappings (parent)
  3. Check District office street_mappings (grandparent)
  4. Check Region office street_mappings (great-grandparent)
- [x] `resolveOfficeFromStreet()` function in location-hierarchy.ts
- [x] `resolveOfficeForCitizen()` wrapper service method

---

## Frontend (Next Phase)

### Components to Build
- [ ] `apps/web/components/OfficeList.tsx` — Table with filtering + sorting
- [ ] `apps/web/components/OfficeForm.tsx` — Create/edit form with office_type selector
- [ ] `apps/web/components/OfficeDetail.tsx` — Office profile view
- [ ] `apps/web/components/StreetMappingManager.tsx` — Street multiselect UI
- [ ] `apps/web/components/OfficeHierarchyTree.tsx` — Visual hierarchy tree
- [ ] `apps/web/components/BulkImportModal.tsx` — CSV upload with preview

### Pages to Create
- [ ] `apps/web/pages/offices/index.tsx` — Office list + create
- [ ] `apps/web/pages/offices/[id].tsx` — Office detail + edit
- [ ] `apps/web/pages/admin/offices/bulk-import.tsx` — Bulk import page

### Features
- [ ] Client-side form validation (mirror Zod schemas)
- [ ] API integration (fetch office list, create, update, delete)
- [ ] Pagination handling
- [ ] Loading states + error toasts
- [ ] Mobile responsive (375px, 768px, 1200px breakpoints)
- [ ] Accessible form labels + ARIA attributes
- [ ] Use design tokens from `apps/web/styles/tokens.css`

---

## Testing & Verification

### Manual API Testing (Recommended: Use Postman or REST Client)

#### Test 1: Create Mtaa Office
```bash
POST http://localhost:4000/api/offices
Content-Type: application/json

{
  "office_type": "MTAA_OFFICE",
  "office_name": "Mchikichini Mtaa Office",
  "office_name_sw": "Ofisi ya Mtaa wa Mchikichini",
  "region_id": "550e8400-e29b-41d4-a716-446655440000",
  "district_id": "550e8400-e29b-41d4-a716-446655440001",
  "ward_id": "550e8400-e29b-41d4-a716-446655440002",
  "mtaa_id": "550e8400-e29b-41d4-a716-446655440003",
  "mtaa_name": "Mchikichini",
  "street_mappings": ["Main Street", "Second Avenue"]
}
```

✅ Expected: 201 Created with auto-generated office_id (DSM-??-??-Mchikichini-001) and office_code (MTAA-####)

#### Test 2: List Offices with Filter
```bash
GET http://localhost:4000/api/offices?office_type=MTAA_OFFICE&status=ACTIVE
```

✅ Expected: 200 OK with paginated results and total count

#### Test 3: Get Office by ID
```bash
GET http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001
```

✅ Expected: 200 OK with full office data

#### Test 4: Update Office
```bash
PUT http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001
Content-Type: application/json

{
  "office_name": "Updated Mchikichini Office",
  "phone": "+255 654 123456"
}
```

✅ Expected: 200 OK with updated fields preserved

#### Test 5: Map Streets to Office
```bash
PUT http://localhost:4000/api/offices/street-mapping/DSM-ILA-KAR-Mchikichini-001
Content-Type: application/json

{
  "streets": ["Makunganya Street", "Kariakoo Avenue"]
}
```

✅ Expected: 200 OK with merged street_mappings array (no duplicates)

#### Test 6: Resolve Street to Office
```bash
POST http://localhost:4000/api/offices/resolve-street
Content-Type: application/json

{
  "street": "Main Street"
}
```

✅ Expected: 200 OK with matching Mtaa office (or parent if not at Mtaa level)

#### Test 7: Bulk Import
```bash
POST http://localhost:4000/api/offices/bulk-import
Content-Type: application/json

{
  "rows": [
    {
      "office_type": "MTAA_OFFICE",
      "office_name": "Kariakoo Mtaa",
      "office_name_sw": "Ofisi ya Mtaa wa Kariakoo",
      "region_id": "550e8400-e29b-41d4-a716-446655440000",
      "district_id": "550e8400-e29b-41d4-a716-446655440001",
      "ward_id": "550e8400-e29b-41d4-a716-446655440002",
      "mtaa_id": "550e8400-e29b-41d4-a716-446655440004",
      "mtaa_name": "Kariakoo"
    }
  ]
}
```

✅ Expected: 200 OK with { created: 1, failed: 0, errors: [] }

#### Test 8: Get Hierarchy
```bash
GET http://localhost:4000/api/offices/hierarchy/550e8400-e29b-41d4-a716-446655440000
```

✅ Expected: 200 OK with nested tree structure (office + children)

#### Test 9: Delete Office
```bash
DELETE http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001
```

✅ Expected: 204 No Content (soft delete, status set to INACTIVE)

---

## Validation Tests

### Test Invalid Office Type
```bash
POST http://localhost:4000/api/offices
{
  "office_type": "INVALID_TYPE",
  "office_name": "Test"
}
```

❌ Expected: 400 Bad Request with validation error

### Test Missing Office Name
```bash
POST http://localhost:4000/api/offices
{
  "office_type": "MTAA_OFFICE"
}
```

❌ Expected: 400 Bad Request with validation error

### Test Invalid Email
```bash
PUT http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001
{
  "email": "invalid-email"
}
```

❌ Expected: 400 Bad Request with email validation error

---

## Next Steps

1. **Run API Server:** `npm run dev` in `apps/api`
2. **Test All 9 Endpoints** using Postman collection or curl scripts
3. **Verify Database Connection:** Check Supabase tables for created records
4. **Build UI Components** for Phase 2 frontend (in next session)
5. **Integration Testing:** Wire frontend to API endpoints
6. **Performance Optimization:** Add caching, optimize queries if needed

---

## API Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/offices` | List all offices (paginated, filterable) |
| POST | `/api/offices` | Create office (auto-generated ID + code) |
| GET | `/api/offices/:id` | Get office by ID/office_id/office_code |
| PUT | `/api/offices/:id` | Update office details |
| DELETE | `/api/offices/:id` | Deactivate office (soft delete) |
| PUT | `/api/offices/street-mapping/:id` | Add streets to office |
| POST | `/api/offices/bulk-import` | Bulk import offices from array |
| GET | `/api/offices/hierarchy/:id` | Get office tree (office + descendants) |
| POST | `/api/offices/resolve-street` | Resolve office from citizen street |

---

## Known Limitations & Future Enhancements

### Current Limitations
- No authentication (add JWT in Phase 11)
- No rate limiting (add in Phase 11)
- Street mapping fallback chain requires Prisma (file fallback doesn't support complex queries)
- Hierarchy depth limited to 10 levels (configurable)

### Future Enhancements
- Add office closing history (archive old records)
- Implement office merge/split operations
- Add bulk street mapping import
- Implement office transfer between hierarchies
- Add location search (fuzzy matching)
- Geocoding integration for address → coordinates
- Audit logging for all office changes
- Office-to-citizen assignment tracking
