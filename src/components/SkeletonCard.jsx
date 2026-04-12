/* Skeleton loading card */
import React from 'react';

export default function SkeletonCard({ count = 1, compact = false }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="card" style={{ overflow: 'hidden' }}>
      <div
        className="skeleton"
        style={{ aspectRatio: compact ? '4/5' : '1/1', borderRadius: 0 }}
      />
      {!compact && (
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)' }}>
          <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '50%' }} />
        </div>
      )}
    </div>
  ));
}
