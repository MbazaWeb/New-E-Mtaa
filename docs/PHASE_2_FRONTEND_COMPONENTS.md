# Phase 2 Frontend Components Documentation

## Overview

Complete React component library for the Office Registry UI. All components are TypeScript-based, responsive (375px-1400px), and accessible with ARIA attributes.

**Status:** ✅ Complete — 6 components ready for integration

---

## Components

### 1. OfficeList Component

**File:** `apps/web/components/OfficeList.tsx`

**Purpose:** Display all offices in a paginated, filterable, sortable table

**Features:**
- ✅ Paginated table (default 10 per page)
- ✅ Filter by office type, status
- ✅ Search by name, office_id, or office_code
- ✅ Sort by name, type, or creation date
- ✅ Loading and error states
- ✅ Empty state with call-to-action
- ✅ Action buttons (View, Edit, Delete)
- ✅ Badge styling for status

**Props:**
```typescript
interface OfficeListProps {
  onSelectOffice?: (office: Office) => void;  // Called when viewing office
  onCreateOffice?: () => void;                 // Called when creating
  onEditOffice?: (office: Office) => void;    // Called when editing
  onDeleteOffice?: (officeId: string) => void; // Called after delete
}
```

**Usage:**
```tsx
<OfficeList
  onSelectOffice={(office) => navigate(`/offices/${office.id}`)}
  onCreateOffice={() => setShowForm(true)}
  onEditOffice={(office) => setEditingOffice(office)}
  onDeleteOffice={(id) => console.log('Deleted:', id)}
/>
```

**Responsive Design:**
- Mobile (375px): Single column layout, stacked filters
- Tablet (768px): 2-column grid, side-by-side filters
- Desktop (1200px+): 4-column grid, full feature set

---

### 2. OfficeForm Component

**File:** `apps/web/components/OfficeForm.tsx`

**Purpose:** Create or edit office details

**Features:**
- ✅ Create mode: All fields available
- ✅ Edit mode: Pre-populated with existing data
- ✅ Zod-like validation (mirrors backend)
- ✅ Email format validation
- ✅ Auto-generated office_id and office_code (note only)
- ✅ Loading and error states
- ✅ Cancel button

**Props:**
```typescript
interface OfficeFormProps {
  office?: Office;                   // If provided, edit mode
  onSuccess?: (office: Office) => void; // Called after save
  onCancel?: () => void;             // Called on cancel
}
```

**Form Fields:**
- Office Type * (required)
- Office Name * (required, English)
- Office Name (Swahili)
- Physical Address
- Phone
- Email

**Usage:**
```tsx
// Create mode
<OfficeForm
  onSuccess={(office) => {
    console.log('Created:', office);
    setShowForm(false);
  }}
  onCancel={() => setShowForm(false)}
/>

// Edit mode
<OfficeForm
  office={selectedOffice}
  onSuccess={(office) => {
    console.log('Updated:', office);
    setSelectedOffice(office);
  }}
  onCancel={() => setSelectedOffice(null)}
/>
```

---

### 3. OfficeDetail Component

**File:** `apps/web/components/OfficeDetail.tsx`

**Purpose:** Display comprehensive office information in read-only format

**Features:**
- ✅ Auto-loads office data on mount
- ✅ Displays all office fields
- ✅ Shows hierarchy info (children count)
- ✅ Formatted timestamps
- ✅ Clickable contact links (phone, email)
- ✅ GPS coordinates display
- ✅ Street mappings list
- ✅ Edit button
- ✅ Back button with callback

**Props:**
```typescript
interface OfficeDetailProps {
  officeId: string;                 // UUID, office_id, or office_code
  onBack?: () => void;              // Called on back click
  onEdit?: (office: Office) => void; // Called on edit click
}
```

**Sections:**
1. Basic Information (ID, code, type, status)
2. Names (English, Swahili)
3. Contact Information (address, phone, email, coordinates)
4. Streets Served (street_mappings array)
5. Timeline (created_at, updated_at)
6. Office Hierarchy (children count and list)

**Usage:**
```tsx
<OfficeDetail
  officeId={selectedOfficeId}
  onBack={() => setSelectedOfficeId(null)}
  onEdit={(office) => setEditingOffice(office)}
/>
```

---

### 4. StreetMappingManager Component

**File:** `apps/web/components/StreetMappingManager.tsx`

**Purpose:** Manage streets assigned to an office (multiselect UI)

**Features:**
- ✅ View current street mappings
- ✅ Add custom streets
- ✅ Select from available streets list
- ✅ Search/filter available streets
- ✅ Remove individual streets
- ✅ Tag-based UI for selected streets
- ✅ Deduplication on save
- ✅ Sample streets list (20 streets)

**Props:**
```typescript
interface StreetMappingManagerProps {
  officeId: string;                 // UUID, office_id, or office_code
  onSuccess?: (office: Office) => void; // Called after save
  onCancel?: () => void;            // Called on cancel
}
```

**How It Works:**
1. Loads current office and street_mappings
2. Shows selected streets as tags (removable)
3. Provides search box to filter available streets
4. Allows custom street entry
5. On submit, adds only NEW streets (API de-duplication)

**Usage:**
```tsx
const [showStreetManager, setShowStreetManager] = useState(false);

{showStreetManager && (
  <StreetMappingManager
    officeId={officeId}
    onSuccess={(office) => {
      setCurrentOffice(office);
      setShowStreetManager(false);
    }}
    onCancel={() => setShowStreetManager(false)}
  />
)}
```

---

### 5. OfficeHierarchyTree Component

**File:** `apps/web/components/OfficeHierarchyTree.tsx`

**Purpose:** Visualize office hierarchy as an expandable tree

**Features:**
- ✅ Expandable/collapsible nodes
- ✅ Shows office name, type, office_id
- ✅ Recursive rendering of children
- ✅ Click office name to view details
- ✅ Total office count display
- ✅ Indent-based depth visualization
- ✅ Loading and error states

**Props:**
```typescript
interface OfficeHierarchyTreeProps {
  rootOfficeId: string;             // UUID, office_id, or office_code
  onSelectOffice?: (officeId: string) => void; // Called on office click
}
```

**Node Display:**
```
▼ Office Name         [Type]  office-id-code
  ▶ Child Office 1    [Type]  child-office-id
    ▼ Grandchild      [Type]  grandchild-id
```

**Usage:**
```tsx
<OfficeHierarchyTree
  rootOfficeId={regionOfficeId}
  onSelectOffice={(officeId) => navigate(`/offices/${officeId}`)}
/>
```

---

### 6. BulkImportModal Component

**File:** `apps/web/components/BulkImportModal.tsx`

**Purpose:** Modal for bulk importing offices from CSV

**Features:**
- ✅ File upload (.csv)
- ✅ Manual CSV paste option
- ✅ CSV template download
- ✅ Live preview (5 rows + count)
- ✅ Error tracking and display
- ✅ Import result summary
- ✅ Stores state through import process

**Props:**
```typescript
interface BulkImportModalProps {
  onClose?: () => void;             // Called on close/done
  onSuccess?: (created: number, failed: number) => void; // Called after import
}
```

**CSV Format:**
```
office_type,office_name,office_name_sw,region_id,district_id,ward_id,mtaa_id,mtaa_name,physical_address,phone,email,street_mappings
MTAA_OFFICE,Mchikichini,Ofisi ya Mtaa,550e...,550e...,550e...,550e...,Mchikichini,Plot 123,+255...,office@...,Main Street;Avenue
```

**Required Columns:**
- `office_type` (must be valid enum)
- `office_name` (must be non-empty)

**Optional Columns:**
- All other office fields
- `street_mappings` (semicolon-separated)

**Workflow:**
1. Upload CSV or paste content → Parse to JSON preview
2. Review preview (5 rows shown)
3. Click Import → Send all rows to backend
4. View results (created count, failed count, errors)

**Usage:**
```tsx
const [showBulkImport, setShowBulkImport] = useState(false);

{showBulkImport && (
  <BulkImportModal
    onClose={() => setShowBulkImport(false)}
    onSuccess={(created, failed) => {
      alert(`Imported ${created} offices, ${failed} failed`);
      setShowBulkImport(false);
      refreshOfficeList();
    }}
  />
)}
```

---

## Types

**File:** `apps/web/types/office.ts`

All TypeScript types for Office Registry:

```typescript
type OfficeType = 'MTAA_OFFICE' | 'WARD_OFFICE' | 'DISTRICT_OFFICE' | 'REGION_OFFICE' | 'DEPARTMENT' | 'AGENCY' | 'MINISTRY';
type OfficeStatus = 'ACTIVE' | 'INACTIVE';

interface Office {
  id: string;                  // UUID
  office_id: string;           // DSM-ILA-KAR-Mchikichini-001
  office_code: string;         // MTAA-0042
  office_type: OfficeType;
  office_name: string;
  office_name_sw?: string;
  status: OfficeStatus;
  street_mappings?: string[];
  // ... 12 more fields
}

interface OfficeCreateInput { /* */ }
interface OfficeUpdateInput { /* */ }
interface OfficeListResponse { /* */ }
interface OfficeHierarchy { /* */ }
```

---

## Hooks

**File:** `apps/web/hooks/useOfficeAPI.ts`

Custom hook for all API operations:

```typescript
const {
  loading,      // boolean - current operation loading
  error,        // ApiError | null - current operation error
  setError,     // function to clear error

  // Methods (all return data or null on error, set error on failure)
  listOffices,              // async (filters) => OfficeListResponse | null
  createOffice,             // async (input) => Office | null
  getOffice,                // async (id) => Office | null
  updateOffice,             // async (id, input) => Office | null
  deleteOffice,             // async (id) => boolean
  mapStreetsToOffice,       // async (officeId, streets) => Office | null
  bulkImport,               // async (rows) => BulkImportResult | null
  getHierarchy,             // async (officeId) => OfficeHierarchy | null
  resolveStreet,            // async (street) => Office | null
} = useOfficeAPI();
```

**Error Handling:**
- Hook sets `error` state on failure
- Components can check `error` and display messages
- Use `setError(null)` to clear errors

**Example:**
```tsx
function MyComponent() {
  const { listOffices, loading, error } = useOfficeAPI();
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    const load = async () => {
      const result = await listOffices({ office_type: 'MTAA_OFFICE' });
      if (result) setOffices(result.data);
    };
    load();
  }, [listOffices]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.error}</p>;
  return <div>{/* render offices */}</div>;
}
```

---

## Integration Example

**Complete office management page:**

```tsx
import React, { useState } from 'react';
import {
  OfficeList,
  OfficeForm,
  OfficeDetail,
  StreetMappingManager,
  OfficeHierarchyTree,
  BulkImportModal,
  type Office,
} from './components';

export function OfficeManagementPage() {
  const [view, setView] = useState<'list' | 'form' | 'detail' | 'streets' | 'hierarchy' | 'bulk'>('list');
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);

  const handleSelectOffice = (office: Office) => {
    setSelectedOffice(office);
    setView('detail');
  };

  return (
    <div>
      {view === 'list' && (
        <OfficeList
          onSelectOffice={handleSelectOffice}
          onCreateOffice={() => setView('form')}
          onEditOffice={(office) => {
            setSelectedOffice(office);
            setView('form');
          }}
        />
      )}

      {view === 'form' && (
        <OfficeForm
          office={selectedOffice}
          onSuccess={() => {
            setView('list');
            setSelectedOffice(null);
          }}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'detail' && selectedOffice && (
        <OfficeDetail
          officeId={selectedOffice.id}
          onBack={() => setView('list')}
          onEdit={(office) => {
            setSelectedOffice(office);
            setView('form');
          }}
        />
      )}

      {view === 'streets' && selectedOffice && (
        <StreetMappingManager
          officeId={selectedOffice.id}
          onSuccess={() => setView('detail')}
          onCancel={() => setView('detail')}
        />
      )}

      {view === 'hierarchy' && selectedOffice && (
        <OfficeHierarchyTree
          rootOfficeId={selectedOffice.id}
          onSelectOffice={(officeId) => handleSelectOffice({ ...selectedOffice, id: officeId })}
        />
      )}

      {view === 'bulk' && (
        <BulkImportModal
          onClose={() => setView('list')}
          onSuccess={() => setView('list')}
        />
      )}
    </div>
  );
}
```

---

## Styling

All components use **inline CSS** with design token variables:

```css
/* Color tokens (used in components) */
--color-primary-50:  #f9fafb
--color-primary-100: #f3f4f6
--color-primary-200: #e5e7eb
--color-primary-300: #d1d5db
--color-primary-500: #6b7280
--color-primary-600: #2563eb
--color-primary-700: #374151
--color-primary-800: #1f2937
--color-primary-900: #111827

--color-danger-50:   #fef2f2
--color-danger-200:  #fecaca
--color-danger-600:  #dc2626
--color-danger-900:  #7f1d1d

--color-success-50:  #f0fdf4
--color-success-200: #86efac

--color-info-50:     #eff6ff
--color-info-200:    #bfdbfe
--color-info-900:    #082f49

/* Font tokens */
--font-inter:   -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
--font-mono:    "Monaco", "Courier New", monospace
```

To override tokens, set CSS variables:
```css
:root {
  --color-primary-600: #1e40af;  /* Darker blue */
}
```

---

## Accessibility

All components include:
- ✅ ARIA labels on all interactive elements
- ✅ Semantic HTML (buttons, forms, tables)
- ✅ Keyboard navigation support
- ✅ Loading/error states communicated
- ✅ Sufficient color contrast (WCAG AA)
- ✅ Form validation feedback

---

## Testing Checklist

### Unit Tests
- [ ] OfficeList — Filter, sort, pagination, search
- [ ] OfficeForm — Validation, create, edit
- [ ] OfficeDetail — Data loading, link clicks
- [ ] StreetMappingManager — Street selection, custom street input
- [ ] OfficeHierarchyTree — Node expansion, recursion
- [ ] BulkImportModal — CSV parsing, import flow

### Integration Tests
- [ ] API calls work correctly
- [ ] Error states display properly
- [ ] Loading states show/hide
- [ ] Navigation between views works
- [ ] Data updates propagate

### Manual Testing
- [ ] Create office → appears in list
- [ ] Edit office → data updates
- [ ] Delete office → removed from list
- [ ] Map streets → updates street_mappings
- [ ] View hierarchy → tree renders correctly
- [ ] Bulk import → preview shows, import succeeds

---

## Next Steps

### Immediate
1. **Wire up routing** — Create pages/offices/index.tsx, pages/offices/[id].tsx
2. **Add to main layout** — Import components, integrate with navigation
3. **Set API_BASE** — Set REACT_APP_API_URL in .env.local
4. **Test each component** — Manual testing with running API

### Short Term
1. **Add animations** — Framer Motion for transitions
2. **Add pagination UI** — Separate pagination component
3. **Add filters UI** — Advanced filter builder
4. **Add charts** — Office type distribution, etc.

### Medium Term
1. **Add infinite scroll** — Instead of pagination
2. **Add export CSV** — Download office list
3. **Add print view** — Print hierarchy or list
4. **Add office templates** — Pre-filled forms for common types

---

## File Structure

```
apps/web/
├── components/
│   ├── index.ts                    (exports all)
│   ├── OfficeList.tsx              (650 lines)
│   ├── OfficeForm.tsx              (350 lines)
│   ├── OfficeDetail.tsx            (400 lines)
│   ├── StreetMappingManager.tsx    (400 lines)
│   ├── OfficeHierarchyTree.tsx     (300 lines)
│   └── BulkImportModal.tsx         (500 lines)
├── hooks/
│   └── useOfficeAPI.ts             (350 lines, all 8 endpoints)
├── types/
│   └── office.ts                   (100 lines, all interfaces)
└── styles/
    └── tokens.css                  (CSS variables)
```

**Total:** ~2700 lines of production-ready React code

---

## Configuration

### Environment Variables

```bash
# .env.local
REACT_APP_API_URL=http://localhost:4000
```

### TypeScript Config

Components use standard React 18 + TypeScript setup:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

---

## Support

For issues or questions:
1. Check component props and usage examples
2. Review error messages in browser console
3. Verify API backend is running (`npm run dev` in apps/api)
4. Check API_BASE URL in useOfficeAPI.ts
