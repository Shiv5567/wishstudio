/* Premium Template Card component */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Download, Share2, Edit3, Eye, Play } from 'lucide-react';
import useTemplateStore from '../stores/templateStore';
import './TemplateCard.css';

export default function TemplateCard({ template, compact = false }) {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useTemplateStore();
  const fav = isFavorite(template.id);

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/editor?template=${template.slug}`);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(template.id);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: template.title, url: `/template/${template.slug}` });
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.origin + `/template/${template.slug}`);
    }
  };

  return (
    <Link to={`/template/${template.slug}`} className={`template-card ${compact ? 'template-card-compact' : ''}`}>
      {/* Image */}
      <div className="template-card-image" style={{ background: template.coverUrl ? '#f4f4f5' : template.gradient }}>
        {template.coverUrl ? (
          <img src={template.coverUrl} alt={template.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="template-card-preview-text">
            <span className="template-card-emoji">{template.tags?.[0] === 'dashain' ? '🎆' : template.tags?.[0] === 'birthday' ? '🎂' : template.tags?.[0] === 'love' ? '💕' : template.tags?.[0] === 'holi' ? '🎨' : '✨'}</span>
            <span className="template-card-overlay-title">{template.title}</span>
          </div>
        )}

        {/* Motion indicator */}
        {template.type === 'motion' && (
          <div className="template-card-motion-badge">
            <Play size={12} fill="white" />
            GIF
          </div>
        )}

        {/* Badges */}
        <div className="template-card-badges">
          {template.isPremium && <span className="badge badge-premium">★ Premium</span>}
          {template.isTrending && <span className="badge badge-trending">🔥 Trending</span>}
          {template.isNew && !template.isTrending && <span className="badge badge-new">New</span>}
        </div>

        {/* Quick actions overlay */}
        <div className="template-card-actions">
          <button
            className={`template-card-action ${fav ? 'template-card-fav-active' : ''}`}
            onClick={handleFavorite}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} fill={fav ? '#E84393' : 'none'} />
          </button>
          <button className="template-card-action" onClick={handleEdit} aria-label="Edit template">
            <Edit3 size={18} />
          </button>
          <button className="template-card-action" onClick={handleShare} aria-label="Share template">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Info */}
      {!compact && (
        <div className="template-card-info">
          <h3 className="template-card-title truncate">{template.title}</h3>
          <div className="template-card-meta">
            <span className="template-card-stat">
              <Eye size={14} />
              {template.stats.views > 1000 ? `${(template.stats.views / 1000).toFixed(1)}k` : template.stats.views}
            </span>
            <span className="template-card-stat">
              <Download size={14} />
              {template.stats.downloads}
            </span>
            <span className="template-card-stat">
              <Heart size={14} />
              {template.stats.likes}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
