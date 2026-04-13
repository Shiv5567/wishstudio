export const themeCategories = [
  { id: 'all', name: 'All Themes' },
  { id: 'trending', name: '🔥 Trending' },
  { id: 'birthday', name: '🎂 Birthday' },
  { id: 'festival', name: '🎉 Festival' },
  { id: 'love', name: '💖 Love' },
  { id: 'custom', name: '✨ Custom' },
  { id: '3d', name: '🧊 3D Styles' },
  { id: 'minimal', name: 'Minimal' }
];

// Fallback high-quality gradient/glass SVGs encoded as Data URLs.
// A real app would load these from a CDN. But for instant use, we define gradient maps.
export const sampleThemes = [
  {
    id: 'theme-gradient-01',
    name: 'Vibrant Mesh',
    category: 'custom',
    preview_image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&h=600&fit=crop',
    layer_default_size: 'large',
    is_featured: true,
    is_prebuilt: true
  },
  {
    id: 'theme-neon-01',
    name: 'Cyberpunk Glow',
    category: 'trending',
    preview_image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=600&fit=crop',
    layer_default_size: 'large',
    is_featured: true,
    is_prebuilt: true
  },
  {
    id: 'theme-3d-01',
    name: 'Abstract 3D Shape',
    category: '3d',
    preview_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
    layer_default_size: 'medium',
    is_featured: false,
    is_prebuilt: true
  },
  {
    id: 'theme-minimal-01',
    name: 'Clean Slate',
    category: 'minimal',
    preview_image: 'https://images.unsplash.com/photo-1522881116239-01f660ebbc48?w=600&h=600&fit=crop',
    layer_default_size: 'large',
    is_featured: false,
    is_prebuilt: true
  },
  {
    id: 'theme-glassmorphism-01',
    name: 'Frosted Glass',
    category: 'custom',
    preview_image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=600&fit=crop',
    layer_default_size: 'large',
    is_featured: true,
    is_prebuilt: true
  }
];
