# Phase 2: Office Registry API Documentation

## Overview

The Office Registry API provides complete CRUD operations for managing government offices across Tanzania's administrative hierarchy (Region → District → Ward → Mtaa).

**Base URL:** `http://localhost:4000/api/offices`

## Office Hierarchy

```
Region Office
├── District Office
│   ├── Ward Office
│   │   ├── Mtaa Office (with street mappings)
```

### Office Types
- `MTAA_OFFICE` — Smallest unit, serves street-level residents
- `WARD_OFFICE` — Serves multiple Mtaas
- `DISTRICT_OFFICE` — Serves multiple Wards
- `REGION_OFFICE` — Serves multiple Districts
- `DEPARTMENT` — Specialized government department
- `AGENCY` — Government agency
- `MINISTRY` — National ministry

### Office ID Format

Auto-generated format: `{RegionCode}-{DistrictCode}-{WardCode}-{MtaaName}-{Serial}`

**Example:** `DSM-ILA-KAR-Mchikichini-001` (Dar es Salaam, Ilala, Kariakoo, Mchikichini, Serial 001)

### Office Code Format

Auto-generated format: `{TypePrefix}-{RandomSerial}`

**Examples:**
- `MTAA-0042` (Mtaa office)
- `WARD-0089` (Ward office)
- `DIST-0001` (District office)
- `REGION-0005` (Region office)

## API Endpoints

### 1. List Offices

**Endpoint:** `GET /api/offices`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `office_type` | string | Filter by office type (MTAA_OFFICE, WARD_OFFICE, etc.) |
| `region_id` | UUID | Filter by region |
| `district_id` | UUID | Filter by district |
| `ward_id` | UUID | Filter by ward |
| `status` | string | Filter by status (ACTIVE, INACTIVE) |
| `skip` | number | Pagination offset (default: 0) |
| `take` | number | Pagination limit (default: 50) |

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/offices?office_type=MTAA_OFFICE&region_id=550e8400-e29b-41d4-a716-446655440000&status=ACTIVE"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "office_id": "DSM-ILA-KAR-Mchikichini-001",
      "office_code": "MTAA-0042",
      "office_type": "MTAA_OFFICE",
      "office_name": "Mchikichini Mtaa Office",
      "office_name_sw": "Ofisi ya Mtaa wa Mchikichini",
      "region_id": "550e8400-e29b-41d4-a716-446655440000",
      "district_id": "550e8400-e29b-41d4-a716-446655440001",
      "ward_id": "550e8400-e29b-41d4-a716-446655440002",
      "mtaa_id": "550e8400-e29b-41d4-a716-446655440003",
      "physical_address": "Plot 123, Main Street",
      "phone": "+255 654 123456",
      "email": "mchikichini@example.com",
      "latitude": -6.8024,
      "longitude": 39.2720,
      "street_mappings": ["Main Street", "Second Avenue", "Third Lane"],
      "status": "ACTIVE",
      "created_at": "2024-06-10T10:30:00Z",
      "updated_at": "2024-06-10T10:30:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "take": 50
}
```

---

### 2. Create Office

**Endpoint:** `POST /api/offices`

**Required Fields:**
- `office_type` (enum)
- `office_name` (string)

**Optional Fields:**
- `office_id` — If not provided, auto-generated
- `office_code` — If not provided, auto-generated
- `office_name_sw` — Swahili name
- `region_id`, `district_id`, `ward_id`, `mtaa_id` — Location hierarchy
- `mtaa_name` — Mtaa name for ID generation
- `parent_office_id` — Custom parent reference
- `physical_address`, `phone`, `email` — Contact info
- `latitude`, `longitude` — GPS coordinates
- `street_mappings` — Array of street names served by this office

**Example Request:**
```bash
curl -X POST "http://localhost:4000/api/offices" \
  -H "Content-Type: application/json" \
  -d '{
    "office_type": "MTAA_OFFICE",
    "office_name": "Mchikichini Mtaa Office",
    "office_name_sw": "Ofisi ya Mtaa wa Mchikichini",
    "region_id": "550e8400-e29b-41d4-a716-446655440000",
    "district_id": "550e8400-e29b-41d4-a716-446655440001",
    "ward_id": "550e8400-e29b-41d4-a716-446655440002",
    "mtaa_id": "550e8400-e29b-41d4-a716-446655440003",
    "mtaa_name": "Mchikichini",
    "physical_address": "Plot 123, Main Street",
    "phone": "+255 654 123456",
    "email": "mchikichini@example.com",
    "latitude": "-6.8024",
    "longitude": "39.2720",
    "street_mappings": ["Main Street", "Second Avenue"]
  }'
```

**Example Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "office_id": "DSM-ILA-KAR-Mchikichini-001",
    "office_code": "MTAA-0042",
    "office_type": "MTAA_OFFICE",
    "office_name": "Mchikichini Mtaa Office",
    "office_name_sw": "Ofisi ya Mtaa wa Mchikichini",
    "region_id": "550e8400-e29b-41d4-a716-446655440000",
    "district_id": "550e8400-e29b-41d4-a716-446655440001",
    "ward_id": "550e8400-e29b-41d4-a716-446655440002",
    "mtaa_id": "550e8400-e29b-41d4-a716-446655440003",
    "physical_address": "Plot 123, Main Street",
    "phone": "+255 654 123456",
    "email": "mchikichini@example.com",
    "latitude": -6.8024,
    "longitude": 39.2720,
    "street_mappings": ["Main Street", "Second Avenue"],
    "status": "ACTIVE",
    "created_at": "2024-06-10T10:30:00Z",
    "updated_at": "2024-06-10T10:30:00Z"
  }
}
```

---

### 3. Get Office

**Endpoint:** `GET /api/offices/:id`

**Parameters:**
- `:id` — Office UUID, office_id, or office_code

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001"
```

**Example Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "office_id": "DSM-ILA-KAR-Mchikichini-001",
    "office_code": "MTAA-0042",
    ...
  }
}
```

---

### 4. Update Office

**Endpoint:** `PUT /api/offices/:id`

**Parameters:**
- `:id` — Office UUID, office_id, or office_code

**Request Body:** Any office fields to update (all optional)

**Example Request:**
```bash
curl -X PUT "http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001" \
  -H "Content-Type: application/json" \
  -d '{
    "office_name": "Updated Mchikichini Office",
    "phone": "+255 654 999999",
    "status": "ACTIVE"
  }'
```

**Example Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "office_name": "Updated Mchikichini Office",
    "phone": "+255 654 999999",
    ...
  }
}
```

---

### 5. Delete Office (Deactivate)

**Endpoint:** `DELETE /api/offices/:id`

**Parameters:**
- `:id` — Office UUID, office_id, or office_code

**Note:** This soft-deletes (sets status to INACTIVE). Use PUT to reactivate.

**Example Request:**
```bash
curl -X DELETE "http://localhost:4000/api/offices/DSM-ILA-KAR-Mchikichini-001"
```

**Example Response:**
```
204 No Content
```

---

### 6. Map Streets to Office

**Endpoint:** `PUT /api/offices/street-mapping/:id`

**Parameters:**
- `:id` — Office UUID, office_id, or office_code

**Request Body:**
```json
{
  "streets": ["Main Street", "Second Avenue", "Third Lane"]
}
```

**Purpose:** Adds streets to an office's street_mappings array. Duplicates are automatically removed.

**Example Request:**
```bash
curl -X PUT "http://localhost:4000/api/offices/street-mapping/DSM-ILA-KAR-Mchikichini-001" \
  -H "Content-Type: application/json" \
  -d '{
    "streets": ["Makunganya Street", "Kariakoo Avenue"]
  }'
```

**Example Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "office_id": "DSM-ILA-KAR-Mchikichini-001",
    "street_mappings": ["Main Street", "Second Avenue", "Third Lane", "Makunganya Street", "Kariakoo Avenue"],
    ...
  }
}
```

---

### 7. Bulk Import Offices

**Endpoint:** `POST /api/offices/bulk-import`

**Request Body:**
```json
{
  "rows": [
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
    },
    {
      "office_type": "MTAA_OFFICE",
      "office_name": "Kariakoo Mtaa Office",
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

**Example Request:**
```bash
curl -X POST "http://localhost:4000/api/offices/bulk-import" \
  -H "Content-Type: application/json" \
  -d @offices.json
```

**Example Response:**
```json
{
  "created": 2,
  "failed": 0,
  "errors": []
}
```

---

### 8. Get Office Hierarchy

**Endpoint:** `GET /api/offices/hierarchy/:id`

**Parameters:**
- `:id` — Office UUID, office_id, or office_code

**Purpose:** Returns the complete office hierarchy tree (office + all descendants)

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/offices/hierarchy/550e8400-e29b-41d4-a716-446655440000"
```

**Example Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "office_id": "DSM-REGION-001",
    "office_type": "REGION_OFFICE",
    "office_name": "Dar es Salaam Region",
    "children": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "office_id": "DSM-ILA-DISTRICT-001",
        "office_type": "DISTRICT_OFFICE",
        "office_name": "Ilala District",
        "children": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "office_id": "DSM-ILA-KAR-WARD-001",
            "office_type": "WARD_OFFICE",
            "office_name": "Kariakoo Ward",
            "children": [
              {
                "id": "550e8400-e29b-41d4-a716-446655440003",
                "office_id": "DSM-ILA-KAR-Mchikichini-001",
                "office_type": "MTAA_OFFICE",
                "office_name": "Mchikichini Mtaa Office",
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### 9. Resolve Office from Street

**Endpoint:** `POST /api/offices/resolve-street`

**Request Body:**
```json
{
  "street": "Main Street"
}
```

**Purpose:** Resolves a citizen's office using the street-to-office fallback chain:
1. Check Mtaa office's street_mappings (direct)
2. Check Ward office's street_mappings (parent)
3. Check District office's street_mappings (grandparent)
4. Check Region office's street_mappings (great-grandparent)

Returns the matching office or null if no match.

**Example Request:**
```bash
curl -X POST "http://localhost:4000/api/offices/resolve-street" \
  -H "Content-Type: application/json" \
  -d '{
    "street": "Main Street"
  }'
```

**Example Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "office_id": "DSM-ILA-KAR-Mchikichini-001",
    "office_type": "MTAA_OFFICE",
    "office_name": "Mchikichini Mtaa Office",
    "street_mappings": ["Main Street", "Second Avenue"],
    ...
  }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "details": [] // Optional validation details
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Server Error |

---

## Data Fallback

When `DATABASE_URL` is not set, the API falls back to file-based storage at `apps/data/offices.json`. This allows local prototyping without a database connection.

---

## Validation Rules

### office_type
- Must be one of: `MTAA_OFFICE`, `WARD_OFFICE`, `DISTRICT_OFFICE`, `REGION_OFFICE`, `DEPARTMENT`, `AGENCY`, `MINISTRY`

### office_name
- Required, minimum 1 character

### office_code
- Auto-generated if not provided (format: `{TypePrefix}-{Serial}`)

### office_id
- Auto-generated if not provided (format: `{RegionCode}-{DistrictCode}-{WardCode}-{MtaaName}-{Serial}`)

### Email
- Must be valid email format if provided

### Latitude/Longitude
- Accepts string or number
- Latitude: -90 to 90
- Longitude: -180 to 180

---

## Testing

See `PHASE_2_API_TESTING.md` for comprehensive test scenarios and examples.
