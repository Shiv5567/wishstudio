import { create } from 'zustand';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sampleThemes, themeCategories } from '../data/sampleThemes';

const useThemeStore = create((set, get) => ({
  themes: [...sampleThemes],
  categories: themeCategories,
  isLoading: false,

  fetchThemes: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, 'themes'));
      const firebaseThemes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Merge, prioritizing firebase themes top/first
      set({ themes: [...firebaseThemes, ...sampleThemes], isLoading: false });
    } catch (e) {
      console.error("Failed to fetch themes from Firebase:", e);
      set({ isLoading: false });
    }
  },

  deleteTheme: async (id) => {
    if (id.startsWith('theme-')) {
       // Cannot delete local built-in fallback mock themes
       return false;
    }
    try {
      await deleteDoc(doc(db, 'themes', id));
      set(state => ({
        themes: state.themes.filter(t => t.id !== id)
      }));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}));

export default useThemeStore;
