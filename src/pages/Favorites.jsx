/* Favorites page */
import React from 'react';
import { Heart } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import TemplateCard from '../components/TemplateCard';
import useTemplateStore from '../stores/templateStore';

export default function Favorites() {
  const { templates, favorites } = useTemplateStore();
  const favTemplates = templates.filter((t) => favorites.includes(t.id));

  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)' }}>
      <SEOHead title="Favorites" description="Your saved wish templates." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)' }}>
        ❤️ Saved Favorites
      </h1>
      {favTemplates.length > 0 ? (
        <div className="grid grid-auto-fill">
          {favTemplates.map((t) => <TemplateCard key={t.id} template={t} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Heart size={32} /></div>
          <h3 className="empty-state-title">No favorites yet</h3>
          <p className="empty-state-text">Tap the ❤️ heart on any template to save it here.</p>
        </div>
      )}
    </div>
  );
}
