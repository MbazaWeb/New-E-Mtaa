/**
 * Phase 2 Office Registry Components
 * Export all components for easy importing
 */

export { OfficeList } from './OfficeList';
export { OfficeForm } from './OfficeForm';
export { OfficeDetail } from './OfficeDetail';
export { StreetMappingManager } from './StreetMappingManager';
export { OfficeHierarchyTree } from './OfficeHierarchyTree';
export { BulkImportModal } from './BulkImportModal';

// Export types
export type { OfficeType, OfficeStatus, Office, OfficeCreateInput, OfficeUpdateInput, OfficeListResponse, OfficeHierarchy, LocationHierarchy, ApiError } from '../types/office';
export { OFFICE_TYPES } from '../types/office';

// Export hooks
export { useOfficeAPI } from '../hooks/useOfficeAPI';
