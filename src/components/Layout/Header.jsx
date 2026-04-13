/* Header component — Sticky header with logo, search, navigation */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Heart, User, Menu, X, Plus, Home, Compass, Upload, Info, Mail, HelpCircle, Settings } from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import './layout.css';
export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, searchQuery, setSearchQuery } = useUIStore();
  const { user } = useAuthStore();
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <nav className="header-nav hide-mobile" style={{ gap: 'var(--space-4)' }}>
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

          {/* Mobile Menu Toggle */}
          <button
            className="btn btn-icon btn-ghost show-mobile"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={20} />
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
        <form className="header-mobile-search show-mobile" onSubmit={handleSearch}>
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

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay show-mobile" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="logo-text">Wish<span className="logo-accent">Studio</span></span>
              <button className="btn btn-icon btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="mobile-menu-content">
              <Link to="/" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Home size={18} /> Home
              </Link>
              <Link to="/explore" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Compass size={18} /> Explore
              </Link>
              <Link to="/upload" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Upload size={18} /> Upload Template
              </Link>
              <Link to="/favorites" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Heart size={18} /> Saved
              </Link>
              
              <div className="divider"></div>
              
              <Link to="/about" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Info size={18} /> About Us
              </Link>
              <Link to="/contact" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Mail size={18} /> Contact
              </Link>
              <Link to="/faq" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <HelpCircle size={18} /> FAQ
              </Link>
              
              <div className="divider"></div>
              
              <Link to={user ? "/admin" : "/admin/login"} className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
                <Settings size={18} /> Admin Dashboard
              </Link>
              
              <button 
                className="btn btn-ghost mobile-menu-link" 
                style={{ width: '100%', justifyContent: 'flex-start' }} 
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />} Switch Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
