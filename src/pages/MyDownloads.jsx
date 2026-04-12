/* My Downloads page */
import React from 'react';
import { Download } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import useTemplateStore from '../stores/templateStore';

export default function MyDownloads() {
  const { downloads, templates } = useTemplateStore();

  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)' }}>
      <SEOHead title="My Downloads" description="Your downloaded wish templates." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)' }}>
        📥 My Downloads
      </h1>
      {downloads.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {downloads.map((d, i) => {
            const tpl = templates.find(t => t.id === d.id);
            return (
              <div key={i} className="card-flat" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: tpl?.gradient || 'var(--color-gray-200)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{tpl?.title || 'Unknown'}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{new Date(d.date).toLocaleDateString()}</div>
                </div>
                <Download size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Download size={32} /></div>
          <h3 className="empty-state-title">No downloads yet</h3>
          <p className="empty-state-text">Export a template to see it here.</p>
        </div>
      )}
    </div>
  );
}
