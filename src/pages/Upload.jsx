/* Upload page — User image upload */
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, X, CloudUpload } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import useTemplateStore from '../stores/templateStore';
import SEOHead from '../components/SEOHead';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const { categories, fetchTemplates } = useTemplateStore();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', categoryId: 'other', tags: '' });
  
  const WORKER_URL = "https://shrill-term-41bc.stellarqrstudio.workers.dev";

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleEdit = () => {
    if (preview) {
      sessionStorage.setItem('ws-upload-image', preview);
      navigate('/editor?source=upload');
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsPublishing(true);

    try {
      // 1. Upload to Cloudflare R2
      const extension = file.name.split('.').pop() || 'png';
      const filename = `community-${Date.now()}.${extension}`;
      
      const response = await fetch(`${WORKER_URL}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!response.ok) throw new Error("Cloudflare Upload Failed");
      
      const publicUrl = `${WORKER_URL}/${filename}`;

      // 2. Save to Firebase
      await addDoc(collection(db, 'templates'), {
        title: formData.title || 'Community Upload',
        description: 'Uploaded by a community member.',
        categoryId: formData.categoryId,
        type: extension === 'gif' || extension === 'mp4' ? 'motion' : 'static',
        coverUrl: publicUrl,
        createdAt: new Date().toISOString(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean).concat(['community']),
        seoTitle: formData.title,
        seoDescription: 'A custom wish template created and uploaded by community.',
        visibility: 'public',
        isFeatured: false,
        isTrending: false,
        stats: { downloads: 0, views: 0, likes: 0 }
      });

      alert("Awesome! Your template has been published to the homepage.");
      fetchTemplates(); // Refresh the list
      navigate('/explore');

    } catch (err) {
      console.error(err);
      alert("Failed to publish template. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)', maxWidth: 600 }}>
      <SEOHead title="Upload Image" description="Upload your own image to customize in the editor." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
        📤 Upload Your Image
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        Upload your own photo or image, then customize it with text, stickers, and effects.
      </p>

      {!preview ? (
        <div
          className="admin-upload-zone"
          onClick={() => fileRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <Upload size={48} style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-2)' }}>Click or drag to upload</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Supports JPG, PNG, GIF • Max 10MB
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt="Uploaded" style={{ width: '100%', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-lg)' }} />
          <button
            className="btn btn-icon btn-ghost"
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white' }}
            onClick={() => { setPreview(null); setFile(null); }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {preview && !showForm && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-primary btn-lg" onClick={handleEdit} style={{ flex: 1, justifyContent: 'center' }}>
            <Image size={18} /> Edit in Editor
          </button>
          <button className="btn btn-secondary btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowForm(true)}>
            <CloudUpload size={18} /> Publish as Template
          </button>
        </div>
      )}

      {showForm && preview && (
        <form onSubmit={handlePublish} style={{ background: 'var(--bg-card)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', marginTop: 'var(--space-4)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>Publish to Explore Page</h3>
            <button type="button" className="btn btn-icon-sm btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          
          <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="input-label">Template Title</label>
            <input type="text" className="input" required placeholder="e.g. Beautiful Sunset Greeting" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          
          <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="input-label">Category</label>
            <select className="input" required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
              <option value="other">Select a Category</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button type="submit" disabled={isPublishing} className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
              {isPublishing ? <span className="spinner spinner-sm" /> : 'Publish to World 🚀'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
