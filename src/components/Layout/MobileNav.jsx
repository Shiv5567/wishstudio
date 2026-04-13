/* Mobile bottom navigation */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, PlusCircle, Heart, UploadCloud } from 'lucide-react';
import './layout.css';

export default function MobileNav() {
  const location = useLocation();
  const isEditor = location.pathname.startsWith('/editor');
  const isAdmin = location.pathname.startsWith('/admin');

  if (isEditor || isAdmin) return null;

  return (
    <nav className="mobile-nav show-mobile" aria-label="Mobile navigation">
      <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} end>
        <Home size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <LayoutGrid size={22} />
        <span>Explore</span>
      </NavLink>
      <NavLink to="/editor" className="mobile-nav-item mobile-nav-create">
        <div className="mobile-nav-create-btn">
          <PlusCircle size={28} />
        </div>
        <span>Create</span>
      </NavLink>
      <NavLink to="/favorites" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <Heart size={22} />
        <span>Saved</span>
      </NavLink>
      <NavLink to="/upload" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <UploadCloud size={22} />
        <span>Upload</span>
      </NavLink>
    </nav>
  );
}
