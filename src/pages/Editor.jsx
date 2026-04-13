/* Editor page — Canva-level canvas editor with motion, effects, styles, shapes */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Stage, Layer, Rect, Text, TextPath, Transformer, Circle, Star, Line, Arrow, RegularPolygon,
} from 'react-konva';
import {
  ArrowLeft, Type, Sticker, Wand2, Layers, Download,
  Undo2, Redo2, ZoomIn, ZoomOut, Eye, Trash2, Copy, Lock,
  Unlock, MoveUp, MoveDown, EyeOff, Sparkles, Image as ImageIcon,
  Shapes, Palette, LayoutTemplate, Grid3X3, Film, SlidersHorizontal,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, RotateCcw,
  ChevronDown, Play, Pause, RefreshCw, Upload,
} from 'lucide-react';
import useEditorStore from '../stores/editorStore';
import useTemplateStore from '../stores/templateStore';
import useThemeStore from '../stores/themeStore';
import { stickerCategories } from '../data/sampleStickers';
import {
  textStylePresets, shapePresets, effectPresets, quickTemplates,
  canvasSizePresets, filterPresets, overlayPresets, textAnimations,
} from '../data/editorPresets';
import { exportAnimatedGIF, downloadBlob } from '../services/gifExporter';
import SEOHead from '../components/SEOHead';
import './Editor.css';

/* ── Canvas Layer Nodes ──────────────────────────────────── */
function SelectableNode({ children, layer, isSelected, onSelect, onChange }) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const commonProps = {
    ref: shapeRef,
    opacity: layer.opacity,
    visible: layer.visible,
    draggable: !layer.locked,
    rotation: layer.rotation || 0,
    scaleX: layer.scaleX || 1,
    scaleY: layer.scaleY || 1,
    onClick: () => onSelect(layer.id),
    onTap: () => onSelect(layer.id),
    onDragEnd: (e) => onChange(layer.id, { x: e.target.x(), y: e.target.y() }),
    onTransformEnd: () => {
      const node = shapeRef.current;
      if (!node) return;
      const updates = { x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() };
      if (node.width) updates.width = node.width() * node.scaleX();
      if (node.height) updates.height = node.height() * node.scaleY();
      onChange(layer.id, updates);
    },
  };

  const trProps = layer.type === 'sticker'
    ? { enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] }
    : {};

  return (
    <>
      {children(commonProps, shapeRef)}
      {isSelected && !layer.locked && (
        <Transformer ref={trRef} {...trProps}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
        />
      )}
    </>
  );
}

function renderLayer(layer, isSelected, onSelect, onChange) {
  const key = layer.id;

  if (layer.type === 'text') {
    const isCurved = layer.curveRadius && Math.abs(layer.curveRadius) > 0;
    let dataPath = '';
    
    if (isCurved) {
      const r = Math.abs(layer.curveRadius);
      const sweep = layer.curveRadius > 0 ? 1 : 0;
      dataPath = `M -${r}, 0 A ${r} ${r} 0 0 ${sweep} ${r}, 0`;
    }

    const commonTextProps = {
      text: layer.text, fontSize: layer.fontSize || 32, fontFamily: layer.fontFamily || 'Outfit',
      fontStyle: layer.fontStyle || 'normal', align: layer.align || 'center',
      shadowColor: layer.shadowColor || '', shadowBlur: layer.shadowBlur || 0,
      shadowOffsetX: layer.shadowOffsetX || 0, shadowOffsetY: layer.shadowOffsetY || 0,
      stroke: layer.stroke || '', strokeWidth: layer.strokeWidth || 0,
      letterSpacing: layer.letterSpacing || 0, lineHeight: layer.lineHeight || 1.2,
      globalCompositeOperation: layer.globalCompositeOperation || 'source-over',
    };

    if (layer.fillLinearGradientColorStops) {
       commonTextProps.fillPriority = 'linear-gradient';
       commonTextProps.fillLinearGradientStartPoint = { x: 0, y: 0 };
       commonTextProps.fillLinearGradientEndPoint = { x: 0, y: layer.fontSize || 32 }; 
       commonTextProps.fillLinearGradientColorStops = layer.fillLinearGradientColorStops;
    } else {
       commonTextProps.fill = layer.fill || '#FFFFFF';
    }

    const blocks = [];
    if (layer.depth3d && layer.depth3d > 0) {
       for(let i=layer.depth3d; i > 0; i--) {
           blocks.push(
               isCurved 
               ? <TextPath key={`3d-${i}`} data={dataPath} x={layer.x + i} y={layer.y + i} {...commonTextProps} fill={layer.depthColor || '#000'} fillPriority="color" shadowBlur={0} />
               : <Text key={`3d-${i}`} x={layer.x + i} y={layer.y + i} {...commonTextProps} fill={layer.depthColor || '#000'} fillPriority="color" shadowBlur={0} />
           );
       }
    }

    return (
      <SelectableNode key={key} layer={layer} isSelected={isSelected} onSelect={onSelect} onChange={onChange}>
        {(props) => (
          <React.Fragment>
            {blocks}
            {isCurved ? (
              <TextPath {...props} x={layer.x} y={layer.y} data={dataPath} {...commonTextProps} />
            ) : (
              <Text {...props} x={layer.x} y={layer.y} {...commonTextProps} />
            )}
          </React.Fragment>
        )}
      </SelectableNode>
    );
  }

  if (layer.type === 'sticker') {
    return (
      <SelectableNode key={key} layer={layer} isSelected={isSelected} onSelect={onSelect} onChange={onChange}>
        {(props) => <Text {...props} x={layer.x} y={layer.y} text={layer.emoji} fontSize={layer.fontSize || 64} />}
      </SelectableNode>
    );
  }

  if (layer.type === 'shape') {
    const shapeType = layer.shapeType;
    return (
      <SelectableNode key={key} layer={layer} isSelected={isSelected} onSelect={onSelect} onChange={onChange}>
        {(props) => {
          if (shapeType === 'rect') return <Rect {...props} x={layer.x} y={layer.y} width={layer.width || 200} height={layer.height || 120} fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth || 0} cornerRadius={layer.cornerRadius || 0} />;
          if (shapeType === 'circle') return <Circle {...props} x={layer.x} y={layer.y} radius={layer.radius || 80} fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth || 0} />;
          if (shapeType === 'star') return <Star {...props} x={layer.x} y={layer.y} numPoints={layer.numPoints || 5} innerRadius={layer.innerRadius || 40} outerRadius={layer.outerRadius || 80} fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth || 0} />;
          if (shapeType === 'line') return <Line {...props} x={layer.x} y={layer.y} points={layer.points || [0, 0, 200, 0]} stroke={layer.stroke || '#FFFFFF'} strokeWidth={layer.strokeWidth || 3} />;
          if (shapeType === 'arrow') return <Arrow {...props} x={layer.x} y={layer.y} points={layer.points || [0, 0, 200, 0]} stroke={layer.stroke || '#FFFFFF'} strokeWidth={layer.strokeWidth || 3} fill={layer.fill} pointerLength={layer.pointerLength || 12} pointerWidth={layer.pointerWidth || 12} />;
          if (shapeType === 'regularPolygon') return <RegularPolygon {...props} x={layer.x} y={layer.y} sides={layer.sides || 3} radius={layer.radius || 80} fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth || 0} />;
          return null;
        }}
      </SelectableNode>
    );
  }

  if (layer.type === 'themeLayer') {
    return (
      <SelectableNode key={key} layer={layer} isSelected={isSelected} onSelect={onSelect} onChange={onChange}>
        {(props, ref) => {
          const [image, setImage] = React.useState(null);
          React.useEffect(() => {
            const img = new window.Image();
            img.src = layer.url;
            img.onload = () => setImage(img);
          }, [layer.url]);

          if (!image) return <Rect {...props} x={layer.x} y={layer.y} width={layer.width} height={layer.height} fill="#f0f0f0" opacity={0.5} />;

          return (
            <React.Fragment>
              <Rect 
                 {...props} 
                 x={layer.x} y={layer.y} 
                 width={layer.width} height={layer.height}
                 fillPatternImage={image}
                 fillPatternScaleX={layer.width / image.width}
                 fillPatternScaleY={layer.height / image.height}
                 opacity={layer.opacity != null ? layer.opacity : 1}
                 shadowColor={layer.shadowColor || ''}
                 shadowBlur={layer.shadowBlur || 0}
                 shadowOffsetX={layer.shadowOffsetX || 0}
                 shadowOffsetY={layer.shadowOffsetY || 0}
                 globalCompositeOperation={layer.globalCompositeOperation || 'source-over'}
                 cornerRadius={layer.cornerRadius || 0}
              />
            </React.Fragment>
          );
        }}
      </SelectableNode>
    );
  }

  return null;
}

/* ── Particle Effect Overlay (CSS-driven) ────────────────── */
function ParticleOverlay({ effect, width, height }) {
  const [particles, setParticles] = useState([]);
  const animRef = useRef();

  useEffect(() => {
    if (!effect) { setParticles([]); return; }
    const preset = effectPresets.find(e => e.id === effect.type);
    if (!preset) return;

    const p = Array.from({ length: preset.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 12,
      color: preset.colors[Math.floor(Math.random() * preset.colors.length)],
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      char: effect.type === 'hearts' ? '❤' : effect.type === 'sparkle' ? '✦' : effect.type === 'snow' ? '❄' : effect.type === 'petals' ? '✿' : effect.type === 'embers' ? '●' : effect.type === 'stars' ? '★' : effect.type === 'bubbles' ? '○' : '',
    }));
    setParticles(p);
  }, [effect?.type]);

  if (!effect || particles.length === 0) return null;

  const animClass = `particles-${effect.type}`;

  return (
    <div className="particle-overlay" style={{ width, height }}>
      {particles.map(p => (
        <span
          key={p.id}
          className={`particle ${animClass}`}
          style={{
            left: `${p.x}%`,
            top: effect.type === 'hearts' || effect.type === 'embers' ? `${100 + p.size}%` : `${-p.size}%`,
            fontSize: p.size,
            color: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.7 + Math.random() * 0.3,
          }}
        >
          {p.char || '●'}
        </span>
      ))}
    </div>
  );
}

/* ── Main Editor ─────────────────────────────────────────── */
export default function Editor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stageRef = useRef();
  const containerRef = useRef();
  const fileInputRef = useRef();
  const [stageSize, setStageSize] = useState({ width: 540, height: 540 });
  const [activePanel, setActivePanel] = useState('themes');
  const [previewMode, setPreviewMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [playEffects, setPlayEffects] = useState(true);
  
  /* User Custom Themes */
  const [userThemes, setUserThemes] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ws-user-themes') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    sessionStorage.setItem('ws-user-themes', JSON.stringify(userThemes));
  }, [userThemes]);

  const store = useEditorStore();
  const { getBySlug } = useTemplateStore();
  const themeStore = useThemeStore();

  useEffect(() => {
    themeStore.fetchThemes();
  }, []);

  /* Load template if specified */
  useEffect(() => {
    const tplSlug = searchParams.get('template');
    if (tplSlug) {
      const tpl = getBySlug(tplSlug);
      if (tpl) {
        if (tpl.coverUrl) {
          store.setBackground({ type: 'image', value: tpl.coverUrl });
        } else {
          store.setBackground({ type: 'gradient', value: tpl.gradient || 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' });
        }
        store.addLayer({ type: 'text', text: tpl.title, x: 100, y: 200, fontSize: 48, fill: '#FFFFFF', fontFamily: 'Outfit', fontStyle: 'bold', shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' });
      }
    }
    // Load from upload
    const uploadImg = sessionStorage.getItem('ws-upload-image');
    if (uploadImg && searchParams.get('source') === 'upload') {
      store.setBackground({ type: 'image', value: uploadImg });
      sessionStorage.removeItem('ws-upload-image');
    }
    return () => store.resetEditor();
  }, []);

  /* Responsive canvas sizing — maintain aspect ratio */
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.offsetWidth - 32;
      const ch = window.innerHeight - 140;
      const aspectRatio = store.canvasWidth / store.canvasHeight;
      let w, h;
      if (cw / ch > aspectRatio) { h = Math.min(ch, 800); w = h * aspectRatio; }
      else { w = Math.min(cw, 800); h = w / aspectRatio; }
      setStageSize({ width: Math.round(w), height: Math.round(h) });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [store.canvasWidth, store.canvasHeight]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handle = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); store.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); store.redo(); }
      if (e.key === 'Delete' && store.selectedLayerId) { store.removeLayer(store.selectedLayerId); }
      if (e.ctrlKey && e.key === 'd' && store.selectedLayerId) { e.preventDefault(); store.duplicateLayer(store.selectedLayerId); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [store.selectedLayerId]);

  const selectedLayer = store.getSelectedLayer();

  /* ── Add helpers ── */
  const addText = (preset) => {
    const base = {
      type: 'text',
      text: 'Your wish here',
      x: stageSize.width / 4,
      y: stageSize.height / 2 - 20,
      fontSize: 32,
      fill: '#FFFFFF',
      fontFamily: 'Outfit',
      fontStyle: 'normal',
      align: 'center',
      shadowBlur: 4,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      stroke: '',
      strokeWidth: 0,
      letterSpacing: 0,
      lineHeight: 1.2,
    };
    store.addLayer(preset ? { ...base, ...preset } : base);
    setActivePanel('text');
  };

  const addShape = (preset) => {
    store.addLayer({
      type: 'shape',
      shapeType: preset.type,
      x: stageSize.width / 2,
      y: stageSize.height / 2,
      ...preset.props,
    });
    setActivePanel('shapes');
  };

  const addSticker = (emoji) => {
    store.addLayer({ type: 'sticker', emoji, x: stageSize.width / 2 - 32, y: stageSize.height / 2 - 32, fontSize: 64 });
  };

  const addTheme = (theme) => {
    const existingThemes = store.layers.filter(l => l.type === 'themeLayer').length;
    
    // Progressive sizing logic
    let width = stageSize.width;
    let height = stageSize.height;
    
    if (existingThemes === 1) {
      width *= 0.8;
      height *= 0.8;
    } else if (existingThemes === 2) {
      width *= 0.6;
      height *= 0.6;
    } else if (existingThemes >= 3) {
      width *= 0.4;
      height *= 0.4;
    }

    store.addLayer({
      type: 'themeLayer',
      url: theme.preview_image,
      name: theme.name,
      x: (stageSize.width - width) / 2,
      y: (stageSize.height - height) / 2,
      width,
      height,
      opacity: 1,
      rotation: 0,
      globalCompositeOperation: 'source-over',
      shadowBlur: 0,
      shadowColor: '#000000',
    });
    setActivePanel('layers');
  };

  const onUserThemeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newTheme = {
        id: `user-theme-${Date.now()}`,
        name: file.name.split('.')[0] || 'My Upload',
        category: 'uploads',
        preview_image: reader.result,
        is_user: true
      };
      setUserThemes(prev => [newTheme, ...prev]);
      addTheme(newTheme);
    };
    reader.readAsDataURL(file);
  };

  const applyQuickTemplate = (qt) => {
    store.resetEditor();
    store.setBackground({ type: 'gradient', value: qt.gradient });
    qt.layers.forEach(l => store.addLayer({ ...l }));
    if (qt.effect) store.setActiveEffect({ type: qt.effect, intensity: 1 });
  };

  const applyTextStyle = (style) => {
    if (!selectedLayer || selectedLayer.type !== 'text') {
      addText(style);
    } else {
      store.updateLayer(selectedLayer.id, style);
      store.commitLayerUpdate();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => store.setBackground({ type: 'image', value: reader.result });
    reader.readAsDataURL(file);
  };

  /* ── Cloudflare R2 Upload Helper ── */
  const uploadToCloudflare = async (blob, extension) => {
    const WORKER_URL = "https://shrill-term-41bc.stellarqrstudio.workers.dev";
    const filename = `wish-${Date.now()}.${extension}`;
    try {
      const response = await fetch(`${WORKER_URL}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type },
        body: blob
      });
      if (response.ok) {
        const publicUrl = `${WORKER_URL}/${filename}`;
        console.log("Uploaded successfully to Cloudflare R2:", publicUrl);
        // TODO: Save publicUrl to Firestore here to populate the Explore page
        return publicUrl;
      }
    } catch (error) {
      console.error("Cloudflare upload failed:", error);
    }
    return null;
  };

  /* ── Exports ── */
  const exportPNG = async () => {
    setExporting(true);
    store.deselectAll();
    await new Promise(r => setTimeout(r, 150));
    const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = 'wish-studio-creation.png';
    link.href = uri;
    link.click();
    
    // Background upload to R2
    fetch(uri).then(r => r.blob()).then(blob => uploadToCloudflare(blob, 'png'));
    
    setExporting(false);
    setShowExport(false);
  };

  const exportJPEG = async () => {
    setExporting(true);
    store.deselectAll();
    await new Promise(r => setTimeout(r, 150));
    const uri = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.92 });
    const link = document.createElement('a');
    link.download = 'wish-studio-creation.jpg';
    link.href = uri;
    link.click();

    // Background upload to R2
    fetch(uri).then(r => r.blob()).then(blob => uploadToCloudflare(blob, 'jpg'));

    setExporting(false);
    setShowExport(false);
  };

  const exportGIF = async () => {
    setExporting(true);
    setExportProgress(0);
    store.deselectAll();
    await new Promise(r => setTimeout(r, 150));

    try {
      const blob = await exportAnimatedGIF({
        stageRef,
        background: store.background,
        overlay: store.overlay,
        bgFilter: store.bgFilter,
        activeEffect: store.activeEffect,
        width: store.canvasWidth,
        height: store.canvasHeight,
        onProgress: (p) => setExportProgress(p)
      });
      downloadBlob(blob, 'wish-studio-animated.gif');

      // Background upload to R2
      uploadToCloudflare(blob, 'gif');

      setShowExport(false);
    } catch (err) {
      console.error("GIF Export failed:", err);
      alert("Failed to export GIF. Please try again.");
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  /* Background filter CSS string */
  const bgFilterCSS = useMemo(() => {
    const f = store.bgFilter;
    const parts = [];
    if (f.blur) parts.push(`blur(${f.blur}px)`);
    if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
    if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
    if (f.hueRotate) parts.push(`hue-rotate(${f.hueRotate}deg)`);
    if (f.sepia) parts.push(`sepia(${f.sepia}%)`);
    if (f.grayscale) parts.push(`grayscale(${f.grayscale}%)`);
    return parts.length ? parts.join(' ') : 'none';
  }, [store.bgFilter]);

  const bgStyle = store.background.type === 'gradient'
    ? { background: store.background.value }
    : store.background.type === 'color'
    ? { background: store.background.value }
    : {};

  /* ── Toolbar items ── */
  const toolbarItems = [
    { id: 'themes', icon: Palette, label: 'Themes' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'styles', icon: Palette, label: 'Styles' },
    { id: 'shapes', icon: Shapes, label: 'Shapes' },
    { id: 'sticker', icon: Sticker, label: 'Stickers' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'effects', icon: Sparkles, label: 'Effects' },
    { id: 'filters', icon: SlidersHorizontal, label: 'Filters' },
    { id: 'layers', icon: Layers, label: 'Layers' },
  ];

  return (
    <div className="editor-page">
      <SEOHead title="Editor" description="Customize your wish template with text, stickers, shapes, effects, and filters." />

      {/* ── Top Bar ── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> <span className="hide-mobile">Back</span>
          </button>
        </div>
        <div className="editor-topbar-center">
          <button className="btn btn-ghost btn-icon-sm" onClick={store.undo} disabled={!store.canUndo()} title="Undo (Ctrl+Z)"><Undo2 size={18} /></button>
          <button className="btn btn-ghost btn-icon-sm" onClick={store.redo} disabled={!store.canRedo()} title="Redo (Ctrl+Y)"><Redo2 size={18} /></button>
          <div className="editor-divider-v" />
          <button className="btn btn-ghost btn-icon-sm" onClick={() => store.setZoom(store.zoom + 0.15)} title="Zoom In"><ZoomIn size={18} /></button>
          <span className="editor-zoom-label">{Math.round(store.zoom * 100)}%</span>
          <button className="btn btn-ghost btn-icon-sm" onClick={() => store.setZoom(store.zoom - 0.15)} title="Zoom Out"><ZoomOut size={18} /></button>
          <div className="editor-divider-v" />
          <button className={`btn btn-ghost btn-icon-sm ${previewMode ? 'editor-active-btn' : ''}`} onClick={() => setPreviewMode(!previewMode)} title="Preview"><Eye size={18} /></button>
          <button className={`btn btn-ghost btn-icon-sm ${store.showGrid ? 'editor-active-btn' : ''}`} onClick={store.toggleGrid} title="Grid"><Grid3X3 size={18} /></button>
          <div className="editor-divider-v" />
          {store.activeEffect && (
            <button className={`btn btn-ghost btn-icon-sm ${playEffects ? 'editor-active-btn' : ''}`}
              onClick={() => setPlayEffects(!playEffects)} title={playEffects ? 'Pause Effects' : 'Play Effects'}>
              {playEffects ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
        </div>
        <div className="editor-topbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => setShowExport(true)}>
            <Download size={16} /> <span className="hide-mobile">Export</span>
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* ── Left Toolbar ── */}
        {!previewMode && (
          <div className="editor-toolbar">
            {toolbarItems.map(({ id, icon: Icon, label }) => (
              <button key={id}
                className={`editor-tool-btn ${activePanel === id ? 'active' : ''}`}
                onClick={() => setActivePanel(activePanel === id ? null : id)}
                title={label}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Side Panel ── */}
        {!previewMode && activePanel && (
          <div className="editor-panel">
            {activePanel === 'themes' && (
              <ThemesPanel 
                onAdd={addTheme} 
                themes={[...userThemes, ...themeStore.themes]} 
                categories={[{ id: 'uploads', name: '📁 My Uploads' }, ...themeStore.categories]}
                onUpload={onUserThemeUpload}
              />
            )}
            {activePanel === 'text' && <TextPanel selectedLayer={selectedLayer} addText={addText} updateLayer={store.updateLayer} commitUpdate={store.commitLayerUpdate} />}
            {activePanel === 'styles' && <StylesPanel onApply={applyTextStyle} selectedLayer={selectedLayer} />}
            {activePanel === 'shapes' && <ShapesPanel onAdd={addShape} selectedLayer={selectedLayer} updateLayer={store.updateLayer} commitUpdate={store.commitLayerUpdate} />}
            {activePanel === 'sticker' && <StickerPanel addSticker={addSticker} />}
            {activePanel === 'image' && <ImagePanel background={store.background} setBackground={store.setBackground} onUpload={() => fileInputRef.current?.click()} canvasPreset={store.canvasPreset} setCanvasPreset={store.setCanvasPreset} />}
            {activePanel === 'effects' && <EffectsPanel activeEffect={store.activeEffect} setActiveEffect={store.setActiveEffect} overlay={store.overlay} setOverlay={store.setOverlay} />}
            {activePanel === 'filters' && <FiltersPanel bgFilter={store.bgFilter} setBgFilter={store.setBgFilter} resetBgFilter={store.resetBgFilter} />}
            {activePanel === 'layers' && <LayersPanelUI layers={store.layers} selectedId={store.selectedLayerId} onSelect={store.selectLayer} onRemove={store.removeLayer} onDuplicate={store.duplicateLayer} onToggleVisibility={store.toggleLayerVisibility} onToggleLock={store.toggleLayerLock} onMove={store.moveLayer} updateLayer={store.updateLayer} commitUpdate={store.commitLayerUpdate} />}
          </div>
        )}

        {/* ── Canvas ── */}
        <div className="editor-canvas-area" ref={containerRef}>
          <div className="editor-canvas-wrapper" style={{ transform: `scale(${store.zoom})`, width: stageSize.width, height: stageSize.height }}>
            {/* Background layer */}
            <div className="editor-canvas-bg" style={{ ...bgStyle, width: stageSize.width, height: stageSize.height, filter: bgFilterCSS }}>
              {store.background.type === 'image' && (
                <img src={store.background.value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
              )}
            </div>

            {/* Color overlay */}
            {store.overlay.type !== 'none' && store.overlay.color && (
              <div className="editor-canvas-overlay" style={{ backgroundColor: store.overlay.color, opacity: store.overlay.opacity, width: stageSize.width, height: stageSize.height }} />
            )}

            {/* Canvas gridlines */}
            {store.showGrid && (
              <div className="editor-grid" style={{ width: stageSize.width, height: stageSize.height }}>
                <div className="editor-grid-line editor-grid-h" style={{ top: '33.33%' }} />
                <div className="editor-grid-line editor-grid-h" style={{ top: '66.66%' }} />
                <div className="editor-grid-line editor-grid-v" style={{ left: '33.33%' }} />
                <div className="editor-grid-line editor-grid-v" style={{ left: '66.66%' }} />
                <div className="editor-grid-line editor-grid-h editor-grid-center" style={{ top: '50%' }} />
                <div className="editor-grid-line editor-grid-v editor-grid-center" style={{ left: '50%' }} />
              </div>
            )}

            {/* Konva Stage */}
            <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
              onClick={(e) => { if (e.target === e.target.getStage()) store.deselectAll(); }}
              onTap={(e) => { if (e.target === e.target.getStage()) store.deselectAll(); }}
            >
              <Layer>
                <Rect width={stageSize.width} height={stageSize.height} fill="transparent" listening={false} />
                {store.layers.map((layer) =>
                  renderLayer(layer, store.selectedLayerId === layer.id && !previewMode, store.selectLayer,
                    (id, updates) => { store.updateLayer(id, updates); store.commitLayerUpdate(); })
                )}
              </Layer>
            </Stage>

            {/* Particle effects overlay */}
            {playEffects && store.activeEffect && (
              <ParticleOverlay effect={store.activeEffect} width={stageSize.width} height={stageSize.height} />
            )}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      {/* Export Dialog */}
      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-semibold)' }}>Export Your Creation</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowExport(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="export-options">
                <button className="export-option" onClick={exportPNG} disabled={exporting}>
                  <div className="export-option-icon" style={{ background: 'linear-gradient(135deg, #6C3CE1, #E84393)' }}>
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <div className="export-option-title">PNG Image</div>
                    <div className="export-option-desc">High quality, transparent support</div>
                  </div>
                  {exporting && <span className="spinner spinner-sm" />}
                </button>
                <button className="export-option" onClick={exportJPEG} disabled={exporting}>
                  <div className="export-option-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <div className="export-option-title">JPEG Image</div>
                    <div className="export-option-desc">Smaller file size, best for sharing</div>
                  </div>
                  {exporting && <span className="spinner spinner-sm" />}
                </button>
                <button className="export-option" onClick={exportGIF} disabled={exporting}>
                  <div className="export-option-icon" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
                    <Film size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="export-option-title">Animated GIF</div>
                    <div className="export-option-desc">Includes particle motion effects</div>
                    {exporting && exportProgress > 0 && (
                      <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 8 }}>
                        <div style={{ height: '100%', background: '#10B981', borderRadius: 2, width: `${exportProgress * 100}%`, transition: 'width 0.2s' }} />
                      </div>
                    )}
                  </div>
                  {exporting && exportProgress === 0 && <span className="spinner spinner-sm" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Themes Panel ── Advanced multi-layer theme system ──── */
function ThemesPanel({ onAdd, themes, categories, onUpload }) {
  const [activeCat, setActiveCat] = useState('all');
  const userFileInputRef = useRef();

  const filteredThemes = activeCat === 'all' 
    ? themes 
    : themes.filter(t => t.category === activeCat);

  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Themes</h3>
      <p className="editor-panel-desc">Add multiple themes as layers to your canvas.</p>
      
      {/* Category Filter */}
      <div className="scroll-x" style={{ marginBottom: 'var(--space-4)', gap: 'var(--space-2)' }}>
        {categories.map(c => (
          <button
            key={c.id}
            className={`subtab ${activeCat === c.id ? 'active' : ''}`}
            onClick={() => setActiveCat(c.id)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="template-preset-grid">
        {/* User Upload Button Card */}
        <div className="template-preset-card upload-theme-card" onClick={() => userFileInputRef.current?.click()}>
           <div className="template-preset-preview upload-theme-placeholder">
              <Upload size={24} />
              <span style={{ fontSize: '10px', marginTop: '4px' }}>Upload Image</span>
           </div>
           <span className="template-preset-name">Custom Theme</span>
           <input ref={userFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
        </div>

        {filteredThemes.map(theme => (
          <button key={theme.id} className="template-preset-card" onClick={() => onAdd(theme)}>
            <div className="template-preset-preview">
              <img src={theme.preview_image} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {theme.is_featured && <span className="badge-featured">PRO</span>}
            </div>
            <span className="template-preset-name">{theme.name}</span>
          </button>
        ))}
      </div>
      
      {filteredThemes.length === 0 && (
         <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
            <p className="text-tertiary">No themes found in this category.</p>
         </div>
      )}
    </div>
  );
}

/* ── Text Panel ── Enhanced with Advanced Tabs ────── */
function TextPanel({ selectedLayer, addText, updateLayer, commitUpdate }) {
  const isText = selectedLayer?.type === 'text';
  const fonts = ['Outfit', 'Inter', 'Georgia', 'Arial', 'Impact', 'Courier New', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Comic Sans MS'];
  const [activeTab, setActiveTab] = React.useState('basic');

  if (!isText) {
    return (
      <div className="editor-panel-content">
        <h3 className="editor-panel-title">Add Text</h3>
        <div className="editor-text-add-btns">
          <button className="btn btn-primary btn-sm" onClick={() => addText({ fontSize: 48, fontStyle: 'bold' })} style={{ flex: 1, justifyContent: 'center' }}>
            <Bold size={16} /> Heading
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => addText({ fontSize: 28, fontStyle: 'normal' })} style={{ flex: 1, justifyContent: 'center' }}>
            <Type size={16} /> Subtext
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => addText({ fontSize: 18, fontStyle: 'normal' })} style={{ flex: 1, justifyContent: 'center' }}>
            <AlignLeft size={16} /> Body
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel-content advanced-text-panel">
      {/* Mobile-friendly horizontal scroll tabs */}
      <div className="editor-subtabs scroll-x">
        <button className={`subtab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Basic</button>
        <button className={`subtab ${activeTab === 'style' ? 'active' : ''}`} onClick={() => setActiveTab('style')}>Style</button>
        <button className={`subtab ${activeTab === 'effects' ? 'active' : ''}`} onClick={() => setActiveTab('effects')}>Effects</button>
        <button className={`subtab ${activeTab === 'curve' ? 'active' : ''}`} onClick={() => setActiveTab('curve')}>Curve</button>
        <button className={`subtab ${activeTab === '3d' ? 'active' : ''}`} onClick={() => setActiveTab('3d')}>3D</button>
        <button className={`subtab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Extra</button>
      </div>

      <div className="editor-tab-content">
        {/* ================= BASIC TAB ================= */}
        {activeTab === 'basic' && (
          <div className="editor-controls">
            <div className="input-group">
              <label className="input-label">Content</label>
              <textarea className="input textarea" value={selectedLayer.text} rows={2}
                onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })} onBlur={commitUpdate} />
            </div>
            
            <div className="input-group">
              <label className="input-label">Font Family</label>
              <select className="input select" value={selectedLayer.fontFamily || 'Outfit'}
                onChange={(e) => { updateLayer(selectedLayer.id, { fontFamily: e.target.value }); commitUpdate(); }}>
                {fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>

            <div className="editor-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Size — {selectedLayer.fontSize || 32}</label>
                <input type="range" className="slider" value={selectedLayer.fontSize || 32} min={8} max={200}
                  onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
            </div>

            <div className="editor-row">
              <div className="editor-btn-group" style={{ flex: 1 }}>
                <button className={`editor-format-btn ${(selectedLayer.fontStyle || '').includes('bold') ? 'active' : ''}`}
                  onClick={() => { const cur = selectedLayer.fontStyle || ''; const next = cur.includes('bold') ? cur.replace('bold', '').trim() : `bold ${cur}`.trim(); updateLayer(selectedLayer.id, { fontStyle: next }); commitUpdate(); }}>
                  <Bold size={16} />
                </button>
                <button className={`editor-format-btn ${(selectedLayer.fontStyle || '').includes('italic') ? 'active' : ''}`}
                  onClick={() => { const cur = selectedLayer.fontStyle || ''; const next = cur.includes('italic') ? cur.replace('italic', '').trim() : `${cur} italic`.trim(); updateLayer(selectedLayer.id, { fontStyle: next }); commitUpdate(); }}>
                  <Italic size={16} />
                </button>
              </div>
              <div className="editor-btn-group" style={{ flex: 1 }}>
                {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([a, Icon]) => (
                  <button key={a} className={`editor-format-btn ${selectedLayer.align === a ? 'active' : ''}`}
                    onClick={() => { updateLayer(selectedLayer.id, { align: a }); commitUpdate(); }}>
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Spacing — {selectedLayer.letterSpacing || 0}</label>
                <input type="range" className="slider" value={selectedLayer.letterSpacing || 0} min={-5} max={50}
                  onChange={e => updateLayer(selectedLayer.id, { letterSpacing: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
            </div>
            <div className="editor-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Line Height — {selectedLayer.lineHeight || 1.2}</label>
                <input type="range" className="slider" value={selectedLayer.lineHeight || 1.2} min={0.5} max={3} step={0.1}
                  onChange={e => updateLayer(selectedLayer.id, { lineHeight: parseFloat(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
            </div>
          </div>
        )}

        {/* ================= STYLE TAB ================= */}
        {activeTab === 'style' && (
          <div className="editor-controls">
            <div className="input-group">
              <label className="input-label">Fill Color (Solid)</label>
              <input type="color" className="input-color-large" value={selectedLayer.fill || '#FFFFFF'}
                onChange={e => { updateLayer(selectedLayer.id, { fill: e.target.value, fillLinearGradientColorStops: null }); commitUpdate(); }} />
            </div>

            <h4 className="section-divider">Gradient Fill (Overrides Solid)</h4>
            <div className="editor-row">
              <button className="btn btn-secondary btn-sm" onClick={() => { updateLayer(selectedLayer.id, { fillLinearGradientColorStops: [0, '#FF0000', 1, '#FFFF00'] }); commitUpdate(); }}>Sunset</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { updateLayer(selectedLayer.id, { fillLinearGradientColorStops: [0, '#00C9FF', 1, '#92FE9D'] }); commitUpdate(); }}>Ocean</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { updateLayer(selectedLayer.id, { fillLinearGradientColorStops: [0, '#f12711', 1, '#f5af19'] }); commitUpdate(); }}>Fire</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { updateLayer(selectedLayer.id, { fillLinearGradientColorStops: null }); commitUpdate(); }}>Clear</button>
            </div>

            <h4 className="section-divider">Stroke / Outline</h4>
            <div className="editor-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Color</label>
                <input type="color" className="input-color-large" value={selectedLayer.stroke || '#000000'}
                  onChange={e => { updateLayer(selectedLayer.id, { stroke: e.target.value }); commitUpdate(); }} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Width — {selectedLayer.strokeWidth || 0}</label>
                <input type="range" className="slider" value={selectedLayer.strokeWidth || 0} min={0} max={20}
                  onChange={e => updateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
            </div>

            <h4 className="section-divider">Opacity</h4>
            <div className="input-group">
              <label className="input-label">Transparency — {Math.round((selectedLayer.opacity != null ? selectedLayer.opacity : 1) * 100)}%</label>
              <input type="range" className="slider" min={0} max={1} step={0.05} value={selectedLayer.opacity != null ? selectedLayer.opacity : 1}
                onChange={e => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>
          </div>
        )}

        {/* ================= EFFECTS TAB ================= */}
        {activeTab === 'effects' && (
          <div className="editor-controls">
            <h4 className="section-divider">Drop Shadow</h4>
            <div className="input-group">
               <label className="input-label">Color</label>
               <input type="color" className="input-color-large" value={selectedLayer.shadowColor || '#000000'}
                 onChange={e => { updateLayer(selectedLayer.id, { shadowColor: e.target.value }); commitUpdate(); }} />
            </div>
            <div className="editor-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Offset X</label>
                <input type="range" className="slider" min={-50} max={50} value={selectedLayer.shadowOffsetX || 0}
                  onChange={e => updateLayer(selectedLayer.id, { shadowOffsetX: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Offset Y</label>
                <input type="range" className="slider" min={-50} max={50} value={selectedLayer.shadowOffsetY || 0}
                  onChange={e => updateLayer(selectedLayer.id, { shadowOffsetY: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Blur</label>
              <input type="range" className="slider" min={0} max={50} value={selectedLayer.shadowBlur || 0}
                onChange={e => updateLayer(selectedLayer.id, { shadowBlur: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>

            <h4 className="section-divider">Glow Magic</h4>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                updateLayer(selectedLayer.id, {
                  shadowColor: selectedLayer.fill !== 'transparent' ? selectedLayer.fill : '#FFFFFF',
                  shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 0
                });
                commitUpdate();
              }}>
              <Sparkles size={16} style={{ marginRight: 8 }} /> Apply Neon Glow
            </button>
          </div>
        )}

        {/* ================= CURVE TAB ================= */}
        {activeTab === 'curve' && (
          <div className="editor-controls">
             <div className="empty-state" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <RotateCcw size={32} style={{ margin: '0 auto var(--space-2)', color: 'var(--color-primary)' }} />
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Curved Text</h4>
                <p style={{ fontSize: 'var(--text-sm)' }}>
                  Bend your text into a circle or arch. 
                </p>
             </div>
             
             <div className="input-group">
                <label className="input-label">Curve Radius — {selectedLayer.curveRadius || 0}</label>
                <input type="range" className="slider" min={-300} max={300} value={selectedLayer.curveRadius || 0}
                  onChange={e => updateLayer(selectedLayer.id, { curveRadius: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                <small style={{ color: 'var(--text-tertiary)' }}>0 = Flat Text. Use +/- for arch direction.</small>
             </div>
          </div>
        )}

        {/* ================= 3D TAB ================= */}
        {activeTab === '3d' && (
          <div className="editor-controls">
             <div className="empty-state" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>3D Depth Effects</h4>
                <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  Creates a hard block extrusion effect to simulate 3D typography.
                </p>
                <button className="btn btn-primary" onClick={() => {
                  updateLayer(selectedLayer.id, {
                    depth3d: 5 // Trigger for fake 3D shadows in renderLayer
                  });
                  commitUpdate();
                }}>
                  Enable 3D Block Text
                </button>
                <button className="btn btn-ghost" style={{ marginTop: 'var(--space-2)' }} onClick={() => {
                  updateLayer(selectedLayer.id, { depth3d: 0 }); commitUpdate();
                }}>
                  Remove 3D
                </button>
             </div>

             {selectedLayer.depth3d > 0 && (
               <>
                 <div className="input-group">
                    <label className="input-label">Depth Intensity — {selectedLayer.depth3d || 5}</label>
                    <input type="range" className="slider" min={1} max={30} value={selectedLayer.depth3d || 5}
                      onChange={e => updateLayer(selectedLayer.id, { depth3d: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                 </div>
                 <div className="input-group">
                    <label className="input-label">3D Block Color</label>
                    <input type="color" className="input-color-large" value={selectedLayer.depthColor || '#000000'}
                      onChange={e => { updateLayer(selectedLayer.id, { depthColor: e.target.value }); commitUpdate(); }} />
                 </div>
               </>
             )}
          </div>
        )}

        {/* ================= ADVANCED TAB ================= */}
        {activeTab === 'advanced' && (
          <div className="editor-controls">
             <div className="input-group">
                <label className="input-label">Composite Mode (Glassmorphism / Blend)</label>
                <select className="input select" value={selectedLayer.globalCompositeOperation || 'source-over'}
                  onChange={e => { updateLayer(selectedLayer.id, { globalCompositeOperation: e.target.value }); commitUpdate(); }}>
                  <option value="source-over">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="luminosity">Luminosity</option>
                </select>
             </div>
             
             <div className="input-group">
               <label className="input-label">Text Animation Plugin</label>
               <select className="input select" value={selectedLayer.animation || 'none'}
                 onChange={(e) => { updateLayer(selectedLayer.id, { animation: e.target.value }); commitUpdate(); }}>
                 <option value="none">None</option>
                 <option value="pulse">Pulse</option>
                 <option value="float">Float</option>
                 <option value="shimmer">Shimmer</option>
               </select>
             </div>

             <div className="editor-row" style={{ marginTop: 'var(--space-6)' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                  updateLayer(selectedLayer.id, { depth3d: undefined, curveRadius: undefined, fillLinearGradientColorStops: undefined, shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalCompositeOperation: 'source-over' });
                  commitUpdate();
                }}>
                  Reset Styles
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Styles Panel ── One-click text style presets like Canva ── */
function StylesPanel({ onApply, selectedLayer }) {
  const categories = [
    { id: 'headings', name: '🔥 Headings' },
    { id: 'subtext', name: '✍️ Subtext' },
    { id: 'body', name: '🎨 Creative' },
  ];
  const [activeCat, setActiveCat] = useState('headings');
  const filtered = textStylePresets.filter(s => s.category === activeCat);

  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Text Styles</h3>
      <p className="editor-panel-desc">{selectedLayer?.type === 'text' ? 'Click to apply style to selected text' : 'Click to add styled text'}</p>
      <div className="scroll-x" style={{ marginBottom: 'var(--space-3)' }}>
        {categories.map(c => (
          <button key={c.id} className={`chip ${activeCat === c.id ? 'chip-active' : ''}`} onClick={() => setActiveCat(c.id)}>{c.name}</button>
        ))}
      </div>
      <div className="style-preset-grid">
        {filtered.map(s => (
          <button key={s.id} className="style-preset-card" onClick={() => onApply(s.style)} title={s.name}>
            <div className="style-preset-preview" style={{
              fontFamily: s.style.fontFamily,
              fontSize: Math.min(s.style.fontSize, 28),
              fontWeight: (s.style.fontStyle || '').includes('bold') ? 'bold' : 'normal',
              fontStyle: (s.style.fontStyle || '').includes('italic') ? 'italic' : 'normal',
              color: s.style.fill === 'transparent' ? '#FFF' : s.style.fill,
              textShadow: s.style.shadowBlur ? `${s.style.shadowOffsetX || 0}px ${s.style.shadowOffsetY || 0}px ${s.style.shadowBlur}px ${s.style.shadowColor}` : 'none',
              WebkitTextStroke: s.style.strokeWidth ? `${Math.min(s.style.strokeWidth, 2)}px ${s.style.stroke || '#FFF'}` : 'none',
              letterSpacing: s.style.letterSpacing || 0,
            }}>
              {s.preview}
            </div>
            <span className="style-preset-name">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Shapes Panel ── ─────────────────────────────────────── */
function ShapesPanel({ onAdd, selectedLayer, updateLayer, commitUpdate }) {
  const isShape = selectedLayer?.type === 'shape';
  const shapeCategories = [
    { label: 'Basic', items: shapePresets.filter(s => ['rect', 'rounded-rect', 'square', 'pill', 'circle', 'ring'].includes(s.id)) },
    { label: 'Lines', items: shapePresets.filter(s => ['line-h', 'line-v', 'line-diag', 'arrow'].includes(s.id)) },
    { label: 'Stars & Polygons', items: shapePresets.filter(s => ['star-5', 'star-6', 'triangle', 'pentagon', 'hexagon', 'badge'].includes(s.id)) },
    { label: 'Frames', items: shapePresets.filter(s => ['frame-thin', 'frame-round'].includes(s.id)) },
  ];

  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Shapes</h3>
      {shapeCategories.map(cat => (
        <div key={cat.label} style={{ marginBottom: 'var(--space-4)' }}>
          <label className="input-label">{cat.label}</label>
          <div className="shape-grid">
            {cat.items.map(s => (
              <button key={s.id} className="shape-btn" onClick={() => onAdd(s)} title={s.name}>
                <span>{s.icon}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {isShape && (
        <div className="editor-controls" style={{ borderTop: '1px solid var(--color-gray-200)', paddingTop: 'var(--space-4)' }}>
          <label className="input-label">Shape Properties</label>
          <div className="editor-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Fill</label>
              <input type="color" className="input-color" value={selectedLayer.fill || '#6C3CE1'}
                onChange={e => { updateLayer(selectedLayer.id, { fill: e.target.value }); commitUpdate(); }} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Stroke</label>
              <input type="color" className="input-color" value={selectedLayer.stroke || '#000000'}
                onChange={e => { updateLayer(selectedLayer.id, { stroke: e.target.value }); commitUpdate(); }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Stroke Width — {selectedLayer.strokeWidth || 0}</label>
            <input type="range" min={0} max={20} value={selectedLayer.strokeWidth || 0}
              onChange={e => updateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>
          <div className="input-group">
            <label className="input-label">Opacity — {Math.round((selectedLayer.opacity || 1) * 100)}%</label>
            <input type="range" min={0} max={1} step={0.05} value={selectedLayer.opacity || 1}
              onChange={e => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sticker Panel ── ────────────────────────────────────── */
function StickerPanel({ addSticker }) {
  const [activeCat, setActiveCat] = useState('festive');
  const cat = stickerCategories.find(c => c.id === activeCat);
  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Stickers</h3>
      <div className="scroll-x" style={{ marginBottom: 'var(--space-3)' }}>
        {stickerCategories.map(c => (
          <button key={c.id} className={`chip ${activeCat === c.id ? 'chip-active' : ''}`} onClick={() => setActiveCat(c.id)}>{c.icon} {c.name}</button>
        ))}
      </div>
      <div className="sticker-grid">
        {cat?.stickers.map(s => (
          <button key={s.id} className="sticker-btn" onClick={() => addSticker(s.emoji)} title={s.label}>{s.emoji}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Image / Background Panel ── ─────────────────────────── */
function ImagePanel({ background, setBackground, onUpload, canvasPreset, setCanvasPreset }) {
  const colors = ['#FFFFFF', '#0F0A2C', '#1A1A2E', '#E53935', '#FFB300', '#43A047', '#1565C0', '#AB47BC', '#FF6F00', '#00897B', '#000000', '#1E293B', '#334155', '#F97316', '#EF4444', '#8B5CF6', '#06B6D4', '#D946EF', '#84CC16', '#F43F5E'];
  const gradients = [
    'linear-gradient(135deg, #E53935 0%, #FFB300 100%)',
    'linear-gradient(135deg, #6C3CE1 0%, #E84393 100%)',
    'linear-gradient(135deg, #43A047 0%, #66BB6A 100%)',
    'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
    'linear-gradient(135deg, #FF6F00 0%, #FFD54F 100%)',
    'linear-gradient(135deg, #AB47BC 0%, #CE93D8 100%)',
    'linear-gradient(135deg, #0F0A2C 0%, #6C3CE1 100%)',
    'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #51CF66 100%)',
    'linear-gradient(135deg, #0A0A1A 0%, #1A0A3A 100%)',
    'linear-gradient(180deg, #232526 0%, #414345 100%)',
    'linear-gradient(135deg, #FC5C7D 0%, #6A82FB 100%)',
    'linear-gradient(135deg, #2BC0E4 0%, #EAECC6 100%)',
    'linear-gradient(135deg, #C33764 0%, #1D2671 100%)',
    'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  ];

  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Background & Size</h3>
      <button className="btn btn-secondary btn-sm" onClick={onUpload} style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
        <ImageIcon size={16} /> Upload Image
      </button>

      {/* Canvas Size Presets */}
      <label className="input-label">Canvas Size</label>
      <div className="canvas-size-grid">
        {canvasSizePresets.map(p => (
          <button key={p.id} className={`canvas-size-btn ${canvasPreset === p.id ? 'active' : ''}`} onClick={() => setCanvasPreset(p.id)}>
            <span className="canvas-size-icon">{p.icon}</span>
            <span className="canvas-size-name">{p.name}</span>
            <span className="canvas-size-label">{p.label}</span>
          </button>
        ))}
      </div>

      <label className="input-label" style={{ marginTop: 'var(--space-4)' }}>Colors</label>
      <div className="color-grid">
        {colors.map(c => (
          <button key={c} className={`color-swatch ${background.value === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setBackground({ type: 'color', value: c })} />
        ))}
      </div>
      <label className="input-label" style={{ marginTop: 'var(--space-4)' }}>Gradients</label>
      <div className="color-grid">
        {gradients.map((g, i) => (
          <button key={i} className={`color-swatch ${background.value === g ? 'active' : ''}`} style={{ background: g }} onClick={() => setBackground({ type: 'gradient', value: g })} />
        ))}
      </div>
    </div>
  );
}

/* ── Effects Panel ── Particles, overlays, animations ──── */
function EffectsPanel({ activeEffect, setActiveEffect, overlay, setOverlay }) {
  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Motion Effects</h3>
      <p className="editor-panel-desc">Add particle animations to your creation</p>
      <div className="effect-grid">
        <button className={`effect-card ${!activeEffect ? 'active' : ''}`} onClick={() => setActiveEffect(null)}>
          <span className="effect-icon">🚫</span>
          <span className="effect-name">None</span>
        </button>
        {effectPresets.map(e => (
          <button key={e.id} className={`effect-card ${activeEffect?.type === e.id ? 'active' : ''}`}
            onClick={() => setActiveEffect(activeEffect?.type === e.id ? null : { type: e.id, intensity: 1 })}>
            <span className="effect-icon">{e.icon}</span>
            <span className="effect-name">{e.name}</span>
          </button>
        ))}
      </div>

      {/* Color Overlay */}
      <label className="input-label" style={{ marginTop: 'var(--space-6)' }}>Color Overlay</label>
      <p className="editor-panel-desc">Tint the background with a color</p>
      <div className="overlay-grid">
        {overlayPresets.map(o => (
          <button key={o.id} className={`overlay-btn ${overlay.color === o.color && overlay.opacity === o.opacity ? 'active' : ''}`}
            onClick={() => setOverlay({ type: o.id === 'none' ? 'none' : 'color', color: o.color, opacity: o.opacity })}>
            <div className="overlay-preview" style={{ background: o.color || 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px' }} />
            <span>{o.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Filters Panel ── Adjustments like Canva ────────────── */
function FiltersPanel({ bgFilter, setBgFilter, resetBgFilter }) {
  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Filters & Adjust</h3>

      {/* Quick filter presets */}
      <label className="input-label">Presets</label>
      <div className="filter-preset-grid">
        {filterPresets.map(fp => (
          <button key={fp.id} className={`filter-preset-btn ${JSON.stringify(bgFilter) === JSON.stringify(fp.filter) ? 'active' : ''}`}
            onClick={() => Object.entries(fp.filter).forEach(([k, v]) => setBgFilter(k, v))}>
            <div className="filter-preset-preview" style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FFD93D, #51CF66)',
              filter: `brightness(${fp.filter.brightness}%) contrast(${fp.filter.contrast}%) saturate(${fp.filter.saturate}%) sepia(${fp.filter.sepia}%) grayscale(${fp.filter.grayscale}%) hue-rotate(${fp.filter.hueRotate}deg)`,
            }} />
            <span>{fp.name}</span>
          </button>
        ))}
      </div>

      {/* Manual sliders */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)' }}>
        <label className="input-label" style={{ margin: 0 }}>Manual Adjust</label>
        <button className="btn btn-ghost btn-sm" onClick={resetBgFilter} style={{ fontSize: 'var(--text-xs)' }}><RotateCcw size={14} /> Reset</button>
      </div>
      {[
        { key: 'brightness', label: 'Brightness', min: 30, max: 200, unit: '%' },
        { key: 'contrast', label: 'Contrast', min: 30, max: 200, unit: '%' },
        { key: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
        { key: 'blur', label: 'Blur', min: 0, max: 20, unit: 'px' },
        { key: 'hueRotate', label: 'Hue Rotate', min: 0, max: 360, unit: '°' },
        { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
        { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%' },
      ].map(({ key, label, min, max, unit }) => (
        <div className="input-group" key={key} style={{ marginTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="input-label" style={{ margin: 0 }}>{label}</label>
            <span className="input-label" style={{ margin: 0 }}>{bgFilter[key]}{unit}</span>
          </div>
          <input type="range" min={min} max={max} value={bgFilter[key]} onChange={e => setBgFilter(key, parseInt(e.target.value))} />
        </div>
      ))}
    </div>
  );
}

/* ── Layers Panel ── ─────────────────────────────────────── */
function LayersPanelUI({ 
  layers, selectedId, onSelect, onRemove, onDuplicate, 
  onToggleVisibility, onToggleLock, onMove, updateLayer, commitUpdate 
}) {
  const getLayerLabel = (layer) => {
    if (layer.type === 'text') return layer.text?.slice(0, 18) || 'Text';
    if (layer.type === 'sticker') return layer.emoji;
    if (layer.type === 'shape') return layer.shapeType || 'Shape';
    if (layer.type === 'themeLayer') return layer.name || 'Theme Layer';
    return '?';
  };
  const getLayerIcon = (layer) => {
    if (layer.type === 'text') return 'Aa';
    if (layer.type === 'sticker') return layer.emoji;
    if (layer.type === 'shape') return '◆';
    if (layer.type === 'themeLayer') return '🖼️';
    return '?';
  };

  const selectedLayer = layers.find(l => l.id === selectedId);
  const isTheme = selectedLayer?.type === 'themeLayer';

  const blendModes = [
    'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
  ];

  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">Layers ({layers.length})</h3>
      {layers.length === 0 ? (
        <p className="editor-panel-desc">No layers yet. Add text, shapes, or stickers.</p>
      ) : (
        <div className="layers-list">
          {[...layers].reverse().map(layer => (
            <div key={layer.id} className={`layer-item ${selectedId === layer.id ? 'layer-item-active' : ''}`} onClick={() => onSelect(layer.id)}>
              <span className="layer-icon">{getLayerIcon(layer)}</span>
              <span className="layer-name truncate">{getLayerLabel(layer)}</span>
              <div className="layer-actions">
                <button onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id); }}>{layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                <button onClick={e => { e.stopPropagation(); onToggleLock(layer.id); }}>{layer.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                <button onClick={e => { e.stopPropagation(); onDuplicate(layer.id); }}><Copy size={14} /></button>
                <button onClick={e => { e.stopPropagation(); onMove(layer.id, 'up'); }}><MoveUp size={14} /></button>
                <button onClick={e => { e.stopPropagation(); onRemove(layer.id); }} style={{ color: 'var(--color-error)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme Layer Properties */}
      {isTheme && (
        <div className="editor-controls" style={{ borderTop: '1px solid var(--color-gray-200)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>
          <h4 className="section-divider" style={{ marginTop: 0 }}>Theme Styles</h4>
          
          <div className="input-group">
            <label className="input-label">Opacity — {Math.round((selectedLayer.opacity || 1) * 100)}%</label>
            <input type="range" className="slider" min={0} max={1} step={0.05} value={selectedLayer.opacity || 1}
              onChange={e => {
                updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) });
                commitUpdate();
              }} 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Blend Mode</label>
            <select 
              className="input-field" 
              value={selectedLayer.globalCompositeOperation || 'source-over'}
              onChange={e => {
                 updateLayer(selectedLayer.id, { globalCompositeOperation: e.target.value });
                 commitUpdate();
              }}
            >
              {blendModes.map(m => <option key={m} value={m}>{m.replace('-', ' ')}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Shadow Blur</label>
            <input type="range" className="slider" min={0} max={50} value={selectedLayer.shadowBlur || 0}
              onChange={e => {
                updateLayer(selectedLayer.id, { shadowBlur: parseInt(e.target.value) });
                commitUpdate();
              }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Corner Radius</label>
            <input type="range" className="slider" min={0} max={100} value={selectedLayer.cornerRadius || 0}
              onChange={e => {
                updateLayer(selectedLayer.id, { cornerRadius: parseInt(e.target.value) });
                commitUpdate();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
