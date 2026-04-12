/* Zustand store for template browsing */
import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sampleTemplates } from '../data/sampleTemplates';
import { categories } from '../data/sampleCategories';

const useTemplateStore = create((set, get) => ({
  templates: sampleTemplates,
  categories: categories,
  favorites: JSON.parse(localStorage.getItem('ws-favorites') || '[]'),
  recentViews: JSON.parse(localStorage.getItem('ws-recent') || '[]'),
  downloads: JSON.parse(localStorage.getItem('ws-downloads') || '[]'),
  isLoading: false,

  fetchTemplates: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, 'templates'));
      const firebaseTemplates = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          slug: data.slug || doc.id // Add fallback slug so routing doesn't break
        };
      });
      
      // Dedup static templates if they share IDs with firebase, though unlikely.
      set({ templates: [...firebaseTemplates, ...sampleTemplates], isLoading: false });
    } catch (e) {
      console.error("Failed to fetch templates from Firebase:", e);
      set({ isLoading: false });
    }
  },

  /* Filters */
  activeFilters: {
    category: null,
    type: null,      // 'static' | 'motion'
    mood: null,
    premium: null,   // true | false | null (all)
    sort: 'latest',  // 'latest' | 'popular' | 'trending'
  },

  setFilter: (key, value) =>
    set((s) => ({
      activeFilters: { ...s.activeFilters, [key]: value },
    })),

  clearFilters: () =>
    set({
      activeFilters: { category: null, type: null, mood: null, premium: null, sort: 'latest' },
    }),

  /* Get filtered templates */
  getFilteredTemplates: () => {
    const { templates, activeFilters } = get();
    let filtered = [...templates].filter((t) => t.visibility === 'public');

    if (activeFilters.category) {
      filtered = filtered.filter((t) => t.categoryId === activeFilters.category);
    }
    if (activeFilters.type) {
      filtered = filtered.filter((t) => t.type === activeFilters.type);
    }
    if (activeFilters.mood) {
      filtered = filtered.filter((t) => t.mood === activeFilters.mood);
    }
    if (activeFilters.premium !== null) {
      filtered = filtered.filter((t) => t.isPremium === activeFilters.premium);
    }

    switch (activeFilters.sort) {
      case 'popular':
        filtered.sort((a, b) => b.stats.downloads - a.stats.downloads);
        break;
      case 'trending':
        filtered.sort((a, b) => b.stats.views - a.stats.views);
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  },

  /* Search */
  searchTemplates: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return get().templates;
    return get().templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (t.festival && t.festival.toLowerCase().includes(q)) ||
        (t.occasion && t.occasion.toLowerCase().includes(q))
    );
  },

  /* Favorites */
  toggleFavorite: (templateId) => {
    const { favorites } = get();
    const next = favorites.includes(templateId)
      ? favorites.filter((id) => id !== templateId)
      : [...favorites, templateId];
    localStorage.setItem('ws-favorites', JSON.stringify(next));
    set({ favorites: next });
  },

  isFavorite: (templateId) => get().favorites.includes(templateId),

  /* Recent Views */
  addRecentView: (templateId) => {
    const { recentViews } = get();
    const next = [templateId, ...recentViews.filter((id) => id !== templateId)].slice(0, 20);
    localStorage.setItem('ws-recent', JSON.stringify(next));
    set({ recentViews: next });
  },

  /* Downloads */
  addDownload: (templateId) => {
    const { downloads } = get();
    const next = [{ id: templateId, date: new Date().toISOString() }, ...downloads].slice(0, 50);
    localStorage.setItem('ws-downloads', JSON.stringify(next));
    set({ downloads: next });
  },

  /* Get template by slug */
  getBySlug: (slug) => get().templates.find((t) => t.slug === slug),

  /* Get category by slug */
  getCategoryBySlug: (slug) => get().categories.find((c) => c.slug === slug),
}));

export default useTemplateStore;
