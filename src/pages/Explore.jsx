/* Explore page — Browse all templates with filters */
import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X, SlidersHorizontal, Grid3X3, LayoutGrid } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import TemplateCard from '../components/TemplateCard';
import CategoryCard from '../components/CategoryCard';
import useTemplateStore from '../stores/templateStore';
import './Explore.css';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, categories, searchTemplates, fetchTemplates } = useTemplateStore();
  const [showFilters, setShowFilters] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const query = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'latest';
  const type = searchParams.get('type') || '';

  const filtered = useMemo(() => {
    let result = query ? searchTemplates(query) : [...templates];
    if (categorySlug) result = result.filter((t) => t.categoryId === categorySlug);
    if (type) result = result.filter((t) => t.type === type);

    switch (sort) {
      case 'popular': result.sort((a, b) => b.stats.downloads - a.stats.downloads); break;
      case 'trending': result.sort((a, b) => b.stats.views - a.stats.views); break;
      default: result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [templates, query, categorySlug, sort, type]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="page-enter">
      <SEOHead
        title={activeCategory ? activeCategory.name : query ? `Search: ${query}` : 'Explore Templates'}
        description={`Browse ${activeCategory ? activeCategory.name : ''} wish templates for Nepal festivals and occasions.`}
      />

      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        {/* Header */}
        <div className="explore-header">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
              {activeCategory ? `${activeCategory.icon} ${activeCategory.name}` : query ? `Results for "${query}"` : 'Explore Templates'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="explore-toolbar">
            <button className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setCompact(!compact)} aria-label="Toggle view">
              {compact ? <LayoutGrid size={18} /> : <Grid3X3 size={18} />}
            </button>
          </div>
        </div>

        {/* Categories scroll */}
        <div className="scroll-x" style={{ marginBottom: 'var(--space-4)' }}>
          <button
            className={`chip ${!categorySlug ? 'chip-active' : ''}`}
            onClick={() => setParam('category', '')}
          >
            All
          </button>
          {categories.slice(0, 15).map((cat) => (
            <button
              key={cat.id}
              className={`chip ${categorySlug === cat.slug ? 'chip-active' : ''}`}
              onClick={() => setParam('category', cat.slug)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="explore-filters animate-slide-down">
            <div className="explore-filter-group">
              <span className="input-label">Sort by</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {[['latest', 'Latest'], ['popular', 'Popular'], ['trending', 'Trending']].map(([val, label]) => (
                  <button key={val} className={`chip ${sort === val ? 'chip-active' : ''}`} onClick={() => setParam('sort', val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="explore-filter-group">
              <span className="input-label">Type</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {[['', 'All'], ['static', '📷 Static'], ['motion', '🎬 Motion']].map(([val, label]) => (
                  <button key={val} className={`chip ${type === val ? 'chip-active' : ''}`} onClick={() => setParam('type', val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {filtered.length > 0 ? (
          <div className={`grid ${compact ? 'grid-auto-fill-sm' : 'grid-auto-fill'}`} style={{ marginTop: 'var(--space-4)' }}>
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} compact={compact} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Filter size={32} />
            </div>
            <h3 className="empty-state-title">No templates found</h3>
            <p className="empty-state-text">Try adjusting your filters or search for something else.</p>
            <button className="btn btn-primary" onClick={() => { setSearchParams({}); }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
