# Phase 2 Backend - Quick Start Guide

## 🚀 Getting Started

### 1. Start the API Server

```bash
cd apps/api
npm run dev
```

You should see:
```
Office Registry API listening on port 4000
```

### 2. Verify Database Connection

Check that `DATABASE_URL` is set in `.env.local`:

```bash
# Should use session-mode direct URL (NOT pooler)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.slmmjdxiqtjqpenmmpaf.supabase.co:5432/postgres?sslmode=require
```

### 3. Verify Prisma Client Generated

You should see `apps/api/node_modules/.prisma/client/` directory exists with generated types.

If not, run:
```bash
cd apps/api
npx prisma generate
```

---

## 📋 Testing the API

### Option A: Using cURL (Terminal)

```bash
# Test 1: Create an office
curl -X POST "http://localhost:4000/api/offices" \
  -H "Content-Type: application/json" \
  -d '{
    "office_type": "MTAA_OFFICE",
    "office_name": "Test Mtaa Office",
    "region_id": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Test 2: List offices
curl -X GET "http://localhost:4000/api/offices"

# Test 3: Get office by ID
curl -X GET "http://localhost:4000/api/offices/TEST-OFFICE-001"
```

### Option B: Using Postman

1. Download and install [Postman](https://www.postman.com/downloads/)
2. Import collection:
   - File → Import → Paste JSON from `docs/PHASE_2_POSTMAN_COLLECTION.json`
   - Or drag-drop the file into Postman window
3. Start testing:
   - Create office → List offices → Get office → Update → Delete
   - Test error cases (invalid type, missing fields, etc.)

### Option C: Using VS Code REST Client

Install [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension.

Create file: `test.http`

```http
### Create Office
POST http://localhost:4000/api/offices
Content-Type: application/json

{
  "office_type": "MTAA_OFFICE",
  "office_name": "Mchikichini Mtaa",
  "region_id": "550e8400-e29b-41d4-a716-446655440000"
}

### List Offices
GET http://localhost:4000/api/offices?office_type=MTAA_OFFICE
```

Click "Send Request" above each request.

---

## 🔍 Common Issues & Solutions

### Issue: `DATABASE_URL is not set`

**Problem:** API falls back to file-based storage (okay for testing) but won't sync with database.

**Solution:** Set `DATABASE_URL` in `.env.local`:
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.slmmjdxiqtjqpenmmpaf.supabase.co:5432/postgres?sslmode=require
```

### Issue: `PrismaClient is not defined`

**Problem:** Prisma client not generated.

**Solution:**
```bash
cd apps/api
npx prisma generate
```

### Issue: `ECONNREFUSED - connection refused`

**Problem:** API server not running.

**Solution:**
```bash
cd apps/api
npm run dev
```

### Issue: `office_type must be one of: MTAA_OFFICE, ...`

**Problem:** Invalid office_type enum value.

**Solution:** Use one of the valid types:
- `MTAA_OFFICE`
- `WARD_OFFICE`
- `DISTRICT_OFFICE`
- `REGION_OFFICE`
- `DEPARTMENT`
- `AGENCY`
- `MINISTRY`

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [PHASE_2_API_DOCS.md](PHASE_2_API_DOCS.md) | Complete API endpoint reference |
| [PHASE_2_API_IMPLEMENTATION.md](PHASE_2_API_IMPLEMENTATION.md) | Implementation checklist + test scenarios |
| [PHASE_2_POSTMAN_COLLECTION.json](PHASE_2_POSTMAN_COLLECTION.json) | Ready-to-import Postman tests |

---

## 🔧 Architecture

### Service Layer (`apps/api/src/services/office.service.ts`)
- `listOffices(filters)` — Query with pagination
- `createOffice(payload)` — Create with auto-generated ID
- `getOffice(id)` — Lookup by UUID/office_id/office_code
- `updateOffice(id, payload)` — Partial update
- `deactivateOffice(id)` — Soft delete
- `mapStreetsToOffice(officeId, streets)` — Add streets
- `bulkImport(rows)` — Bulk create with error tracking
- `getHierarchy(id)` — Recursive tree fetch
- `resolveOfficeForCitizen(street)` — Street → office fallback

### Utilities

**office-id-generator.ts:**
- `generateOfficeId()` — Auto ID in format DSM-ILA-KAR-Mchikichini-001
- `generateOfficeCode()` — Auto code in format MTAA-0042

**location-hierarchy.ts:**
- `resolveOfficeFromStreet()` — Street mapping fallback chain
- `getLocationHierarchy()` — Full location tree
- `getParentOffice()` — Parent in hierarchy
- `getChildOffices()` — Children in hierarchy

### Validation (`apps/api/src/validators/office.validator.ts`)
- Zod schema with enums, email validation, UUID validation
- Used in all POST/PUT endpoints

### Routes (`apps/api/src/routes/offices.ts`)
- 9 total endpoints with error handling
- All wrapped with asyncHandler for try-catch

---

## 📊 Data Model

```typescript
OfficeRegistry {
  id: UUID (primary key)
  office_id: string (unique, auto-generated)
  office_code: string (unique, auto-generated)
  office_type: enum (MTAA_OFFICE | WARD_OFFICE | ...)
  office_name: string
  office_name_sw: string (Swahili)
  region_id: UUID (foreign key)
  district_id: UUID (foreign key)
  ward_id: UUID (foreign key)
  mtaa_id: UUID (foreign key)
  parent_office_id: UUID (custom hierarchy)
  physical_address: string
  phone: string
  email: string
  latitude: decimal(10,7)
  longitude: decimal(10,7)
  street_mappings: text[] (array of street names)
  status: enum (ACTIVE | INACTIVE)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🎯 Next Steps

### Immediate (This Session)
- [x] Backend API complete (9 endpoints)
- [x] Utilities for ID generation + hierarchy
- [x] Full validation with Zod
- [x] Error handling + pagination
- [ ] **Test all endpoints** using Postman/cURL

### Next Session
- [ ] Phase 2 Frontend Components (OfficeList, OfficeForm, OfficeDetail, etc.)
- [ ] Frontend-to-API integration
- [ ] Mobile responsive UI (375px, 768px, 1200px)
- [ ] Phase 3: Authentication system (OTP, email verification)

---

## 💡 Tips

1. **Use office_id or office_code for lookups** — More user-friendly than UUIDs
   - Example: `GET /api/offices/DSM-ILA-KAR-Mchikichini-001`

2. **Street mapping fallback is automatic** — No need to duplicate streets at every level
   - Citizens living on "Main Street" → Mtaa checks directly, then parent Ward, District, Region

3. **Bulk import has error tracking** — See which rows failed and why
   - Example response: `{ created: 98, failed: 2, errors: [{rowIndex: 5, error: "..."}] }`

4. **Hierarchy tree can be deep** — Configured to 10 levels by default, adjustable

5. **File fallback for quick testing** — When DATABASE_URL not set, uses `apps/data/offices.json`

---

## 📞 Support

For issues or questions, refer to:
- [PHASE_2_API_DOCS.md](PHASE_2_API_DOCS.md) — Endpoint details
- [PHASE_2_API_IMPLEMENTATION.md](PHASE_2_API_IMPLEMENTATION.md) — Implementation notes + tests
- Codebase comments in service/route files
