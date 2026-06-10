/**
 * OfficeForm Component
 * Form for creating or editing an office
 */

import React, { useState, useEffect } from 'react';
import { useOfficeAPI } from '../hooks/useOfficeAPI';
import { OFFICE_TYPES, type Office, type OfficeCreateInput, type OfficeUpdateInput } from '../types/office';

interface OfficeFormProps {
  office?: Office;
  onSuccess?: (office: Office) => void;
  onCancel?: () => void;
}

export function OfficeForm({ office, onSuccess, onCancel }: OfficeFormProps) {
  const { createOffice, updateOffice, loading, error } = useOfficeAPI();
  const [formData, setFormData] = useState<OfficeCreateInput | OfficeUpdateInput>({
    office_type: 'MTAA_OFFICE',
    office_name: '',
    office_name_sw: '',
    physical_address: '',
    phone: '',
    email: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with office data if editing
  useEffect(() => {
    if (office) {
      setFormData({
        office_type: office.office_type,
        office_name: office.office_name,
        office_name_sw: office.office_name_sw || '',
        physical_address: office.physical_address || '',
        phone: office.phone || '',
        email: office.email || '',
      });
    }
  }, [office]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.office_name?.trim()) {
      errors.office_name = 'Office name is required';
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Invalid email format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let result: Office | null = null;

    if (office) {
      // Update existing office
      result = await updateOffice(office.id, formData as OfficeUpdateInput);
    } else {
      // Create new office
      result = await createOffice(formData as OfficeCreateInput);
    }

    if (result) {
      onSuccess?.(result);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{office ? 'Edit Office' : 'Create New Office'}</h2>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBanner}>
            <strong>Error:</strong> {error.error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Office Type */}
          <div style={styles.formGroup}>
            <label htmlFor="office_type" style={styles.label}>
              Office Type *
            </label>
            <select
              id="office_type"
              name="office_type"
              value={formData.office_type || ''}
              onChange={handleChange}
              style={styles.input}
              disabled={loading}
              required
            >
              {OFFICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Office Name */}
          <div style={styles.formGroup}>
            <label htmlFor="office_name" style={styles.label}>
              Office Name (English) *
            </label>
            <input
              id="office_name"
              type="text"
              name="office_name"
              value={formData.office_name || ''}
              onChange={handleChange}
              placeholder="e.g., Mchikichini Mtaa Office"
              style={styles.input}
              disabled={loading}
              required
            />
            {validationErrors.office_name && (
              <span style={styles.error}>{validationErrors.office_name}</span>
            )}
          </div>

          {/* Office Name Swahili */}
          <div style={styles.formGroup}>
            <label htmlFor="office_name_sw" style={styles.label}>
              Office Name (Swahili)
            </label>
            <input
              id="office_name_sw"
              type="text"
              name="office_name_sw"
              value={formData.office_name_sw || ''}
              onChange={handleChange}
              placeholder="e.g., Ofisi ya Mtaa wa Mchikichini"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {/* Physical Address */}
          <div style={styles.formGroup}>
            <label htmlFor="physical_address" style={styles.label}>
              Physical Address
            </label>
            <textarea
              id="physical_address"
              name="physical_address"
              value={formData.physical_address || ''}
              onChange={handleChange}
              placeholder="e.g., Plot 123, Main Street"
              style={{ ...styles.input, minHeight: '100px' }}
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div style={styles.formGroup}>
            <label htmlFor="phone" style={styles.label}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="e.g., +255 654 123456"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="e.g., office@example.com"
              style={styles.input}
              disabled={loading}
            />
            {validationErrors.email && <span style={styles.error}>{validationErrors.email}</span>}
          </div>

          {/* Info Message */}
          <div style={styles.infoBanner}>
            <strong>Note:</strong> Office ID and Code are auto-generated based on office hierarchy and type.
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Saving...' : office ? 'Update Office' : 'Create Office'}
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
    maxWidth: '600px',
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
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-primary-700, #374151)',
  } as React.CSSProperties,
  input: {
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-primary-300, #d1d5db)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,
  error: {
    fontSize: '0.75rem',
    color: 'var(--color-danger-600, #dc2626)',
    marginTop: '0.25rem',
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
    transition: 'background-color 0.2s',
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
