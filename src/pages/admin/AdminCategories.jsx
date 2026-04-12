/* Admin Categories Manager */
import React, { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { categories } from '../../data/sampleCategories';
import Modal from '../../components/Modal';
import '../AdminPages.css';

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Category Manager</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Icon</th><th>Name</th><th>Slug</th><th>Templates</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td><span style={{ fontSize: '1.4rem' }}>{c.icon}</span></td>
                <td style={{ fontWeight: 'var(--font-semibold)' }}>{c.name}</td>
                <td><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{c.slug}</span></td>
                <td>{c.templateCount}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost btn-icon-sm"><Edit3 size={16} /></button>
                    <button className="btn btn-ghost btn-icon-sm" style={{ color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Category">
        <div className="editor-controls">
          <div className="input-group"><label className="input-label">Name</label><input className="input" placeholder="Category name..." /></div>
          <div className="input-group"><label className="input-label">Slug</label><input className="input" placeholder="category-slug" /></div>
          <div className="input-group"><label className="input-label">Icon (emoji)</label><input className="input" placeholder="🎆" /></div>
          <div className="input-group"><label className="input-label">Description</label><textarea className="input textarea" placeholder="Description..." /></div>
          <div className="input-group"><label className="input-label">Color</label><input type="color" className="input" style={{ height: 40 }} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary">Save Category</button>
        </div>
      </Modal>
    </div>
  );
}
