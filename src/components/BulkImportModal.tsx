/**
 * BulkImportModal Component
 * Modal for bulk importing offices from CSV or array data
 */

import React, { useState, useRef } from 'react';
import { useOfficeAPI } from '../hooks/useOfficeAPI';
import { OFFICE_TYPES, type OfficeCreateInput } from '../types/office';

interface BulkImportModalProps {
  onClose?: () => void;
  onSuccess?: (created: number, failed: number) => void;
}

export function BulkImportModal({ onClose, onSuccess }: BulkImportModalProps) {
  const { bulkImport, loading, error } = useOfficeAPI();
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<OfficeCreateInput[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: any[] } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV
  const parseCSV = (content: string): OfficeCreateInput[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: OfficeCreateInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, idx) => {
        if (values[idx]) {
          row[header] = values[idx];
        }
      });

      if (row.office_type && row.office_name) {
        rows.push({
          office_type: row.office_type,
          office_name: row.office_name,
          office_name_sw: row.office_name_sw,
          region_id: row.region_id,
          district_id: row.district_id,
          ward_id: row.ward_id,
          mtaa_id: row.mtaa_id,
          mtaa_name: row.mtaa_name,
          physical_address: row.physical_address,
          phone: row.phone,
          email: row.email,
          street_mappings: row.street_mappings ? row.street_mappings.split(';') : [],
        });
      }
    }

    return rows;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        const parsed = parseCSV(content);
        setPreview(parsed);
      };
      reader.readAsText(file);
    }
  };

  // Handle manual CSV input
  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setCsvContent(content);
    const parsed = parseCSV(content);
    setPreview(parsed);
  };

  // Handle import
  const handleImport = async () => {
    if (preview.length === 0) {
      alert('Please add some offices to import');
      return;
    }

    const result = await bulkImport(preview);
    if (result) {
      setImportResult(result);
      onSuccess?.(result.created, result.failed);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = `office_type,office_name,office_name_sw,region_id,district_id,ward_id,mtaa_id,mtaa_name,physical_address,phone,email,street_mappings
MTAA_OFFICE,Mchikichini Mtaa Office,Ofisi ya Mtaa wa Mchikichini,550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002,550e8400-e29b-41d4-a716-446655440003,Mchikichini,Plot 123 Main Street,+255 654 123456,mchikichini@example.com,Main Street;Second Avenue
MTAA_OFFICE,Kariakoo Mtaa Office,Ofisi ya Mtaa wa Kariakoo,550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002,550e8400-e29b-41d4-a716-446655440004,Kariakoo,Plot 456 Kariakoo Ave,+255 654 234567,kariakoo@example.com,Kariakoo Avenue;Pamba Street`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'office_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Bulk Import Offices</h2>
          <button onClick={onClose} style={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <strong>Error:</strong> {error.error}
          </div>
        )}

        {!importResult ? (
          <>
            {/* Instructions */}
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Instructions</h3>
              <ol style={styles.instructions}>
                <li>Download the CSV template or prepare your own</li>
                <li>Fill in office details (office_type and office_name are required)</li>
                <li>Upload the CSV file or paste content below</li>
                <li>Review the preview and click Import</li>
              </ol>
              <button onClick={downloadTemplate} style={styles.downloadButton}>
                📥 Download CSV Template
              </button>
            </div>

            {/* File Upload */}
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Upload CSV File</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={styles.fileInput}
                aria-label="Upload CSV file"
                disabled={loading}
              />
            </div>

            {/* Manual CSV Input */}
            <div style={styles.section}>
              <h3 style={styles.subtitle}>Or Paste CSV Content</h3>
              <textarea
                value={csvContent}
                onChange={handleCsvChange}
                placeholder="office_type,office_name,office_name_sw,...
MTAA_OFFICE,Office Name,Jina la Ofisi,..."
                style={styles.textarea}
                disabled={loading}
              />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.subtitle}>Preview ({preview.length} offices)</h3>
                <div style={styles.previewTable}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.headerRow}>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Phone</th>
                        <th style={styles.th}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 5).map((office, idx) => (
                        <tr key={idx} style={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                          <td style={styles.td}>{office.office_type.replace('_OFFICE', '')}</td>
                          <td style={styles.td}>{office.office_name}</td>
                          <td style={styles.td}>{office.phone || '-'}</td>
                          <td style={styles.td}>{office.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 5 && (
                    <p style={styles.moreCount}>... and {preview.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Import Button */}
            <div style={styles.buttonGroup}>
              <button
                onClick={handleImport}
                style={styles.buttonPrimary}
                disabled={loading || preview.length === 0}
              >
                {loading ? 'Importing...' : `Import ${preview.length} Offices`}
              </button>
              <button onClick={onClose} style={styles.buttonSecondary} disabled={loading}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Import Result */}
            <div style={styles.resultContainer}>
              <div style={styles.resultSuccess}>
                <div style={styles.resultNumber}>{importResult.created}</div>
                <div style={styles.resultLabel}>Offices Created</div>
              </div>
              {importResult.failed > 0 && (
                <div style={styles.resultError}>
                  <div style={styles.resultNumber}>{importResult.failed}</div>
                  <div style={styles.resultLabel}>Failed</div>
                </div>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.subtitle}>Errors</h3>
                <div style={styles.errorList}>
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx} style={styles.errorItem}>
                      <strong>Row {err.rowIndex + 1}:</strong> {err.error}
                    </div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <p style={styles.moreCount}>... and {importResult.errors.length - 5} more errors</p>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div style={styles.buttonGroup}>
              <button onClick={onClose} style={styles.buttonPrimary}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    backgroundColor: 'white',
    borderRadius: '0.375rem',
    boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
    padding: '2rem',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    width: '90%',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-primary-900, #1f2937)',
  } as React.CSSProperties,
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--color-primary-600, #666)',
  } as React.CSSProperties,
  section: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: 'var(--color-primary-800, #1f2937)',
  } as React.CSSProperties,
  instructions: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-700, #374151)',
    marginBottom: '1rem',
  } as React.CSSProperties,
  downloadButton: {
    backgroundColor: 'var(--color-primary-600, #2563eb)',
    color: 'white',
    padding: '0.625rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  fileInput: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-primary-300, #d1d5db)',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-primary-300, #d1d5db)',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono, monospace)',
  } as React.CSSProperties,
  previewTable: {
    overflowX: 'auto' as const,
    borderRadius: '0.375rem',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.75rem',
  } as React.CSSProperties,
  headerRow: {
    backgroundColor: 'var(--color-primary-50, #f9fafb)',
  } as React.CSSProperties,
  th: {
    padding: '0.5rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    borderBottom: '1px solid var(--color-primary-200, #e5e7eb)',
  } as React.CSSProperties,
  td: {
    padding: '0.5rem',
    borderBottom: '1px solid var(--color-primary-100, #f3f4f6)',
  } as React.CSSProperties,
  rowEven: {
    backgroundColor: 'white',
  } as React.CSSProperties,
  rowOdd: {
    backgroundColor: 'var(--color-primary-50, #f9fafb)',
  } as React.CSSProperties,
  moreCount: {
    fontSize: '0.75rem',
    color: 'var(--color-primary-600, #666)',
    margin: '0.5rem 0 0 0',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  resultContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  resultSuccess: {
    backgroundColor: 'var(--color-success-50, #f0fdf4)',
    padding: '1.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-success-200, #86efac)',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  resultError: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    padding: '1.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-danger-200, #fecaca)',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  resultNumber: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--color-primary-900, #111827)',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  resultLabel: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-700, #374151)',
  } as React.CSSProperties,
  errorList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  } as React.CSSProperties,
  errorItem: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    color: 'var(--color-danger-900, #7f1d1d)',
  } as React.CSSProperties,
  errorBanner: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    color: 'var(--color-danger-900, #7f1d1d)',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    border: '1px solid var(--color-danger-200, #fecaca)',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
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
    flex: 1,
  } as React.CSSProperties,
  buttonSecondary: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    color: 'var(--color-primary-700, #374151)',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
    flex: 1,
  } as React.CSSProperties,
};
