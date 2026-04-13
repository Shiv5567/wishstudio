/* Home page — Premium landing with all sections */
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, Upload, TrendingUp, Clock, Star, ChevronRight } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import TemplateCard from '../components/TemplateCard';
import CategoryCard from '../components/CategoryCard';
import useTemplateStore from '../stores/templateStore';
import useUIStore from '../stores/uiStore';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { templates, categories, fetchTemplates } = useTemplateStore();
  const { searchQuery, setSearchQuery } = useUIStore();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const featured = templates.filter((t) => t.isFeatured);
  const trending = templates.filter((t) => t.isTrending);
  const newest = [...templates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const popular = [...templates].sort((a, b) => b.stats.views - a.stats.views).slice(0, 6);
  const topCategories = categories.slice(0, 12);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="page-enter">
      <SEOHead
        title="Home"
        description="Create beautiful wish templates for Nepali festivals, birthdays, and special occasions. Browse, customize, and export stunning greeting images and GIFs."
      />

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
        <div className="container hero-content">
          {/* Hero text removed for mobile-focused layout */}
          
          {/* Search Bar */}
          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search Dashain, birthday, love wishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="hero-search"
            />
            <button className="btn btn-primary hero-search-btn" type="submit">
              Search
            </button>
          </form>

          {/* Quick Tags */}
          <div className="hero-tags">
            <span className="hero-tags-label">Popular:</span>
            {['Dashain', 'Tihar', 'Birthday', 'Love', 'Good Morning'].map((tag) => (
              <Link
                key={tag}
                to={`/explore?q=${encodeURIComponent(tag.toLowerCase())}`}
                className="chip"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Uploaded Templates (Priority #1) ──── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <Star size={24} style={{ color: 'var(--color-accent)', verticalAlign: 'middle' }} />{' '}
                Featured Wishes
              </h2>
              <p className="section-subtitle">Handpicked templates ready to customize and share</p>
            </div>
            <Link to="/explore?filter=featured" className="section-link">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-auto-fill">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Templates ─────────────────────────── */}
      {trending.length > 0 && (
        <section className="section" style={{ background: 'var(--color-gray-100)', padding: 'var(--space-12) 0' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  <TrendingUp size={24} style={{ color: 'var(--color-error)', verticalAlign: 'middle' }} />{' '}
                  Trending Now
                </h2>
                <p className="section-subtitle">Most popular templates this week</p>
              </div>
              <Link to="/explore?sort=trending" className="section-link">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-auto-fill">
              {trending.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Categories Grid ────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by Occasion</h2>
              <p className="section-subtitle">Find the perfect template for every celebration</p>
            </div>
            <Link to="/explore" className="section-link">
              All Categories <ChevronRight size={16} />
            </Link>
          </div>
          <div className="home-categories-grid">
            {topCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Added ─────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-gray-100)', padding: 'var(--space-12) 0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <Clock size={24} style={{ color: 'var(--color-info)', verticalAlign: 'middle' }} />{' '}
                Recently Added
              </h2>
              <p className="section-subtitle">Fresh templates just uploaded</p>
            </div>
            <Link to="/explore?sort=latest" className="section-link">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-auto-fill">
            {newest.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Create Your Own CTA ────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-content">
              <h2 className="cta-banner-title">Create Your Own Wish</h2>
              <p className="cta-banner-text">
                Upload your image, add text, stickers, and effects. Export as a stunning image or animated GIF.
              </p>
              <div className="cta-banner-actions">
                <Link to="/editor" className="btn btn-primary btn-lg">
                  <Sparkles size={18} />
                  Open Editor
                </Link>
                <Link to="/upload" className="btn btn-secondary btn-lg">
                  <Upload size={18} />
                  Upload Image
                </Link>
              </div>
            </div>
            <div className="cta-banner-art">
              <div className="cta-art-circle cta-art-1">🎆</div>
              <div className="cta-art-circle cta-art-2">🎂</div>
              <div className="cta-art-circle cta-art-3">💕</div>
              <div className="cta-art-circle cta-art-4">✨</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular in Nepal ───────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-gray-100)', padding: 'var(--space-12) 0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">🇳🇵 Popular in Nepal</h2>
              <p className="section-subtitle">Most downloaded templates by Nepali users</p>
            </div>
            <Link to="/explore?sort=popular" className="section-link">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-auto-fill">
            {popular.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
