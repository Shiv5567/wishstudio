/* Admin Uploads Manager */
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, FileVideo, Copy, CheckCircle2, Save, X } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import useTemplateStore from '../../stores/templateStore';
import '../AdminPages.css';

export default function AdminUploads() {
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const { categories } = useTemplateStore();
  const [pendingForm, setPendingForm] = useState(null); // { url, type, filename }
  const [formData, setFormData] = useState({ title: '', description: '', categoryId: '', tags: '', type: 'static', seoTitle: '', seoDescription: '' });
  const [saving, setSaving] = useState(false);

  const WORKER_URL = "https://shrill-term-41bc.stellarqrstudio.workers.dev";

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const extension = file.name.split('.').pop() || 'png';
    const filename = `admin-asset-${Date.now()}.${extension}`;

    try {
      const response = await fetch(`${WORKER_URL}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (response.ok) {
        const publicUrl = `${WORKER_URL}/${filename}`;
        setUploads([{ id: filename, url: publicUrl, type: file.type, date: new Date() }, ...uploads]);
        
        // Open the metadata form for this upload
        setPendingForm({ url: publicUrl, filename, extension });
        setFormData({ ...formData, type: extension === 'gif' || extension === 'mp4' ? 'motion' : 'static' });
        
      } else {
        alert("Upload failed. Check Cloudflare worker or CORS settings.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToFirebase = async (e) => {
    e.preventDefault();
    if (!pendingForm) return;
    setSaving(true);
    try {
      const templateData = {
        title: formData.title || 'Untitled Upload',
        description: formData.description || '',
        categoryId: formData.categoryId || 'other',
        type: formData.type || 'static',
        coverUrl: pendingForm.url,
        createdAt: new Date().toISOString(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        visibility: 'public',
        isFeatured: false,
        isTrending: false,
        stats: { downloads: 0, views: 0 }
      };

      await addDoc(collection(db, 'templates'), templateData);
      alert("Successfully published directly to the Explore Page!");
      setPendingForm(null); // Close form
      setFormData({ title: '', description: '', categoryId: '', tags: '', type: 'static', seoTitle: '', seoDescription: '' });
    } catch (err) {
      console.error("Firestore error:", err);
      alert("Failed to save to Firebase.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Upload Manager</h1>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*,video/mp4" 
        onChange={handleUpload} 
      />

      {/* Upload Zone */}
      <div 
        className="admin-upload-zone" 
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{ cursor: uploading ? 'wait' : 'pointer' }}
      >
        {uploading ? (
          <span className="spinner" style={{ marginBottom: 'var(--space-3)' }}></span>
        ) : (
          <Upload size={48} style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }} />
        )}
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-2)' }}>
          {uploading ? "Uploading to Cloudflare..." : "Upload Template Files"}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {uploading ? "Please wait while we push to R2." : "Click here to browse and upload images or GIFs."}
        </p>
      </div>

      {/* SEO & Metadata Form Overlay */}
      {pendingForm && (
        <div style={{ background: 'var(--bg-card)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>Publish Template Details</h2>
            <button className="btn btn-icon-sm btn-ghost" onClick={() => setPendingForm(null)}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            <div style={{ width: '200px', flexShrink: 0 }}>
              <img src={pendingForm.url} alt="preview" style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'contain', background: '#f4f4f5' }} />
            </div>
            <form onSubmit={handleSaveToFirebase} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Template Title *</label>
                  <input type="text" className="input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Happy Dashain 2026" />
                </div>
                <div className="input-group">
                  <label className="input-label">Category *</label>
                  <select className="input" required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Short Description</label>
                <input type="text" className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe this template..." />
              </div>

              <div className="input-group">
                <label className="input-label">Tags (comma separated)</label>
                <input type="text" className="input" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="dashain, new year, festive" />
              </div>

              <div style={{ padding: 'var(--space-3)', background: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }}>
                <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>SEO Settings (For Google Ranking)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">SEO Title</label>
                    <input type="text" className="input" value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} placeholder="Title for search engines" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">SEO Description</label>
                    <input type="text" className="input" value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} placeholder="Meta description..." />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <span className="spinner spinner-sm"></span> : <><Save size={16} /> Publish to Explore</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
        Recent Uploads to R2
      </h2>
      
      {uploads.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state-icon"><Upload size={32} /></div>
          <h3 className="empty-state-title">No uploads yet</h3>
          <p className="empty-state-text">Upload template images to get cloud URLs.</p>
        </div>
      ) : (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {uploads.map(item => (
            <div key={item.id} className="admin-card" style={{ padding: 'var(--space-2)' }}>
              <div style={{ height: 140, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-2)', background: 'var(--bg-card)' }}>
                <img src={item.url} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {item.id}
                </span>
                <button 
                  className="btn btn-icon-sm btn-ghost" 
                  onClick={() => copyToClipboard(item.url, item.id)}
                  title="Copy URL"
                >
                  {copiedId === item.id ? <CheckCircle2 size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
