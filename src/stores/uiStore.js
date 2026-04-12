/* Zustand store for UI state — theme, toasts, modals */
import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  /* Theme */
  theme: localStorage.getItem('ws-theme') || 'light',
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('ws-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },
  initTheme: () => {
    const t = get().theme;
    document.documentElement.setAttribute('data-theme', t);
  },

  /* Toasts */
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => get().removeToast(id), toast.duration || 4000);
    return id;
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  /* Search */
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),

  /* Mobile Menu */
  mobileMenuOpen: false,
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
}));

export default useUIStore;
