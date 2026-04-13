/* AdminStickers.jsx — Full Sticker Manager for Admin Panel */
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Check, X, Upload, Search,
  Loader2, Star, Eye, EyeOff, FolderPlus, Tag,
  Image as ImageIcon, ToggleLeft, ToggleRight, Sparkles,
} from 'lucide-react';
import useStickerStore from '../../stores/stickerStore';
import '../AdminPages.css';

export default function AdminStickers() {
  const {
    stickers, categories, isLoading, isCategoryLoading,
    fetchStickers, fetchStickerCategories,
    uploadToR2, addSticker, updateSticker, deleteSticker,
    toggleStickerActive, toggleStickerFeatured,
    addCategory, updateCategory, deleteCategory,
  } = useStickerStore();

  /* ── Local state ── */
  const [activeTab, setActiveTab] = useState('stickers'); // 'stickers' | 'categories'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingSticker, setEditingSticker] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  /* Upload form fields */
  const [uploadForm, setUploadForm] = useState({
    category: 'custom',
    tags: '',
  });

  /* Category form */
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '🎨' });

  useEffect(() => {
    fetchStickers();
    fetchStickerCategories();
  }, []);

  /* ── Drag & Drop ── */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      ['image/png', 'image/svg+xml', 'image/gif', 'image/webp'].includes(f.type)
    );
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const onFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f =>
      ['image/png', 'image/svg+xml', 'image/gif', 'image/webp'].includes(f.type)
    );
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  /* ── Upload handler ── */
  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const url = await uploadToR2(file);
        if (url) {
          const type = file.type === 'image/svg+xml' ? 'svg' : 'png';
          await addSticker({
            name: file.name.replace(/\.[^/.]+$/, ''),
            category: uploadForm.category,
            image_url: url,
            type,
            tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          });
        }
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      setSelectedFiles([]);
      setShowUploadModal(false);
      setUploadForm({ category: 'custom', tags: '' });
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /* ── Inline edit sticker ── */
  const handleEditSave = async () => {
    if (!editingSticker) return;
    await updateSticker(editingSticker.id, {
      name: editingSticker.name,
      category: editingSticker.category,
      tags: editingSticker.tags,
    });
    setEditingSticker(null);
  };

  /* ── Category handlers ── */
  const openCatModal = (cat = null) => {
    setEditingCat(cat);
    setCatForm(cat ? { name: cat.name, icon: cat.icon } : { name: '', icon: '🎨' });
    setShowCatModal(true);
  };

  const handleCatSave = async () => {
    if (!catForm.name.trim()) return;
    if (editingCat) {
      await updateCategory(editingCat.id, catForm);
    } else {
      await addCategory({ ...catForm, id: catForm.name.toLowerCase().replace(/\s+/g, '-') });
    }
    setShowCatModal(false);
    setEditingCat(null);
    setCatForm({ name: '', icon: '🎨' });
  };

  /* ── Filter stickers ── */
  const filtered = stickers.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tags?.join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCat === 'all' || s.category === activeCat;
    return matchSearch && matchCat;
  });

  /* ── Non-default categories for category tab ── */
  const { defaultStickerCategories } = useStickerStore.getState ? useStickerStore : {};

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-page-title">🧷 Sticker Manager</h1>
          <p className="admin-page-desc">Upload and manage stickers visible in the Create Page editor.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={() => { setActiveTab('categories'); }}>
            <Tag size={16} /> Categories
          </button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Plus size={16} /> Upload Stickers
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-sticker-tabs">
        <button
          className={`admin-sticker-tab ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          <Sparkles size={16} /> Stickers ({stickers.length})
        </button>
        <button
          className={`admin-sticker-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} /> Categories ({categories.length})
        </button>
      </div>

      {/* ══════════════ STICKERS TAB ══════════════ */}
      {activeTab === 'stickers' && (
        <>
          {/* Filters */}
          <div className="admin-filters-bar" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div className="admin-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search stickers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="admin-category-tabs">
              {categories.map(c => (
                <button
                  key={c.id}
                  className={`admin-filter-tab ${activeCat === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sticker Grid */}
          {isLoading ? (
            <div className="loading-state" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <Loader2 className="spin-anim" size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-primary)' }} />
              <p>Loading stickers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🧷</div>
              <h3>No stickers found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                {searchTerm ? 'Try a different search term.' : 'Upload your first sticker to get started.'}
              </p>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                <Upload size={16} /> Upload Stickers
              </button>
            </div>
          ) : (
            <div className="admin-sticker-grid">
              {filtered.map(sticker => (
                <div key={sticker.id} className={`admin-sticker-card ${!sticker.is_active ? 'inactive' : ''}`}>
                  <div className="admin-sticker-preview">
                    <img
                      src={sticker.image_url}
                      alt={sticker.name}
                      loading="lazy"
                    />
                    {sticker.is_featured && (
                      <span className="sticker-badge-featured">
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                    {!sticker.is_active && (
                      <span className="sticker-badge-inactive">Hidden</span>
                    )}
                    <div className="admin-sticker-actions-overlay">
                      <button
                        className="sticker-action-btn"
                        onClick={() => toggleStickerActive(sticker.id)}
                        title={sticker.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {sticker.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        className="sticker-action-btn"
                        onClick={() => toggleStickerFeatured(sticker.id)}
                        title={sticker.is_featured ? 'Unfeature' : 'Feature'}
                        style={{ color: sticker.is_featured ? '#FFD93D' : undefined }}
                      >
                        <Star size={14} fill={sticker.is_featured ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="sticker-action-btn"
                        onClick={() => setEditingSticker({ ...sticker })}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="sticker-action-btn danger"
                        onClick={() => deleteSticker(sticker.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="admin-sticker-info">
                    <span className="admin-sticker-name">{sticker.name}</span>
                    <span className="cat-tag">{sticker.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════ CATEGORIES TAB ══════════════ */}
      {activeTab === 'categories' && (
        <div className="admin-cats-section">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button className="btn btn-primary" onClick={() => openCatModal()}>
              <FolderPlus size={16} /> New Category
            </button>
          </div>
          <div className="admin-cats-grid">
            {categories.map(cat => {
              const isDefault = ['all', 'emoji', 'love', 'birthday', 'festival', 'decorative', 'custom'].includes(cat.id);
              const count = stickers.filter(s => s.category === cat.id).length;
              return (
                <div key={cat.id} className="admin-cat-card">
                  <div className="admin-cat-icon">{cat.icon}</div>
                  <div className="admin-cat-info">
                    <span className="admin-cat-name">{cat.name}</span>
                    <span className="admin-cat-count">{count} sticker{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="admin-cat-actions">
                    {!isDefault && (
                      <>
                        <button onClick={() => openCatModal(cat)} title="Edit" className="btn-icon-sm">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} title="Delete" className="btn-icon-sm danger">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {isDefault && <span className="cat-tag">Built-in</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ UPLOAD MODAL ══════════════ */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Stickers</h3>
              <button disabled={uploading} onClick={() => setShowUploadModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Upload settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input-field" value={uploadForm.category} onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}>
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. cute, heart, valentine"
                    value={uploadForm.tags}
                    onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))}
                  />
                </div>
              </div>

              {/* Dropzone */}
              <div
                className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={36} style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }} />
                <p><strong>Drag & drop</strong> stickers or <span style={{ color: 'var(--color-primary)' }}>Browse</span></p>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  PNG (transparent) · SVG (preferred) · GIF · WebP — Max 5MB each
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.svg,.gif,.webp,image/png,image/svg+xml,image/gif,image/webp"
                  onChange={onFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <label className="input-label">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready to upload</label>
                  <div className="sticker-upload-preview-grid">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="sticker-upload-preview-item">
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                        <span className="truncate">{file.name}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedFiles(p => p.filter((_, idx) => idx !== i)); }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {uploading && uploadProgress > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-xs)' }}>Uploading...</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--color-gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--color-primary)', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" disabled={uploading} onClick={() => { setShowUploadModal(false); setSelectedFiles([]); }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={uploading || selectedFiles.length === 0}
                onClick={handleUpload}
              >
                {uploading ? <><Loader2 className="spin-anim" size={16} /> Uploading...</> : <><Upload size={16} /> Upload {selectedFiles.length} Sticker{selectedFiles.length > 1 ? 's' : ''}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ EDIT STICKER MODAL ══════════════ */}
      {editingSticker && (
        <div className="modal-overlay" onClick={() => setEditingSticker(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Sticker</h3>
              <button onClick={() => setEditingSticker(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
                <img src={editingSticker.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 'var(--radius-lg)', background: 'var(--color-gray-100)', padding: 8 }} />
                <div style={{ flex: 1 }}>
                  <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
                    <label className="input-label">Name</label>
                    <input className="input-field" value={editingSticker.name}
                      onChange={e => setEditingSticker(s => ({ ...s, name: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select className="input-field" value={editingSticker.category}
                      onChange={e => setEditingSticker(s => ({ ...s, category: e.target.value }))}>
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Tags (comma separated)</label>
                <input className="input-field"
                  value={Array.isArray(editingSticker.tags) ? editingSticker.tags.join(', ') : (editingSticker.tags || '')}
                  onChange={e => setEditingSticker(s => ({ ...s, tags: e.target.value.split(',').map(t => t.trim()) }))}
                  placeholder="cute, love, heart"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingSticker(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSave}><Check size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CATEGORY MODAL ══════════════ */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCat ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowCatModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="input-label">Icon (emoji)</label>
                <input className="input-field" value={catForm.icon} maxLength={4}
                  style={{ fontSize: '1.5rem', textAlign: 'center', width: 80, padding: 'var(--space-2)' }}
                  onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input className="input-field" value={catForm.name} placeholder="e.g. Christmas"
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCatModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCatSave} disabled={!catForm.name.trim()}>
                <Check size={16} /> {editingCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
