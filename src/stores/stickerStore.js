/* stickerStore.js — Sticker & Category management with Firestore */
import { create } from 'zustand';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query
} from 'firebase/firestore';
import { db } from '../services/firebase';

const WORKER_URL = 'https://shrill-term-41bc.stellarqrstudio.workers.dev';

/* Built-in sticker categories (always available) */
export const defaultStickerCategories = [
  { id: 'all',        name: 'All',        icon: '🌟' },
  { id: 'emoji',      name: 'Emoji',      icon: '😊' },
  { id: 'love',       name: 'Love',       icon: '❤️' },
  { id: 'birthday',   name: 'Birthday',   icon: '🎂' },
  { id: 'festival',   name: 'Festival',   icon: '🎉' },
  { id: 'decorative', name: 'Decorative', icon: '✦' },
  { id: 'custom',     name: 'Custom',     icon: '🪄' },
];

const useStickerStore = create((set, get) => ({
  /* ── State ── */
  stickers: [],          // image stickers from Firestore / admin uploads
  categories: [...defaultStickerCategories],
  isLoading: false,
  isCategoryLoading: false,

  /* ── Fetch stickers from Firestore ── */
  fetchStickers: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const q = query(collection(db, 'stickers'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const stickers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ stickers, isLoading: false });
    } catch (e) {
      console.error('fetchStickers error:', e);
      set({ isLoading: false });
    }
  },

  /* ── Fetch sticker categories from Firestore ── */
  fetchStickerCategories: async () => {
    set({ isCategoryLoading: true });
    try {
      const snap = await getDocs(collection(db, 'stickerCategories'));
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Merge with defaults, deduplicate by id
      const merged = [
        ...defaultStickerCategories,
        ...remote.filter(r => !defaultStickerCategories.find(d => d.id === r.id)),
      ];
      set({ categories: merged, isCategoryLoading: false });
    } catch (e) {
      console.error('fetchStickerCategories error:', e);
      set({ isCategoryLoading: false });
    }
  },

  /* ── Upload sticker file to R2 ── */
  uploadToR2: async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 7)}.${ext}`;
    try {
      const res = await fetch(`${WORKER_URL}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (res.ok) return `${WORKER_URL}/${filename}`;
    } catch (e) {
      console.error('R2 upload error:', e);
    }
    return null;
  },

  /* ── Add single sticker to Firestore ── */
  addSticker: async (stickerData) => {
    try {
      const docRef = await addDoc(collection(db, 'stickers'), {
        ...stickerData,
        is_active: true,
        is_featured: false,
        created_at: new Date().toISOString(),
      });
      const newSticker = { id: docRef.id, ...stickerData, is_active: true, is_featured: false, created_at: new Date().toISOString() };
      set(s => ({ stickers: [newSticker, ...s.stickers] }));
      return newSticker;
    } catch (e) {
      console.error('addSticker error:', e);
      return null;
    }
  },

  /* ── Update sticker ── */
  updateSticker: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'stickers', id), updates);
      set(s => ({ stickers: s.stickers.map(st => st.id === id ? { ...st, ...updates } : st) }));
      return true;
    } catch (e) {
      console.error('updateSticker error:', e);
      return false;
    }
  },

  /* ── Delete sticker ── */
  deleteSticker: async (id) => {
    try {
      await deleteDoc(doc(db, 'stickers', id));
      set(s => ({ stickers: s.stickers.filter(st => st.id !== id) }));
      return true;
    } catch (e) {
      console.error('deleteSticker error:', e);
      return false;
    }
  },

  /* ── Toggle active ── */
  toggleStickerActive: async (id) => {
    const st = get().stickers.find(s => s.id === id);
    if (!st) return;
    await get().updateSticker(id, { is_active: !st.is_active });
  },

  /* ── Toggle featured ── */
  toggleStickerFeatured: async (id) => {
    const st = get().stickers.find(s => s.id === id);
    if (!st) return;
    await get().updateSticker(id, { is_featured: !st.is_featured });
  },

  /* ── Category CRUD ── */
  addCategory: async (catData) => {
    try {
      const docRef = await addDoc(collection(db, 'stickerCategories'), catData);
      const newCat = { id: docRef.id, ...catData };
      set(s => ({ categories: [...s.categories, newCat] }));
      return newCat;
    } catch (e) {
      console.error('addCategory error:', e);
      return null;
    }
  },
  updateCategory: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'stickerCategories', id), updates);
      set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
    } catch (e) { console.error(e); }
  },
  deleteCategory: async (id) => {
    // Prevent deleting built-in categories
    if (defaultStickerCategories.find(c => c.id === id)) return false;
    try {
      await deleteDoc(doc(db, 'stickerCategories', id));
      set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
}));

export default useStickerStore;
