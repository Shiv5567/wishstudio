/* Zustand store for editor state — Canva-level layers, effects, animations */
import { create } from 'zustand';

const generateLayerId = () => 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

const useEditorStore = create((set, get) => ({
  /* Canvas dimensions */
  canvasWidth: 1080,
  canvasHeight: 1080,
  canvasPreset: 'square',
  setCanvasPreset: (preset) => {
    const presets = {
      square: { w: 1080, h: 1080 },
      portrait: { w: 1080, h: 1350 },
      landscape: { w: 1920, h: 1080 },
      story: { w: 1080, h: 1920 },
      facebook: { w: 1200, h: 630 },
      twitter: { w: 1600, h: 900 },
      whatsapp: { w: 800, h: 800 },
      a4: { w: 2480, h: 3508 },
    };
    const p = presets[preset] || presets.square;
    set({ canvasWidth: p.w, canvasHeight: p.h, canvasPreset: preset });
  },
  zoom: 1,
  setZoom: (z) => set({ zoom: Math.min(3, Math.max(0.15, z)) }),

  /* Layers — now supports text, sticker, shape, image layers */
  layers: [],
  selectedLayerId: null,

  addLayer: (layer) => {
    const id = generateLayerId();
    const newLayer = {
      id,
      visible: true,
      locked: false,
      opacity: 1,
      x: 100,
      y: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      animation: null, // animation preset name
      ...layer,
    };
    set((s) => {
      const next = { layers: [...s.layers, newLayer], selectedLayerId: id };
      get().pushHistory(next.layers);
      return next;
    });
    return id;
  },

  updateLayer: (id, updates) => {
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  commitLayerUpdate: () => {
    get().pushHistory(get().layers);
  },

  removeLayer: (id) => {
    set((s) => {
      const layers = s.layers.filter((l) => l.id !== id);
      const selectedLayerId = s.selectedLayerId === id ? null : s.selectedLayerId;
      get().pushHistory(layers);
      return { layers, selectedLayerId };
    });
  },

  duplicateLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id);
    if (!layer) return;
    get().addLayer({ ...layer, id: undefined, x: layer.x + 20, y: layer.y + 20 });
  },

  selectLayer: (id) => set({ selectedLayerId: id }),
  deselectAll: () => set({ selectedLayerId: null }),

  toggleLayerVisibility: (id) => {
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    }));
  },

  toggleLayerLock: (id) => {
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    }));
  },

  moveLayer: (id, direction) => {
    const { layers } = get();
    const idx = layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= layers.length) return;
    const next = [...layers];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    get().pushHistory(next);
    set({ layers: next });
  },

  getSelectedLayer: () => {
    const { layers, selectedLayerId } = get();
    return layers.find((l) => l.id === selectedLayerId) || null;
  },

  /* Background */
  background: { type: 'color', value: '#FFFFFF' },
  setBackground: (bg) => set({ background: bg }),

  /* Overlay filter (applied over the background) */
  overlay: { type: 'none', color: '', opacity: 0.3 },
  setOverlay: (ov) => set({ overlay: ov }),

  /* Active particle effect (rendered as CSS on canvas overlay) */
  activeEffect: null, // { type: 'confetti' | 'hearts' | 'sparkle' | 'snow' | 'firefly' | 'rain' | 'bubbles', intensity: 1 }
  setActiveEffect: (effect) => set({ activeEffect: effect }),

  /* Background filter */
  bgFilter: { blur: 0, brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, sepia: 0, grayscale: 0 },
  setBgFilter: (key, val) => set((s) => ({ bgFilter: { ...s.bgFilter, [key]: val } })),
  resetBgFilter: () => set({ bgFilter: { blur: 0, brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, sepia: 0, grayscale: 0 } }),

  /* History */
  history: [[]],
  historyIndex: 0,

  pushHistory: (layers) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(layers)));
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ layers: JSON.parse(JSON.stringify(history[newIndex])), historyIndex: newIndex, selectedLayerId: null });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ layers: JSON.parse(JSON.stringify(history[newIndex])), historyIndex: newIndex, selectedLayerId: null });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  templateImage: null,
  setTemplateImage: (img) => set({ templateImage: img }),

  /* Gridlines & snapping */
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  /* Reset */
  resetEditor: () =>
    set({
      layers: [],
      selectedLayerId: null,
      history: [[]],
      historyIndex: 0,
      zoom: 1,
      background: { type: 'color', value: '#FFFFFF' },
      overlay: { type: 'none', color: '', opacity: 0.3 },
      activeEffect: null,
      bgFilter: { blur: 0, brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, sepia: 0, grayscale: 0 },
      templateImage: null,
      activeTool: 'select',
      showGrid: false,
    }),
}));

export default useEditorStore;
