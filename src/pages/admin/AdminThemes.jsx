import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Image as ImageIcon, Search, Filter, Loader2, Brush, ExternalLink } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import useThemeStore from '../../stores/themeStore';
import '../AdminPages.css';

const WORKER_URL = "https://shrill-term-41bc.stellarqrstudio.workers.dev";

export default function AdminThemes() {
  const { themes, categories, fetchThemes, isLoading, deleteTheme } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // New Theme Form State
  const [newThemeData, setNewThemeData] = useState({
    category: 'custom',
    layer_default_size: 'large',
    is_featured: false
  });

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const uploadToR2 = async (file) => {
    const extension = file.name.split('.').pop();
    const filename = `theme-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    try {
      const response = await fetch(`${WORKER_URL}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (response.ok) return `${WORKER_URL}/${filename}`;
    } catch (error) {
      console.error("R2 Upload error:", error);
    }
    return null;
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const publicUrl = await uploadToR2(file);
        if (publicUrl) {
          await addDoc(collection(db, 'themes'), {
            name: file.name.split('.')[0] || 'New Theme',
            category: newThemeData.category,
            preview_image: publicUrl,
            layer_default_size: newThemeData.layer_default_size,
            is_featured: newThemeData.is_featured,
            created_at: new Date().toISOString()
          });
        }
      }
      setSelectedFiles([]);
      setShowUploadModal(false);
      fetchThemes();
    } catch (e) {
      console.error("Bulk upload failed:", e);
    } finally {
      setUploading(false);
    }
  };

  const filteredThemes = themes.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCat === 'all' || t.category === activeCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-page-title">Theme Manager</h1>
          <p className="admin-page-desc">Manage advanced multi-layer theme graphics and overlays.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} /> Bulk Upload Themes
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search themes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="admin-category-tabs">
          {categories.map(c => (
            <button 
              key={c.id} 
              className={`admin-filter-tab ${activeCat === c.id ? 'active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Themes Grid */}
      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="spinner" />
          <p>Loading themes...</p>
        </div>
      ) : (
        <div className="admin-themes-grid">
          {filteredThemes.map((theme) => (
            <div key={theme.id} className="admin-theme-card">
              <div className="admin-theme-preview">
                <img src={theme.preview_image} alt={theme.name} />
                <div className="admin-theme-overlay">
                   <button className="btn-icon-circle" onClick={() => deleteTheme(theme.id)} title="Delete Theme">
                     <Trash2 size={16} />
                   </button>
                </div>
                {theme.is_prebuilt && <span className="theme-badge-system">System</span>}
                {theme.is_featured && <span className="theme-badge-featured">Featured</span>}
              </div>
              <div className="admin-theme-info">
                <h4 className="admin-theme-name">{theme.name}</h4>
                <div className="admin-theme-meta">
                  <span className="cat-tag">{theme.category}</span>
                  <span className="size-tag">{theme.layer_default_size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Upload Themes</h3>
              <button disabled={uploading} onClick={() => setShowUploadModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Settings for all selected files */}
              <div className="admin-upload-settings" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                      <label className="input-label">Category</label>
                      <select className="input-field" value={newThemeData.category} onChange={e => setNewThemeData({...newThemeData, category: e.target.value})}>
                        {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Default Size</label>
                      <select className="input-field" value={newThemeData.layer_default_size} onChange={e => setNewThemeData({...newThemeData, layer_default_size: e.target.value})}>
                        <option value="large">Large (Full Canvas)</option>
                        <option value="medium">Medium (Center)</option>
                        <option value="small">Small (Decorative)</option>
                      </select>
                    </div>
                 </div>
                 <div className="input-group" style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input type="checkbox" id="featured" checked={newThemeData.is_featured} onChange={e => setNewThemeData({...newThemeData, is_featured: e.target.checked})} />
                    <label htmlFor="featured" className="input-label" style={{ margin: 0 }}>Mark as Featured / Pro</label>
                 </div>
              </div>

              <div 
                className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={32} />
                <p>Drag & drop theme images or <span>Browse</span></p>
                <span className="text-xs text-tertiary">PNG, JPG or WebP (Max 5MB per file)</span>
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={onFileSelect} style={{ display: 'none' }} />
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files-list">
                  <label className="input-label">{selectedFiles.length} files selected</label>
                  <div className="files-grid">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="file-preview-item">
                        <ImageIcon size={16} />
                        <span className="truncate">{file.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" disabled={uploading} onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={uploading || selectedFiles.length === 0} onClick={handleBulkUpload}>
                {uploading ? <Loader2 className="spinner" /> : <Upload size={18} />}
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Themes`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
