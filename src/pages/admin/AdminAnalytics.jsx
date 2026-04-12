/* Admin Analytics page */
import React from 'react';
import { Eye, Download, Heart, Share2, Search, TrendingUp } from 'lucide-react';
import '../AdminPages.css';

export default function AdminAnalytics() {
  const metrics = [
    { label: 'Total Views', value: '24,158', change: '+12%', icon: Eye, color: '#6C3CE1' },
    { label: 'Downloads', value: '5,520', change: '+8%', icon: Download, color: '#00C853' },
    { label: 'Likes', value: '4,083', change: '+15%', icon: Heart, color: '#E84393' },
    { label: 'Shares', value: '2,616', change: '+5%', icon: Share2, color: '#2979FF' },
  ];

  const topSearches = ['dashain', 'birthday', 'tihar', 'love', 'good morning', 'wedding', 'congratulations', 'happy new year'];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Analytics</h1>

      {/* Metrics */}
      <div className="admin-stats-grid">
        {metrics.map((m) => (
          <div key={m.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: m.color + '18', color: m.color }}>
              <m.icon size={24} />
            </div>
            <div>
              <div className="admin-stat-value">{m.value}</div>
              <div className="admin-stat-label">{m.label}</div>
            </div>
            <span className="badge badge-success" style={{ marginLeft: 'auto' }}>{m.change}</span>
          </div>
        ))}
      </div>

      {/* Top Searches */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
          <Search size={20} style={{ verticalAlign: 'middle' }} /> Top Search Terms
        </h2>
        <div className="card-flat" style={{ padding: 'var(--space-4)' }}>
          {topSearches.map((term, i) => (
            <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: i < topSearches.length - 1 ? '1px solid var(--color-gray-200)' : 'none' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', width: 24 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 'var(--font-medium)' }}>{term}</span>
              <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
