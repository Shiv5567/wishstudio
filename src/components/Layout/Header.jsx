/* Header component — Sticky header with logo, search, navigation */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Heart, User, Menu, X, Plus, LayoutGrid } from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import './layout.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, searchQuery, setSearchQuery } = useUIStore();
  const { user } = useAuthStore();
  const [mobileSearch, setMobileSearch] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isEditor = location.pathname.startsWith('/editor');
  if (isEditor) return null;

  return (
    <header className="header">
      <div className="header-inner container">
        {/* Logo */}
        <Link to="/" className="header-logo" aria-label="Wish Studio Home">
          <div className="logo-icon">W</div>
          <span className="logo-text">
            Wish<span className="logo-accent">Studio</span>
          </span>
        </Link>

        {/* Desktop Search */}
        <form className="header-search hide-mobile" onSubmit={handleSearch}>
          <Search size={18} className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search wishes, festivals, occasions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="header-search"
          />
        </form>

        {/* Desktop Nav */}
        <nav className="header-nav hide-mobile" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <Link to="/" className="header-nav-link">
            Home
          </Link>
          <Link to="/explore" className="header-nav-link">
            Explore
          </Link>
          <Link to="/upload" className="header-nav-link">
            Upload
          </Link>
          <Link to="/editor" className="header-nav-link header-nav-cta">
            <Plus size={16} />
            Create
          </Link>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {/* Mobile Search Toggle */}
          <button
            className="btn btn-icon btn-ghost show-mobile"
            onClick={() => setMobileSearch(!mobileSearch)}
            aria-label="Search"
          >
            {mobileSearch ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Theme Toggle */}
          <button className="btn btn-icon btn-ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Favorites */}
          <Link to="/favorites" className="btn btn-icon btn-ghost hide-mobile" aria-label="Favorites">
            <Heart size={20} />
          </Link>

          {/* User */}
          <Link to={user ? '/my-downloads' : '/login'} className="btn btn-icon btn-ghost" aria-label="Account">
            <User size={20} />
          </Link>
        </div>
      </div>

      {/* Mobile Search Expanded */}
      {mobileSearch && (
        <form className="header-mobile-search" onSubmit={handleSearch}>
          <Search size={18} className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search wishes, festivals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </form>
      )}
    </header>
  );
}
