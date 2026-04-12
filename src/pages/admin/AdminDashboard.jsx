/* Admin Dashboard — Overview */
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Image, FolderOpen, Upload, BarChart3, LogOut, Home, Settings, ChevronRight } from 'lucide-react';
import { auth } from '../../services/firebase';
import useAuthStore from '../../stores/authStore';
import SEOHead from '../../components/SEOHead';
import '../AdminPages.css';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { path: '/admin/templates', icon: Image, label: 'Templates' },
  { path: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/admin/uploads', icon: Upload, label: 'Uploads' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <SEOHead title="Admin Dashboard" description="Manage Wish Studio templates and content." />

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="logo-icon" style={{ width: 32, height: 32, fontSize: 'var(--text-sm)' }}>W</div>
          <span className="logo-text" style={{ fontSize: 'var(--text-base)' }}>Wish<span className="logo-accent">Studio</span></span>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ path, icon: Icon, label, end }) => (
            <Link
              key={path}
              to={path}
              className={`admin-nav-item ${(end ? location.pathname === path : location.pathname.startsWith(path)) ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item"><Home size={18} /> View Site</Link>
          <button className="admin-nav-item" onClick={handleLogout} style={{ width: '100%', textAlign: 'left' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}

/* Admin Overview (default /admin route) */
export function AdminOverview() {
  const stats = [
    { label: 'Total Templates', value: '12', icon: Image, color: '#6C3CE1' },
    { label: 'Categories', value: '29', icon: FolderOpen, color: '#E84393' },
    { label: 'Total Views', value: '24.1k', icon: BarChart3, color: '#00C853' },
    { label: 'Downloads', value: '5.5k', icon: Upload, color: '#FF9800' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard Overview</h1>
      <div className="admin-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: s.color + '18', color: s.color }}>
              <s.icon size={24} />
            </div>
            <div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-8)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <Link to="/admin/templates" className="admin-quick-action">
            <Image size={20} /> Manage Templates <ChevronRight size={16} />
          </Link>
          <Link to="/admin/categories" className="admin-quick-action">
            <FolderOpen size={20} /> Manage Categories <ChevronRight size={16} />
          </Link>
          <Link to="/admin/uploads" className="admin-quick-action">
            <Upload size={20} /> Upload Content <ChevronRight size={16} />
          </Link>
          <Link to="/admin/analytics" className="admin-quick-action">
            <BarChart3 size={20} /> View Analytics <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
