/**
 * OfficeDetail Component
 * Shows detailed information about a single office
 */

import React, { useState, useEffect } from 'react';
import { useOfficeAPI } from '../hooks/useOfficeAPI';
import type { Office } from '../types/office';

interface OfficeDetailProps {
  officeId: string;
  onBack?: () => void;
  onEdit?: (office: Office) => void;
}

export function OfficeDetail({ officeId, onBack, onEdit }: OfficeDetailProps) {
  const { getOffice, getHierarchy, loading, error } = useOfficeAPI();
  const [office, setOffice] = useState<Office | null>(null);
  const [hierarchy, setHierarchy] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [officeData, hierarchyData] = await Promise.all([getOffice(officeId), getHierarchy(officeId)]);
      if (officeData) setOffice(officeData);
      if (hierarchyData) setHierarchy(hierarchyData);
    };
    loadData();
  }, [officeId, getOffice, getHierarchy]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading office details...</p>
      </div>
    );
  }

  if (error || !office) {
    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <div style={styles.errorBanner}>
          <strong>Error:</strong> {error?.error || 'Office not found'}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>{office.office_name}</h1>
        <button onClick={() => onEdit?.(office)} style={styles.editButton}>
          Edit
        </button>
      </div>

      {/* Main Info Card */}
      <div style={styles.card}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Office ID</span>
              <code style={styles.code}>{office.office_id}</code>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Office Code</span>
              <code style={styles.code}>{office.office_code}</code>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Office Type</span>
              <span>{office.office_type.replace('_OFFICE', '').replace('_', ' ')}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Status</span>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: office.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                }}
              >
                {office.status}
              </span>
            </div>
          </div>
        </div>

        {/* Names */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Names</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>English Name</span>
              <p style={styles.value}>{office.office_name}</p>
            </div>
            {office.office_name_sw && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Swahili Name</span>
                <p style={styles.value}>{office.office_name_sw}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Contact Information</h2>
          <div style={styles.grid}>
            {office.physical_address && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Physical Address</span>
                <p style={styles.value}>{office.physical_address}</p>
              </div>
            )}
            {office.phone && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Phone</span>
                <a href={`tel:${office.phone}`} style={styles.link}>
                  {office.phone}
                </a>
              </div>
            )}
            {office.email && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Email</span>
                <a href={`mailto:${office.email}`} style={styles.link}>
                  {office.email}
                </a>
              </div>
            )}
            {office.latitude && office.longitude && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Coordinates</span>
                <p style={styles.value}>
                  {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Street Mappings */}
        {office.street_mappings && office.street_mappings.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Streets Served</h2>
            <div style={styles.streetList}>
              {office.street_mappings.map((street, idx) => (
                <div key={idx} style={styles.streetItem}>
                  {street}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Timeline</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Created</span>
              <p style={styles.value}>{new Date(office.created_at).toLocaleString()}</p>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Last Updated</span>
              <p style={styles.value}>{new Date(office.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Hierarchy */}
        {hierarchy && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Office Hierarchy</h2>
            <div style={styles.hierarchyInfo}>
              <p>
                <strong>Children:</strong> {hierarchy.children?.length || 0} office(s)
              </p>
              {hierarchy.children && hierarchy.children.length > 0 && (
                <ul style={styles.hierarchyList}>
                  {hierarchy.children.map((child: any) => (
                    <li key={child.id}>
                      {child.office_name} ({child.office_type})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '1rem',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  } as React.CSSProperties,
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-primary-600, #2563eb)',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: 0,
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: 0,
    flex: 1,
    color: 'var(--color-primary-900, #1f2937)',
  } as React.CSSProperties,
  editButton: {
    backgroundColor: 'var(--color-primary-600, #2563eb)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
  } as React.CSSProperties,
  section: {
    borderBottom: '1px solid var(--color-primary-100, #f3f4f6)',
    paddingBottom: '2rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: 'var(--color-primary-900, #111827)',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  } as React.CSSProperties,
  fieldLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-primary-600, #2563eb)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  value: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-700, #374151)',
    margin: 0,
  } as React.CSSProperties,
  code: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.8rem',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'white',
    width: 'fit-content',
  } as React.CSSProperties,
  link: {
    color: 'var(--color-primary-600, #2563eb)',
    textDecoration: 'none',
  } as React.CSSProperties,
  streetList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
  } as React.CSSProperties,
  streetItem: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  hierarchyInfo: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-700, #374151)',
  } as React.CSSProperties,
  hierarchyList: {
    marginTop: '0.75rem',
    paddingLeft: '1.5rem',
  } as React.CSSProperties,
  errorBanner: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    color: 'var(--color-danger-900, #7f1d1d)',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginTop: '1rem',
    border: '1px solid var(--color-danger-200, #fecaca)',
  } as React.CSSProperties,
};
