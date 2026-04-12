/* Template Detail page */
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Download, Share2, Edit3, Eye, ArrowLeft, Tag, Calendar, Palette } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import TemplateCard from '../components/TemplateCard';
import useTemplateStore from '../stores/templateStore';
import './TemplateDetail.css';

export default function TemplateDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getBySlug, templates, toggleFavorite, isFavorite, addRecentView, categories } = useTemplateStore();

  const template = getBySlug(slug);

  React.useEffect(() => {
    if (template) addRecentView(template.id);
  }, [template?.id]);

  if (!template) {
    return (
      <div className="container page-enter" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="empty-state">
          <h2>Template Not Found</h2>
          <p className="empty-state-text">This template may have been removed or doesn't exist.</p>
          <Link to="/explore" className="btn btn-primary">Browse Templates</Link>
        </div>
      </div>
    );
  }

  const fav = isFavorite(template.id);
  const category = categories.find((c) => c.id === template.categoryId);
  const relatedTemplates = templates
    .filter((t) => t.categoryId === template.categoryId && t.id !== template.id)
    .slice(0, 4);

  const handleDownloadOriginal = () => {
    if (!template.coverUrl) return;
    fetch(template.coverUrl)
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = template.title || 'wish-studio-template';
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(console.error);
  };

  return (
    <div className="page-enter">
      <SEOHead
        title={template.title}
        description={template.description}
        keywords={(template.tags || []).join(', ')}
        ogType="article"
      />

      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        {/* Breadcrumb */}
        <div className="detail-breadcrumb">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          {category && (
            <Link to={`/explore?category=${category.slug}`} className="chip">
              {category.icon} {category.name}
            </Link>
          )}
        </div>

        <div className="detail-layout">
          {/* Preview */}
          <div className="detail-preview">
            <div className="detail-preview-card" style={{ background: template.coverUrl ? '#f4f4f5' : template.gradient, overflow: 'hidden' }}>
              {template.coverUrl ? (
                <img src={template.coverUrl} alt={template.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <span style={{ fontSize: '4rem' }}>
                    {template.tags?.[0] === 'dashain' ? '🎆' : template.tags?.[0] === 'birthday' ? '🎂' : template.tags?.[0] === 'love' ? '💕' : '✨'}
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                    {template.title}
                  </h2>
                </>
              )}
              {template.type === 'motion' && (
                <span className="badge" style={{ position: 'absolute', bottom: 'var(--space-4)', background: 'rgba(0,0,0,0.6)', color: 'white', marginTop: 'var(--space-2)' }}>
                  ▶ GIF / Motion
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="detail-info">
            <h1 className="detail-title">{template.title}</h1>
            <p className="detail-description">{template.description}</p>

            {/* Actions */}
            <div className="detail-actions" style={{ flexWrap: 'wrap' }}>
              <Link to={`/editor?template=${template.slug}`} className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '150px' }}>
                <Edit3 size={18} /> Customize
              </Link>
              {template.coverUrl && (
                <button onClick={handleDownloadOriginal} className="btn btn-secondary btn-lg" style={{ flex: 1, minWidth: '150px' }}>
                  <Download size={18} /> Download
                </button>
              )}
              <button className={`btn btn-lg ${fav ? 'btn-secondary' : 'btn-secondary'}`} onClick={() => toggleFavorite(template.id)}>
                <Heart size={18} fill={fav ? 'var(--color-secondary)' : 'none'} color={fav ? 'var(--color-secondary)' : undefined} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => {
                if(navigator.share) navigator.share({ title: template.title, url: window.location.href });
                else navigator.clipboard?.writeText(window.location.href);
              }}>
                <Share2 size={18} />
              </button>
            </div>

            {/* Stats */}
            <div className="detail-stats">
              <div className="detail-stat">
                <Eye size={18} />
                <div>
                  <div className="detail-stat-value">{(template.stats?.views || 0).toLocaleString()}</div>
                  <div className="detail-stat-label">Views</div>
                </div>
              </div>
              <div className="detail-stat">
                <Download size={18} />
                <div>
                  <div className="detail-stat-value">{(template.stats?.downloads || 0).toLocaleString()}</div>
                  <div className="detail-stat-label">Downloads</div>
                </div>
              </div>
              <div className="detail-stat">
                <Heart size={18} />
                <div>
                  <div className="detail-stat-value">{(template.stats?.likes || 0).toLocaleString()}</div>
                  <div className="detail-stat-label">Likes</div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="detail-meta">
              <div className="detail-meta-row">
                <Tag size={16} />
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {(template.tags || []).map((tag) => (
                    <Link key={tag} to={`/explore?q=${tag}`} className="chip">{tag}</Link>
                  ))}
                </div>
              </div>
              {template.mood && (
                <div className="detail-meta-row"><Palette size={16} /> Mood: {template.mood}</div>
              )}
              <div className="detail-meta-row">
                <Calendar size={16} /> Added: {new Date(template.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Related Templates */}
        {relatedTemplates.length > 0 && (
          <section style={{ marginTop: 'var(--space-12)' }}>
            <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Related Templates</h2>
            <div className="grid grid-auto-fill">
              {relatedTemplates.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
