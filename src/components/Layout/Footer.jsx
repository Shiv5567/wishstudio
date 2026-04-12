/* Footer component */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import './layout.css';

export default function Footer() {
  const location = useLocation();
  const isEditor = location.pathname.startsWith('/editor');
  if (isEditor) return null;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="header-logo" style={{ marginBottom: 'var(--space-3)' }}>
              <div className="logo-icon">W</div>
              <span className="logo-text">Wish<span className="logo-accent">Studio</span></span>
            </div>
            <p className="footer-desc">
              Create beautiful wish templates for Nepali festivals, birthdays, and special occasions.
              Made with <Heart size={14} style={{ display: 'inline', color: 'var(--color-secondary)', verticalAlign: 'middle' }} /> in Nepal.
            </p>
          </div>

          {/* Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Browse</h4>
            <Link to="/explore" className="footer-link">Explore Templates</Link>
            <Link to="/explore?category=dashain" className="footer-link">Dashain</Link>
            <Link to="/explore?category=tihar" className="footer-link">Tihar</Link>
            <Link to="/explore?category=birthday" className="footer-link">Birthday</Link>
            <Link to="/explore?category=love" className="footer-link">Love</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Create</h4>
            <Link to="/editor" className="footer-link">Create Wish</Link>
            <Link to="/upload" className="footer-link">Upload Image</Link>
            <Link to="/favorites" className="footer-link">My Favorites</Link>
            <Link to="/my-downloads" className="footer-link">My Downloads</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Info</h4>
            <Link to="/about" className="footer-link">About Us</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
            <Link to="/faq" className="footer-link">FAQ</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Wish Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
