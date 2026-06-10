/**
 * OfficeHierarchyTree Component
 * Visual representation of office hierarchy
 */

import React, { useState, useEffect } from 'react';
import { useOfficeAPI } from '../hooks/useOfficeAPI';
import type { OfficeHierarchy } from '../types/office';

interface OfficeHierarchyTreeProps {
  rootOfficeId: string;
  onSelectOffice?: (officeId: string) => void;
}

export function OfficeHierarchyTree({ rootOfficeId, onSelectOffice }: OfficeHierarchyTreeProps) {
  const { getHierarchy, loading, error } = useOfficeAPI();
  const [hierarchy, setHierarchy] = useState<OfficeHierarchy | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([rootOfficeId]));

  useEffect(() => {
    const loadHierarchy = async () => {
      const data = await getHierarchy(rootOfficeId);
      if (data) {
        setHierarchy(data);
      }
    };
    loadHierarchy();
  }, [rootOfficeId, getHierarchy]);

  const toggleNode = (nodeId: string) => {
    const updated = new Set(expandedNodes);
    if (updated.has(nodeId)) {
      updated.delete(nodeId);
    } else {
      updated.add(nodeId);
    }
    setExpandedNodes(updated);
  };

  const renderNode = (node: OfficeHierarchy, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ ...styles.node, marginLeft: `${depth * 1.5}rem` }}>
        <div style={styles.nodeContent}>
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              style={styles.expandButton}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.office_name}`}
              title={`${isExpanded ? 'Collapse' : 'Expand'} node`}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span style={styles.leafPlaceholder}></span>}

          <div style={styles.nodeInfo}>
            <button
              onClick={() => onSelectOffice?.(node.id)}
              style={styles.nodeButton}
              title="View office details"
            >
              <strong>{node.office_name}</strong>
            </button>
            <span style={styles.nodeType}>{node.office_type.replace('_OFFICE', '').replace('_', ' ')}</span>
            <code style={styles.nodeId}>{node.office_id}</code>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div style={styles.childrenContainer}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading hierarchy...</p>
      </div>
    );
  }

  if (error || !hierarchy) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>
          <strong>Error:</strong> {error?.error || 'Failed to load hierarchy'}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Office Hierarchy</h2>
        <div style={styles.tree}>{renderNode(hierarchy)}</div>
        <div style={styles.legend}>
          <p style={styles.legendText}>
            <strong>Total offices:</strong> {countNodes(hierarchy)}
          </p>
          <p style={styles.legendText}>
            Click on an office name to view details, or click the arrow to expand/collapse.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to count total nodes
function countNodes(node: OfficeHierarchy): number {
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }
  return count;
}

const styles = {
  container: {
    maxWidth: '900px',
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
  tree: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.875rem',
    marginBottom: '2rem',
  } as React.CSSProperties,
  node: {
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  nodeContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  expandButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-primary-600, #2563eb)',
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.875rem',
    width: '1.5rem',
    textAlign: 'center' as const,
    flexShrink: 0,
  } as React.CSSProperties,
  leafPlaceholder: {
    display: 'inline-block',
    width: '1.5rem',
  } as React.CSSProperties,
  nodeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
  } as React.CSSProperties,
  nodeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-primary-600, #2563eb)',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left' as const,
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
  } as React.CSSProperties,
  nodeType: {
    backgroundColor: 'var(--color-primary-100, #f3f4f6)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    color: 'var(--color-primary-700, #374151)',
  } as React.CSSProperties,
  nodeId: {
    color: 'var(--color-primary-500, #6b7280)',
    fontSize: '0.75rem',
  } as React.CSSProperties,
  childrenContainer: {
    position: 'relative' as const,
  } as React.CSSProperties,
  legend: {
    borderTop: '1px solid var(--color-primary-200, #e5e7eb)',
    paddingTop: '1rem',
  } as React.CSSProperties,
  legendText: {
    fontSize: '0.875rem',
    color: 'var(--color-primary-600, #666)',
    margin: '0.25rem 0',
  } as React.CSSProperties,
  errorBanner: {
    backgroundColor: 'var(--color-danger-50, #fef2f2)',
    color: 'var(--color-danger-900, #7f1d1d)',
    padding: '1rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--color-danger-200, #fecaca)',
  } as React.CSSProperties,
};
