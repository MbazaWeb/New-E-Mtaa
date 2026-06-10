/**
 * OfficeList Component
 * Displays offices in a table with filtering, sorting, and pagination
 */

import React, { useState, useEffect } from 'react';
import { useOfficeAPI } from '../hooks/useOfficeAPI';
import { OFFICE_TYPES, type Office, type OfficeType } from '../types/office';

interface OfficeListProps {
  onSelectOffice?: (office: Office) => void;
  onCreateOffice?: () => void;
  onEditOffice?: (office: Office) => void;
  onDeleteOffice?: (officeId: string) => void;
}

export function OfficeList({
  onSelectOffice,
  onCreateOffice,
  onEditOffice,
  onDeleteOffice,
}: OfficeListProps) {
  const { listOffices, deleteOffice, loading, error } = useOfficeAPI();
  const [offices, setOffices] = useState<Office[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);

  // Filters
  const [officeTypeFilter, setOfficeTypeFilter] = useState<OfficeType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load offices
  useEffect(() => {
    const loadOffices = async () => {
      const result = await listOffices({
        office_type: officeTypeFilter || undefined,
        status: statusFilter || undefined,
        skip,
        take,
      });

      if (result) {
        let filtered = result.data;

        // Client-side search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (o) =>
              o.office_name.toLowerCase().includes(query) ||
              o.office_id.toLowerCase().includes(query) ||
              o.office_code.toLowerCase().includes(query),
          );
        }

        // Client-side sorting
        filtered.sort((a, b) => {
          let compareValue = 0;

          switch (sortBy) {
            case 'name':
              compareValue = a.office_name.localeCompare(b.office_name);
              break;
            case 'type':
              compareValue = a.office_type.localeCompare(b.office_type);
              break;
            case 'created':
              compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              break;
          }

          return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setOffices(filtered);
        setTotal(filtered.length);
      }
    };

    loadOffices();
  }, [listOffices, officeTypeFilter, statusFilter, skip, take, searchQuery, sortBy, sortOrder]);

  // Handle delete
  const handleDelete = async (officeId: string) => {
    if (window.confirm('Are you sure you want to deactivate this office?')) {
      const success = await deleteOffice(officeId);
      if (success) {
        setOffices(offices.filter((o) => o.id !== officeId));
        onDeleteOffice?.(officeId);
      }
    }
  };

  // Reset pagination
  const resetPagination = () => {
    setSkip(0);
  };

  return (
    <div className="office-list" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Office Registry</h1>
        <button onClick={() => onCreateOffice?.()} style={styles.buttonPrimary}>
          + Create Office
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorBanner}>
          <strong>Error:</strong> {error.error}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label htmlFor="search-input" style={styles.label}>
            Search
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Name, ID, or Code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetPagination();
            }}
            style={styles.input}
            aria-label="Search offices"
          />
        </div>

        <div style={styles.filterGroup}>
          <label htmlFor="type-filter" style={styles.label}>
            Office Type
          </label>
          <select
            id="type-filter"
            value={officeTypeFilter}
            onChange={(e) => {
              setOfficeTypeFilter(e.target.value as OfficeType | '');
              resetPagination();
            }}
            style={styles.select}
            aria-label="Filter by office type"
          >
            <option value="">All Types</option>
            {OFFICE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label htmlFor="status-filter" style={styles.label}>
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | '');
              resetPagination();
            }}
            style={styles.select}
            aria-label="Filter by status"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label htmlFor="sort-by" style={styles.label}>
            Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={styles.select}
            aria-label="Sort offices"
          >
            <option value="created">Date Created</option>
            <option value="name">Office Name</option>
            <option value="type">Office Type</option>
          </select>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          style={styles.buttonSecondary}
          title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          aria-label={`Sort order: ${sortOrder}`}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingContainer}>
          <p>Loading offices...</p>
        </div>
      )}

      {/* Table */}
      {!loading && offices.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Office ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((office, idx) => (
                <tr key={office.id} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>
                    <code style={styles.code}>{office.office_id}</code>
                  </td>
                  <td style={styles.td}>{office.office_name}</td>
                  <td style={styles.td}>{office.office_type.replace('_OFFICE', '').replace('_', ' ')}</td>
                  <td style={styles.td}>
                    {office.phone && <div>{office.phone}</div>}
                    {office.email && <div style={{ fontSize: '0.85rem', color: '#666' }}>{office.email}</div>}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: office.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {office.status}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(office.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => onSelectOffice?.(office)}
                      style={styles.buttonSmall}
                      title="View details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditOffice?.(office)}
                      style={{ ...styles.buttonSmall, marginLeft: '0.5rem' }}
                      title="Edit office"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(office.id)}
                      style={{ ...styles.buttonSmall, ...styles.buttonDanger, marginLeft: '0.5rem' }}
                      title="Delete office"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && offices.length === 0 && (
        <div style={styles.emptyState}>
          <p>No offices found</p>
          <button onClick={() => onCreateOffice?.()} style={styles.buttonPrimary}>
            Create First Office
          </button>
        </div>
      )}

      {/* Pagination */}
      {total > take && (
        <div style={styles.pagination}>
          <button
            onClick={() => setSkip(Math.max(0, skip - take))}
            disabled={skip === 0}
            style={styles.paginationButton}
          >
            ← Previous
          </button>
          <span style={styles.paginationInfo}>
            Showing {skip + 1} - {Math.min(skip + take, total)} of {total}
          </span>
          <button
            onClick={() => setSkip(skip + take)}
            disabled={skip + take >= total}
            style={styles.paginationButton}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// Styles using inline CSS for simplicity
const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-primary-900, #1f2937)',
  } as React.CSSProperties,
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
    alignItems: 'flex-end',
  } as React.CSSProperties,
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-primary-700, #374151)',
  } as React.CSSProperties,
  input: {
    padding: '0.625rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-primary-200, #e5e7eb)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  select: {
    padding: '0.625rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-primary-200, #e5e7eb)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: 'var(--color-primary-600, #2563eb)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  buttonSecondary: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    color: 'var(--color-primary-700, #374151)',
    padding: '0.625rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '0.375rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
  } as React.CSSProperties,
  headerRow: {
    backgroundColor: 'var(--color-primary-50, #f9fafb)',
  } as React.CSSProperties,
  th: {
    padding: '1rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: 'var(--color-primary-900, #111827)',
    borderBottom: '2px solid var(--color-primary-200, #e5e7eb)',
  } as React.CSSProperties,
  td: {
    padding: '1rem',
    borderBottom: '1px solid var(--color-primary-100, #f3f4f6)',
  } as React.CSSProperties,
  rowEven: {
    backgroundColor: 'white',
  } as React.CSSProperties,
  rowOdd: {
    backgroundColor: 'var(--color-primary-50, #f9fafb)',
  } as React.CSSProperties,
  code: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontFamily: 'var(--font-mono, "Monaco", "Courier New", monospace)',
    fontSize: '0.8rem',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'white',
  } as React.CSSProperties,
  buttonSmall: {
    backgroundColor: 'var(--color-primary-600, #2563eb)',
    color: 'white',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.25rem',
    border: 'none',
    fontSize: '0.75rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  buttonDanger: {
    backgroundColor: 'var(--color-danger-600, #dc2626)',
  } as React.CSSProperties,
  errorBanner: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    color: 'var(--color-danger-900, #7f1d1d)',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    border: '1px solid var(--color-danger-200, #fecaca)',
  } as React.CSSProperties,
  loadingContainer: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: 'var(--color-primary-600, #2563eb)',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: 'var(--color-primary-600, #666)',
  } as React.CSSProperties,
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
  } as React.CSSProperties,
  paginationButton: {
    backgroundColor: 'var(--color-primary-600, #2563eb)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  paginationInfo: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-700, #374151)',
  } as React.CSSProperties,
};
