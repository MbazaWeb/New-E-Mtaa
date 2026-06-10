/**
 * StreetMappingManager Component
 * Manage streets assigned to an office with multiselect
 */

import React, { useState, useEffect } from 'react';
import { useOfficeAPI } from '../hooks/useOfficeAPI';
import type { Office } from '../types/office';

interface StreetMappingManagerProps {
  officeId: string;
  onSuccess?: (office: Office) => void;
  onCancel?: () => void;
}

// Sample streets for demo - in production, these would come from a database
const AVAILABLE_STREETS = [
  'Main Street',
  'Second Avenue',
  'Third Lane',
  'Fourth Road',
  'Fifth Boulevard',
  'Market Street',
  'School Road',
  'Hospital Lane',
  'Government Avenue',
  'Industrial Street',
  'Commercial Road',
  'Residential Drive',
  'Park Lane',
  'Garden Street',
  'Forest Road',
  'Beach Avenue',
  'River Road',
  'Valley Lane',
  'Mountain Street',
  'Sunrise Avenue',
];

export function StreetMappingManager({ officeId, onSuccess, onCancel }: StreetMappingManagerProps) {
  const { getOffice, mapStreetsToOffice, loading, error } = useOfficeAPI();
  const [office, setOffice] = useState<Office | null>(null);
  const [currentStreets, setCurrentStreets] = useState<Set<string>>(new Set());
  const [selectedStreets, setSelectedStreets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [newStreetInput, setNewStreetInput] = useState('');

  // Load office data
  useEffect(() => {
    const loadOffice = async () => {
      const data = await getOffice(officeId);
      if (data) {
        setOffice(data);
        setCurrentStreets(new Set(data.street_mappings || []));
        setSelectedStreets(new Set(data.street_mappings || []));
      }
    };
    loadOffice();
  }, [officeId, getOffice]);

  // Filter available streets
  const filteredStreets = AVAILABLE_STREETS.filter(
    (street) =>
      street.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedStreets.has(street),
  );

  // Toggle street selection
  const toggleStreet = (street: string) => {
    const updated = new Set(selectedStreets);
    if (updated.has(street)) {
      updated.delete(street);
    } else {
      updated.add(street);
    }
    setSelectedStreets(updated);
  };

  // Remove selected street
  const removeStreet = (street: string) => {
    const updated = new Set(selectedStreets);
    updated.delete(street);
    setSelectedStreets(updated);
  };

  // Add custom street
  const addCustomStreet = () => {
    const street = newStreetInput.trim();
    if (street && !selectedStreets.has(street)) {
      const updated = new Set(selectedStreets);
      updated.add(street);
      setSelectedStreets(updated);
      setNewStreetInput('');
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const streetsToAdd = Array.from(selectedStreets).filter(
      (street) => !currentStreets.has(street),
    );

    if (streetsToAdd.length > 0) {
      const result = await mapStreetsToOffice(officeId, streetsToAdd);
      if (result) {
        onSuccess?.(result);
      }
    } else {
      // No new streets to add
      onCancel?.();
    }
  };

  if (!office) {
    return (
      <div style={styles.container}>
        <p>Loading office...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Manage Streets - {office.office_name}</h2>

        {error && (
          <div style={styles.errorBanner}>
            <strong>Error:</strong> {error.error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Selected Streets */}
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Selected Streets ({selectedStreets.size})</h3>
            {selectedStreets.size > 0 ? (
              <div style={styles.streetTags}>
                {Array.from(selectedStreets)
                  .sort()
                  .map((street) => (
                    <div key={street} style={styles.tag}>
                      <span>{street}</span>
                      <button
                        type="button"
                        onClick={() => removeStreet(street)}
                        style={styles.tagRemoveButton}
                        aria-label={`Remove ${street}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={styles.emptyMessage}>No streets selected yet</p>
            )}
          </div>

          {/* Add Custom Street */}
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Add Custom Street</h3>
            <div style={styles.customStreetInput}>
              <input
                type="text"
                value={newStreetInput}
                onChange={(e) => setNewStreetInput(e.target.value)}
                placeholder="Type street name and press Add"
                style={styles.input}
                disabled={loading}
                aria-label="Custom street name"
              />
              <button
                type="button"
                onClick={addCustomStreet}
                style={styles.buttonSecondary}
                disabled={loading || !newStreetInput.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Available Streets */}
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Available Streets</h3>
            <div style={styles.searchBox}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search streets..."
                style={styles.input}
                aria-label="Search available streets"
              />
            </div>

            {filteredStreets.length > 0 ? (
              <div style={styles.streetCheckboxes}>
                {filteredStreets.map((street) => (
                  <label key={street} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleStreet(street)}
                      style={styles.checkbox}
                      disabled={loading}
                      aria-label={`Add ${street}`}
                    />
                    <span>{street}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p style={styles.emptyMessage}>
                {searchQuery
                  ? 'No streets match your search'
                  : 'All available streets have been selected'}
              </p>
            )}
          </div>

          {/* Info Banner */}
          <div style={styles.infoBanner}>
            <strong>Tip:</strong> Streets assigned to this office will be used to automatically assign
            citizens to this office during registration.
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Saving...' : 'Save Streets'}
            </button>
            <button type="button" onClick={onCancel} style={styles.buttonSecondary} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '2rem auto',
    padding: '1rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '2rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    color: 'var(--color-primary-900, #1f2937)',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  } as React.CSSProperties,
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: 'var(--color-primary-800, #1f2937)',
  } as React.CSSProperties,
  streetTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  } as React.CSSProperties,
  tag: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    border: '1px solid var(--color-primary-300, #d1d5db)',
    borderRadius: '9999px',
    padding: '0.5rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  tagRemoveButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-danger-600, #dc2626)',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  } as React.CSSProperties,
  customStreetInput: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-primary-300, #d1d5db)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  searchBox: {
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  streetCheckboxes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem',
  } as React.CSSProperties,
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  checkbox: {
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyMessage: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-500, #6b7280)',
    fontStyle: 'italic',
  } as React.CSSProperties,
  errorBanner: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    color: 'var(--color-danger-900, #7f1d1d)',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    border: '1px solid var(--color-danger-200, #fecaca)',
  } as React.CSSProperties,
  infoBanner: {
    backgroundColor: 'var(--color-info-50, #eff6ff)',
    color: 'var(--color-info-900, #082f49)',
    padding: '1rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-info-200, #bfdbfe)',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
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
  } as React.CSSProperties,
  buttonSecondary: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    color: 'var(--color-primary-700, #374151)',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
};
