/* Admin Templates Manager */
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Eye, Star, TrendingUp, Crown } from 'lucide-react';
import Modal from '../../components/Modal';
import useTemplateStore from '../../stores/templateStore';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import '../AdminPages.css';

export default function AdminTemplates() {
  const { templates, fetchTemplates } = useTemplateStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', categoryId: 'dashain',
    type: 'static', tags: '', seo: { title: '', description: '', keywords: '', altText: '' },
    isFeatured: false, isTrending: false, isPremium: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id) => {
    if (id.startsWith('tpl-')) {
      alert("This is a built-in static dummy template. It doesn't exist in the remote database so it cannot be deleted here.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this specific template from Firebase?")) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      alert("Template Deleted.");
      fetchTemplates(); // refresh
    } catch (err) {
      console.error(err);
      alert("Failed to delete from Firebase. Check console.");
    }
  };

  const openEditModal = (template) => {
    setEditTemplateId(template.id);
    setFormData({
      title: template.title || '',
      slug: template.slug || template.id || '',
      description: template.description || '',
      categoryId: template.categoryId || 'dashain',
      type: template.type || 'static',
      tags: template.tags ? template.tags.join(', ') : '',
      seo: {
        title: template.seo?.title || '',
        description: template.seo?.description || '',
        keywords: template.seo?.keywords || '',
        altText: template.seo?.altText || ''
      },
      isFeatured: !!template.isFeatured,
      isTrending: !!template.isTrending,
      isPremium: !!template.isPremium
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editTemplateId) {
      alert("Currently only EDIT is supported here. Use 'Upload Assets' to create new templates.");
      return;
    }

    if (editTemplateId.startsWith('tpl-')) {
      alert("This is a built-in static dummy template. It doesn't exist in the remote database so it cannot be updated. Please edit a real uploaded template.");
      return;
    }
    
    setIsSaving(true);
    try {
      const updateData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        categoryId: formData.categoryId,
        type: formData.type,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        seo: formData.seo,
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isPremium: formData.isPremium
      };

      await updateDoc(doc(db, 'templates', editTemplateId), updateData);
      alert('Template successfully updated!');
      setShowForm(false);
      fetchTemplates();
    } catch (error) {
      console.error(error);
      alert('Failed to update template: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = search
    ? templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : templates;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Template Manager</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Template
        </button>
      </div>

      <div className="admin-search-bar">
        <Search size={18} />
        <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Category</th>
              <th>Type</th>
              <th>Status</th>
              <th>Views</th>
              <th>Downloads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {t.coverUrl ? (
                      <img src={t.coverUrl} style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', objectFit: 'cover', flexShrink: 0 }} alt={t.title} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: t.gradient || 'gray', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{t.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{t.slug}</div>
                    </div>
                  </div>
                </td>
                <td><span className="chip">{t.categoryId}</span></td>
                <td><span className={`badge ${t.type === 'motion' ? 'badge-primary' : 'badge-success'}`}>{t.type}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    {t.isFeatured && <Star size={14} style={{ color: 'var(--color-accent)' }} title="Featured" />}
                    {t.isTrending && <TrendingUp size={14} style={{ color: 'var(--color-error)' }} title="Trending" />}
                    {t.isPremium && <Crown size={14} style={{ color: 'var(--color-warning)' }} title="Premium" />}
                  </div>
                </td>
                <td>{t.stats.views.toLocaleString()}</td>
                <td>{t.stats.downloads.toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost btn-icon-sm" title="View"><Eye size={16} /></button>
                    <button className="btn btn-ghost btn-icon-sm" title="Edit" onClick={() => openEditModal(t)}><Edit3 size={16} /></button>
                    <button className="btn btn-ghost btn-icon-sm" title="Delete" onClick={() => handleDelete(t.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Edit Template Metadata" size="lg">
        <div className="editor-controls">
          <div className="input-group">
            <label className="input-label">Title</label>
            <input className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Template title..." />
          </div>
          <div className="input-group">
            <label className="input-label">Slug</label>
            <input className="input" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="template-slug" />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Template description..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="input select" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                <option value="dashain">Dashain</option>
                <option value="tihar">Tihar</option>
                <option value="birthday">Birthday</option>
                <option value="love">Love</option>
                <option value="wedding">Wedding</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Type</label>
              <select className="input select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="static">Static Image</option>
                <option value="motion">Motion / GIF</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Tags (comma separated)</label>
            <input className="input" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="dashain, festival, nepal..." />
          </div>
          <h4 style={{ fontFamily: 'var(--font-display)', marginTop: 'var(--space-2)' }}>SEO Metadata</h4>
          <div className="input-group">
            <label className="input-label">Meta Title</label>
            <input className="input" value={formData.seo.title} onChange={e => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} placeholder="SEO title..." />
          </div>
          <div className="input-group">
            <label className="input-label">Meta Description</label>
            <textarea className="input textarea" value={formData.seo.description} onChange={e => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} placeholder="SEO description..." rows={2} />
          </div>
          <div className="input-group">
            <label className="input-label">Keywords</label>
            <input className="input" value={formData.seo.keywords} onChange={e => setFormData({...formData, seo: {...formData.seo, keywords: e.target.value}})} placeholder="keyword1, keyword2..." />
          </div>
          <div className="input-group">
            <label className="input-label">Alt Text</label>
            <input className="input" value={formData.seo.altText} onChange={e => setFormData({...formData, seo: {...formData.seo, altText: e.target.value}})} placeholder="Image alt text..." />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} /> Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={formData.isTrending} onChange={e => setFormData({...formData, isTrending: e.target.checked})} /> Trending
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={formData.isPremium} onChange={e => setFormData({...formData, isPremium: e.target.checked})} /> Premium
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
