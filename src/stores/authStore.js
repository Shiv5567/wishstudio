/* Zustand store for authentication */
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAdmin: false,
  loading: true,

  setUser: (user) => set({ user, loading: false }),
  setIsAdmin: (v) => set({ isAdmin: v }),
  setLoading: (v) => set({ loading: v }),

  logout: () => set({ user: null, isAdmin: false }),
}));

export default useAuthStore;
