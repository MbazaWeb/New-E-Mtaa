/**
 * Hook for Office Registry API integration
 * Handles all API calls to backend endpoints
 */

import { useState, useCallback } from 'react';
import type {
  Office,
  OfficeCreateInput,
  OfficeUpdateInput,
  OfficeListResponse,
  OfficeHierarchy,
  ApiError,
} from '../types/office';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

interface UseOfficeAPIState {
  loading: boolean;
  error: ApiError | null;
}

export function useOfficeAPI() {
  const [state, setState] = useState<UseOfficeAPIState>({
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: ApiError | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // ============ LIST ============
  const listOffices = useCallback(
    async (filters?: {
      office_type?: string;
      region_id?: string;
      district_id?: string;
      ward_id?: string;
      status?: string;
      skip?: number;
      take?: number;
    }): Promise<OfficeListResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }

        const response = await fetch(`${API_BASE}/api/offices?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const data: OfficeListResponse = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ CREATE ============
  const createOffice = useCallback(
    async (input: OfficeCreateInput): Promise<Office | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const { data }: { data: Office } = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ GET ============
  const getOffice = useCallback(
    async (id: string): Promise<Office | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const { data }: { data: Office } = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ UPDATE ============
  const updateOffice = useCallback(
    async (id: string, input: OfficeUpdateInput): Promise<Office | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const { data }: { data: Office } = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ DELETE ============
  const deleteOffice = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return false;
        }

        return true;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ MAP STREETS ============
  const mapStreetsToOffice = useCallback(
    async (officeId: string, streets: string[]): Promise<Office | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/street-mapping/${officeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streets }),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const { data }: { data: Office } = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ BULK IMPORT ============
  const bulkImport = useCallback(
    async (rows: OfficeCreateInput[]): Promise<{ created: number; failed: number; errors: any[] } | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/bulk-import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows }),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const result = await response.json();
        return result;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ GET HIERARCHY ============
  const getHierarchy = useCallback(
    async (officeId: string): Promise<OfficeHierarchy | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/hierarchy/${officeId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const { data }: { data: OfficeHierarchy } = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // ============ RESOLVE STREET ============
  const resolveStreet = useCallback(
    async (street: string): Promise<Office | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/offices/resolve-street`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ street }),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error);
          return null;
        }

        const { data }: { data: Office | null } = await response.json();
        return data;
      } catch (err: any) {
        const error: ApiError = { error: err.message };
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  return {
    // State
    loading: state.loading,
    error: state.error,
    setError,

    // Methods
    listOffices,
    createOffice,
    getOffice,
    updateOffice,
    deleteOffice,
    mapStreetsToOffice,
    bulkImport,
    getHierarchy,
    resolveStreet,
  };
}
