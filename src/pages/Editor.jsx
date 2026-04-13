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
import useStickerStore from '../stores/stickerStore';
import { stickerCategories as emojiStickerCategories } from '../data/sampleStickers';
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

  if (layer.type === 'stickerImage') {
    return (
      <SelectableNode key={key} layer={layer} isSelected={isSelected} onSelect={onSelect} onChange={onChange}>
        {(props, ref) => {
          const [image, setImage] = React.useState(null);
          React.useEffect(() => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = layer.url;
            img.onload = () => setImage(img);
          }, [layer.url]);

          if (!image) return (
            <Rect {...props} x={layer.x} y={layer.y}
              width={layer.width || 120} height={layer.height || 120}
              fill="#f0f0f0" opacity={0.4}
            />
          );

          const w = layer.width || 120;
          const h = layer.height || 120;

          return (
            <React.Fragment>
              {/* Glow effect under the image */}
              {layer.glowColor && layer.glowBlur > 0 && (
                <Rect
                  x={layer.x - 4}
                  y={layer.y - 4}
                  width={w + 8}
                  height={h + 8}
                  fill={layer.glowColor}
                  opacity={(layer.glowBlur || 0) / 40}
                  cornerRadius={8}
                  listening={false}
                />
              )}
              <Rect
                {...props}
                x={layer.x}
                y={layer.y}
                width={w}
                height={h}
                fillPatternImage={image}
                fillPatternScaleX={w / image.width}
                fillPatternScaleY={h / image.height}
                opacity={layer.opacity != null ? layer.opacity : 1}
                shadowColor={layer.shadowColor || ''}
                shadowBlur={layer.shadowBlur || 0}
                shadowOffsetX={layer.shadowOffsetX || 0}
                shadowOffsetY={layer.shadowOffsetY || 0}
                stroke={layer.borderColor || ''}
                strokeWidth={layer.borderWidth || 0}
                cornerRadius={layer.cornerRadius || 0}
                visible={layer.visible}
                draggable={!layer.locked}
                rotation={layer.rotation || 0}
                scaleX={layer.scaleX || 1}
                scaleY={layer.scaleY || 1}
              />
            </React.Fragment>
          );
        }}
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

  const addImageSticker = (sticker) => {
    store.addLayer({
      type: 'stickerImage',
      url: sticker.image_url,
      name: sticker.name,
      x: stageSize.width / 2 - 60,
      y: stageSize.height / 2 - 60,
      width: 120,
      height: 120,
      opacity: 1,
      rotation: 0,
      shadowBlur: 0,
      shadowColor: '#000000',
      borderWidth: 0,
      borderColor: '#ffffff',
      glowBlur: 0,
      glowColor: '#ffffff',
    });
    setActivePanel('layers');
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
            {activePanel === 'sticker' && (
              <StickerPanel
                addSticker={addSticker}
                addImageSticker={addImageSticker}
                selectedLayer={selectedLayer}
                updateLayer={store.updateLayer}
                commitUpdate={store.commitLayerUpdate}
              />
            )}
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

/* ════════════════════════════════════════════════════════════
   TEXT PANEL — Premium Canva-level text editor
   ════════════════════════════════════════════════════════════ */
function TextPanel({ selectedLayer, addText, updateLayer, commitUpdate }) {
  const isText = selectedLayer?.type === 'text';
  const [activeTab, setActiveTab] = React.useState('write');

  /* ── Fonts ── */
  const fonts = [
    'Outfit', 'Inter', 'Georgia', 'Impact', 'Pacifico', 'Lobster',
    'Playfair Display', 'Raleway', 'Oswald', 'Montserrat',
    'Dancing Script', 'Bebas Neue', 'Righteous', 'Satisfy',
    'Arial', 'Courier New', 'Verdana', 'Times New Roman',
  ];

  /* ── Gradient presets ── */
  const gradientPresets = [
    { label: 'Gold', stops: [0, '#FFD700', 0.5, '#FFA500', 1, '#FF6B00'] },
    { label: 'Neon', stops: [0, '#00FFFF', 1, '#FF00FF'] },
    { label: 'Sunset', stops: [0, '#FF416C', 1, '#FF4B2B'] },
    { label: 'Ocean', stops: [0, '#00C9FF', 1, '#92FE9D'] },
    { label: 'Fire', stops: [0, '#f12711', 1, '#f5af19'] },
    { label: 'Purple', stops: [0, '#6C3CE1', 1, '#E84393'] },
    { label: 'Mint', stops: [0, '#43e97b', 1, '#38f9d7'] },
    { label: 'Rose', stops: [0, '#FF9A9E', 1, '#FECFEF'] },
    { label: 'Galaxy', stops: [0, '#0F0C29', 0.5, '#302B63', 1, '#24243E'] },
    { label: 'Chrome', stops: [0, '#FFFFFF', 0.5, '#AAAAAA', 1, '#FFFFFF'] },
    { label: 'Aurora', stops: [0, '#00F260', 1, '#0575E6'] },
    { label: 'Candy', stops: [0, '#f953c6', 1, '#b91d73'] },
  ];

  /* ── Color palette ── */
  const palette = [
    '#FFFFFF', '#F8F9FA', '#DEE2E6', '#ADB5BD', '#6C757D', '#343A40', '#000000',
    '#FFD700', '#FFA500', '#FF6B35', '#FF4444', '#E84393', '#9B59B6', '#6C3CE1',
    '#3B82F6', '#00C9FF', '#10B981', '#22C55E', '#84CC16', '#F59E0B',
    '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FC8', '#A8EDEA',
  ];

  /* ── Effect presets (1-click) ── */
  const effectPresetsList = [
    {
      label: '🌟 Neon Glow', icon: '🌟',
      apply: (l) => ({ shadowColor: l.fill || '#00FFFF', shadowBlur: 25, shadowOffsetX: 0, shadowOffsetY: 0, stroke: '', strokeWidth: 0 }),
    },
    {
      label: '🔥 Fire', icon: '🔥',
      apply: () => ({ fillLinearGradientColorStops: [0, '#f12711', 1, '#f5af19'], shadowColor: '#FF4444', shadowBlur: 15, shadowOffsetX: 0, shadowOffsetY: 4 }),
    },
    {
      label: '💎 Chrome', icon: '💎',
      apply: () => ({ fillLinearGradientColorStops: [0, '#FFFFFF', 0.5, '#AAAAAA', 1, '#FFFFFF'], stroke: '#888', strokeWidth: 1, shadowColor: '#000', shadowBlur: 8 }),
    },
    {
      label: '☁️ Glass', icon: '☁️',
      apply: () => ({ fill: 'rgba(255,255,255,0.15)', stroke: '#FFFFFF', strokeWidth: 2, globalCompositeOperation: 'screen', shadowBlur: 12, shadowColor: '#FFFFFF' }),
    },
    {
      label: '🖤 3D Bold', icon: '🖤',
      apply: () => ({ depth3d: 6, depthColor: '#000000', fill: '#FFFFFF', strokeWidth: 0, shadowBlur: 0 }),
    },
    {
      label: '✨ Gold', icon: '✨',
      apply: () => ({ fillLinearGradientColorStops: [0, '#FFD700', 0.5, '#FFA500', 1, '#FFD700'], stroke: '#B8860B', strokeWidth: 1, shadowColor: '#FF8C00', shadowBlur: 10 }),
    },
    {
      label: '🌈 Rainbow', icon: '🌈',
      apply: () => ({ fillLinearGradientColorStops: [0, '#FF6B6B', 0.2, '#FFD93D', 0.4, '#6BCB77', 0.6, '#4D96FF', 0.8, '#FF6FC8', 1, '#A8EDEA'] }),
    },
    {
      label: '🖊️ Outline', icon: '🖊️',
      apply: (l) => ({ fill: 'transparent', stroke: l.fill || '#FFFFFF', strokeWidth: 3, shadowBlur: 0 }),
    },
  ];

  /* ── Blend modes ── */
  const blendModes = [
    { value: 'source-over', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'lighten', label: 'Lighten' },
    { value: 'darken', label: 'Darken' },
    { value: 'color-dodge', label: 'Dodge' },
    { value: 'difference', label: 'Difference' },
    { value: 'exclusion', label: 'Exclusion' },
    { value: 'luminosity', label: 'Luminosity' },
  ];

  /* ── Add text quick-start panel ── */
  if (!isText) {
    const quickStyles = [
      { label: 'Heading', size: 56, style: 'bold', preview: 'Aa', gradient: [0, '#6C3CE1', 1, '#E84393'] },
      { label: 'Subtext', size: 28, style: 'normal', preview: 'Bb', fill: '#FFFFFF', stroke: '', strokeWidth: 0 },
      { label: 'Body', size: 18, style: 'normal', preview: 'Cc', fill: '#E2E8F0' },
      { label: 'Neon', size: 40, style: 'bold', preview: 'Dd', fill: '#00FFFF', shadow: true },
      { label: 'Outline', size: 44, style: 'bold', preview: 'Ee', fill: 'transparent', stroke: '#FFFFFF', strokeWidth: 3 },
      { label: 'Gold', size: 44, style: 'bold', preview: 'Ff', gradient: [0, '#FFD700', 0.5, '#FFA500', 1, '#FFD700'] },
    ];
    return (
      <div className="editor-panel-content">
        <h3 className="editor-panel-title">✍️ Text</h3>
        <p className="editor-panel-desc">Tap a style to add text, or choose a quick option below.</p>
        <div className="text-add-grid">
          {quickStyles.map((qs) => (
            <button key={qs.label} className="text-add-card" onClick={() => {
              const layer = {
                fontSize: qs.size,
                fontStyle: qs.style,
                fill: qs.fill || '#FFFFFF',
              };
              if (qs.gradient) layer.fillLinearGradientColorStops = qs.gradient;
              if (qs.shadow) { layer.shadowColor = qs.fill || '#FFFFFF'; layer.shadowBlur = 20; layer.shadowOffsetX = 0; layer.shadowOffsetY = 0; }
              if (qs.stroke !== undefined) layer.stroke = qs.stroke;
              if (qs.strokeWidth !== undefined) layer.strokeWidth = qs.strokeWidth;
              addText(layer);
            }}>
              <div className="text-add-preview" style={{
                fontSize: Math.max(14, Math.min(24, qs.size * 0.5)),
                fontWeight: qs.style.includes('bold') ? 800 : 400,
                color: qs.fill === 'transparent' ? 'transparent' : (qs.fill || '#FFF'),
                WebkitTextStroke: qs.strokeWidth ? `${Math.min(qs.strokeWidth, 2)}px ${qs.stroke || '#FFF'}` : undefined,
                background: qs.gradient
                  ? `linear-gradient(135deg, ${qs.gradient[1]}, ${qs.gradient[qs.gradient.length - 1]})`
                  : 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
                WebkitBackgroundClip: qs.gradient ? 'text' : undefined,
                WebkitTextFillColor: qs.gradient ? 'transparent' : undefined,
                textShadow: qs.shadow ? `0 0 12px ${qs.fill || '#FFF'}` : 'none',
              }}>{qs.preview}</div>
              <span className="text-add-label">{qs.label}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => addText({ fontSize: 48, fontStyle: 'bold' })}>
            + Add Text
          </button>
        </div>
        <p className="editor-panel-desc" style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
          💡 Select a text layer on canvas to edit
        </p>
      </div>
    );
  }

  return (
    <div className="editor-panel-content advanced-text-panel">
      {/* Tab bar */}
      <div className="text-tabs-bar">
        {[
          { id: 'write', label: '✍️', title: 'Write' },
          { id: 'style', label: '🎨', title: 'Style' },
          { id: 'effects', label: '✨', title: 'Effects' },
          { id: 'curve', label: '〰️', title: 'Curve & 3D' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`text-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
          >
            <span className="text-tab-icon">{tab.label}</span>
            <span className="text-tab-label">{tab.title}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ WRITE TAB ═══════════════ */}
      {activeTab === 'write' && (
        <div className="text-tab-content">
          {/* Live text input */}
          <div className="text-input-wrapper">
            <textarea
              className="text-live-input"
              value={selectedLayer.text}
              rows={3}
              placeholder="Type your text here..."
              onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })}
              onBlur={commitUpdate}
            />
          </div>

          {/* Font family */}
          <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
            <label className="input-label">Font Family</label>
            <select className="input select font-select" value={selectedLayer.fontFamily || 'Outfit'}
              onChange={e => { updateLayer(selectedLayer.id, { fontFamily: e.target.value }); commitUpdate(); }}>
              {fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
          </div>

          {/* Font size */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Size</span>
              <span className="value-badge">{selectedLayer.fontSize || 32}px</span>
            </label>
            <input type="range" className="slider" value={selectedLayer.fontSize || 32} min={8} max={240}
              onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
              onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>

          {/* Bold / Italic / Alignment row */}
          <div className="text-format-row">
            <div className="editor-btn-group" style={{ flex: 'none' }}>
              <button
                className={`editor-format-btn ${(selectedLayer.fontStyle || '').includes('bold') ? 'active' : ''}`}
                onClick={() => {
                  const cur = selectedLayer.fontStyle || '';
                  const next = cur.includes('bold') ? cur.replace('bold', '').trim() : `bold ${cur}`.trim();
                  updateLayer(selectedLayer.id, { fontStyle: next }); commitUpdate();
                }}
              ><Bold size={16} /></button>
              <button
                className={`editor-format-btn ${(selectedLayer.fontStyle || '').includes('italic') ? 'active' : ''}`}
                onClick={() => {
                  const cur = selectedLayer.fontStyle || '';
                  const next = cur.includes('italic') ? cur.replace('italic', '').trim() : `${cur} italic`.trim();
                  updateLayer(selectedLayer.id, { fontStyle: next }); commitUpdate();
                }}
              ><Italic size={16} /></button>
            </div>
            <div className="editor-btn-group" style={{ flex: 'none' }}>
              {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([a, Icon]) => (
                <button key={a} className={`editor-format-btn ${selectedLayer.align === a ? 'active' : ''}`}
                  onClick={() => { updateLayer(selectedLayer.id, { align: a }); commitUpdate(); }}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Letter spacing */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Letter Spacing</span>
              <span className="value-badge">{selectedLayer.letterSpacing || 0}</span>
            </label>
            <input type="range" className="slider" value={selectedLayer.letterSpacing || 0} min={-5} max={60}
              onChange={e => updateLayer(selectedLayer.id, { letterSpacing: parseInt(e.target.value) })}
              onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>

          {/* Line height */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Line Height</span>
              <span className="value-badge">{(selectedLayer.lineHeight || 1.2).toFixed(1)}x</span>
            </label>
            <input type="range" className="slider" value={selectedLayer.lineHeight || 1.2} min={0.5} max={3} step={0.1}
              onChange={e => updateLayer(selectedLayer.id, { lineHeight: parseFloat(e.target.value) })}
              onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>

          {/* Opacity */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Opacity</span>
              <span className="value-badge">{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
            </label>
            <input type="range" className="slider" value={selectedLayer.opacity ?? 1} min={0} max={1} step={0.05}
              onChange={e => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
              onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>
        </div>
      )}

      {/* ═══════════════ STYLE TAB ═══════════════ */}
      {activeTab === 'style' && (
        <div className="text-tab-content">
          {/* Color Palette */}
          <div className="input-group">
            <label className="input-label">Solid Color</label>
            <div className="color-palette-grid">
              {palette.map(c => (
                <button
                  key={c}
                  className={`palette-swatch ${(selectedLayer.fill === c && !selectedLayer.fillLinearGradientColorStops) ? 'active' : ''}`}
                  style={{ background: c, border: c === '#FFFFFF' ? '1px solid #ddd' : 'none' }}
                  onClick={() => { updateLayer(selectedLayer.id, { fill: c, fillLinearGradientColorStops: null }); commitUpdate(); }}
                  title={c}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', alignItems: 'center' }}>
              <input type="color" className="input-color-large" style={{ width: 56, height: 40, flex: 'none' }}
                value={selectedLayer.fill?.startsWith('#') ? selectedLayer.fill : '#FFFFFF'}
                onChange={e => { updateLayer(selectedLayer.id, { fill: e.target.value, fillLinearGradientColorStops: null }); commitUpdate(); }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flex: 1 }}>
                Custom color or pick from palette above
              </span>
            </div>
          </div>

          {/* Gradient Fill */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-4)' }}>🌈 Gradient Fill</h4>
          <div className="gradient-presets-grid">
            {gradientPresets.map(gp => (
              <button
                key={gp.label}
                className="gradient-preset-btn"
                style={{ background: `linear-gradient(135deg, ${gp.stops.filter((_, i) => i % 2 === 1).join(', ')})` }}
                onClick={() => { updateLayer(selectedLayer.id, { fillLinearGradientColorStops: gp.stops }); commitUpdate(); }}
                title={gp.label}
              >
                <span className="gradient-label">{gp.label}</span>
              </button>
            ))}
          </div>
          {selectedLayer.fillLinearGradientColorStops && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', alignItems: 'center' }}>
              <input type="color" className="input-color-large" style={{ flex: 1, height: 36 }}
                defaultValue={selectedLayer.fillLinearGradientColorStops[1] || '#FFFFFF'}
                onChange={e => {
                  const stops = [...(selectedLayer.fillLinearGradientColorStops || [0, e.target.value, 1, '#000'])];
                  stops[1] = e.target.value;
                  updateLayer(selectedLayer.id, { fillLinearGradientColorStops: stops });
                }}
                onBlur={commitUpdate}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>↔</span>
              <input type="color" className="input-color-large" style={{ flex: 1, height: 36 }}
                defaultValue={selectedLayer.fillLinearGradientColorStops[selectedLayer.fillLinearGradientColorStops.length - 1] || '#000000'}
                onChange={e => {
                  const stops = [...(selectedLayer.fillLinearGradientColorStops || [0, '#FFF', 1, e.target.value])];
                  stops[stops.length - 1] = e.target.value;
                  updateLayer(selectedLayer.id, { fillLinearGradientColorStops: stops });
                }}
                onBlur={commitUpdate}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => { updateLayer(selectedLayer.id, { fillLinearGradientColorStops: null }); commitUpdate(); }}>
                ✕
              </button>
            </div>
          )}

          {/* Stroke */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-4)' }}>🖊️ Stroke / Outline</h4>
          <div className="editor-row" style={{ alignItems: 'flex-start' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Color</label>
              <input type="color" className="input-color-large" value={selectedLayer.stroke || '#000000'}
                onChange={e => { updateLayer(selectedLayer.id, { stroke: e.target.value }); commitUpdate(); }} />
            </div>
            <div className="input-group" style={{ flex: 2 }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Width</span>
                <span className="value-badge">{selectedLayer.strokeWidth || 0}px</span>
              </label>
              <input type="range" className="slider" value={selectedLayer.strokeWidth || 0} min={0} max={20}
                onChange={e => updateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })}
                onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>
          </div>

          {/* Blend Mode */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-4)' }}>⚗️ Blend Mode</h4>
          <div className="blend-mode-grid">
            {blendModes.map(bm => (
              <button
                key={bm.value}
                className={`blend-mode-btn ${(selectedLayer.globalCompositeOperation || 'source-over') === bm.value ? 'active' : ''}`}
                onClick={() => { updateLayer(selectedLayer.id, { globalCompositeOperation: bm.value }); commitUpdate(); }}
              >
                {bm.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ EFFECTS TAB ═══════════════ */}
      {activeTab === 'effects' && (
        <div className="text-tab-content">
          {/* One-click effect presets */}
          <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>⚡ Quick Effects</label>
          <div className="effect-presets-2col">
            {effectPresetsList.map(ep => (
              <button
                key={ep.label}
                className="effect-preset-card"
                onClick={() => {
                  const updates = ep.apply(selectedLayer);
                  updateLayer(selectedLayer.id, updates);
                  commitUpdate();
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{ep.icon}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{ep.label.replace(/^.{2}/, '')}</span>
              </button>
            ))}
          </div>

          {/* Shadow */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-5)' }}>🌑 Drop Shadow</h4>
          <div className="editor-row" style={{ alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Color</label>
              <input type="color" className="input-color-large" value={selectedLayer.shadowColor?.startsWith('#') ? selectedLayer.shadowColor : '#000000'}
                onChange={e => { updateLayer(selectedLayer.id, { shadowColor: e.target.value }); commitUpdate(); }} />
            </div>
            <div className="input-group" style={{ flex: 2 }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Blur</span><span className="value-badge">{selectedLayer.shadowBlur || 0}</span>
              </label>
              <input type="range" className="slider" value={selectedLayer.shadowBlur || 0} min={0} max={60}
                onChange={e => updateLayer(selectedLayer.id, { shadowBlur: parseInt(e.target.value) })}
                onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>
          </div>
          <div className="editor-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>X</span><span className="value-badge">{selectedLayer.shadowOffsetX || 0}</span>
              </label>
              <input type="range" className="slider" value={selectedLayer.shadowOffsetX || 0} min={-50} max={50}
                onChange={e => updateLayer(selectedLayer.id, { shadowOffsetX: parseInt(e.target.value) })}
                onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Y</span><span className="value-badge">{selectedLayer.shadowOffsetY || 0}</span>
              </label>
              <input type="range" className="slider" value={selectedLayer.shadowOffsetY || 0} min={-50} max={50}
                onChange={e => updateLayer(selectedLayer.id, { shadowOffsetY: parseInt(e.target.value) })}
                onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>
          </div>

          {/* Neon Glow quick set */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-4)' }}>🌟 Neon Glow</h4>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['#00FFFF', '#FF00FF', '#FFD700', '#FF6B35', '#00FF88', '#FFFFFF'].map(c => (
              <button key={c} style={{
                width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                boxShadow: `0 0 8px ${c}`,
                transition: 'transform 0.15s',
              }}
                onClick={() => {
                  updateLayer(selectedLayer.id, { shadowColor: c, shadowBlur: 22, shadowOffsetX: 0, shadowOffsetY: 0 });
                  commitUpdate();
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title={`Neon ${c}`}
              />
            ))}
            <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-gray-200)', border: 'none', cursor: 'pointer', fontSize: 14 }}
              onClick={() => { updateLayer(selectedLayer.id, { shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0 }); commitUpdate(); }}
              title="Remove glow"
            >✕</button>
          </div>

          {/* Reset */}
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-6)' }}
            onClick={() => {
              updateLayer(selectedLayer.id, {
                shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
                shadowColor: '#000000', depth3d: 0, curveRadius: 0,
                fillLinearGradientColorStops: null, globalCompositeOperation: 'source-over',
                stroke: '', strokeWidth: 0,
              });
              commitUpdate();
            }}>
            🔄 Reset All Effects
          </button>
        </div>
      )}

      {/* ═══════════════ CURVE & 3D TAB ═══════════════ */}
      {activeTab === 'curve' && (
        <div className="text-tab-content">
          {/* Curve */}
          <div className="curve-preview-card">
            <svg viewBox="0 0 200 60" width="100%" height={60} style={{ display: 'block' }}>
              <path d={`M 10,50 Q 100,${50 - (selectedLayer.curveRadius || 0) / 5} 190,50`} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="4 3" />
              <text x="100" y="40" textAnchor="middle" fontSize="13" fill="var(--color-primary)" fontFamily="Outfit">
                {selectedLayer.text?.slice(0, 14) || 'Preview'}
              </text>
            </svg>
          </div>
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>〰️ Curve / Bend</span>
              <span className="value-badge">{selectedLayer.curveRadius || 0}</span>
            </label>
            <input type="range" className="slider" value={selectedLayer.curveRadius || 0} min={-400} max={400}
              onChange={e => updateLayer(selectedLayer.id, { curveRadius: parseInt(e.target.value) })}
              onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
              <span>↙ Arch Down</span><span>Flat</span><span>Arch Up ↗</span>
            </div>
          </div>
          {/* Curve presets */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            {[
              { label: 'Flat', v: 0 }, { label: 'Slight +', v: 120 }, { label: 'Arch +', v: 200 },
              { label: 'Circle +', v: 300 }, { label: 'Slight −', v: -120 }, { label: 'Arch −', v: -200 },
            ].map(p => (
              <button key={p.label} className="btn btn-secondary btn-sm"
                onClick={() => { updateLayer(selectedLayer.id, { curveRadius: p.v }); commitUpdate(); }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* 3D Depth */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-6)' }}>🧱 3D Depth / Extrude</h4>
          <div className="depth3d-toggle-row">
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Enable 3D Block</span>
            <button
              className={`toggle-btn ${selectedLayer.depth3d > 0 ? 'on' : ''}`}
              onClick={() => {
                updateLayer(selectedLayer.id, { depth3d: selectedLayer.depth3d > 0 ? 0 : 6 });
                commitUpdate();
              }}
            >
              {selectedLayer.depth3d > 0 ? 'ON' : 'OFF'}
            </button>
          </div>
          {selectedLayer.depth3d > 0 && (
            <>
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Depth</span>
                  <span className="value-badge">{selectedLayer.depth3d || 5}</span>
                </label>
                <input type="range" className="slider" value={selectedLayer.depth3d || 5} min={1} max={30}
                  onChange={e => updateLayer(selectedLayer.id, { depth3d: parseInt(e.target.value) })}
                  onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
              <div className="input-group">
                <label className="input-label">Depth Color</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {['#000000', '#1A0A4A', '#4A0000', '#4A2800', '#001A4A', '#1A4A00'].map(c => (
                    <button key={c} style={{
                      width: 30, height: 30, borderRadius: 8, background: c, border: selectedLayer.depthColor === c ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer'
                    }} onClick={() => { updateLayer(selectedLayer.id, { depthColor: c }); commitUpdate(); }} />
                  ))}
                  <input type="color" className="input-color-large" style={{ width: 30, height: 30, padding: 0 }}
                    value={selectedLayer.depthColor || '#000000'}
                    onChange={e => { updateLayer(selectedLayer.id, { depthColor: e.target.value }); commitUpdate(); }} />
                </div>
              </div>
            </>
          )}

          {/* Rotation */}
          <h4 className="section-divider" style={{ marginTop: 'var(--space-5)' }}>🔄 Rotation</h4>
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Angle</span>
              <span className="value-badge">{Math.round(selectedLayer.rotation || 0)}°</span>
            </label>
            <input type="range" className="slider" value={selectedLayer.rotation || 0} min={-180} max={180}
              onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })}
              onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {[0, 45, 90, -45, -90, 180].map(deg => (
              <button key={deg} className="btn btn-secondary btn-sm"
                onClick={() => { updateLayer(selectedLayer.id, { rotation: deg }); commitUpdate(); }}>
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}
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
function StickerPanel({ addSticker, addImageSticker, selectedLayer, updateLayer, commitUpdate }) {
  const [activeCat, setActiveCat] = useState('all');
  const [activeTab, setActiveTab] = useState('image');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ws-recent-stickers') || '[]'); } catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ws-fav-stickers') || '[]'); } catch { return []; }
  });

  const { stickers: imageStickers, categories: imgCategories, fetchStickers, fetchStickerCategories, isLoading } = useStickerStore();

  useEffect(() => { fetchStickers(); fetchStickerCategories(); }, []);

  const handleAddEmoji = (emoji, label) => {
    addSticker(emoji);
    setRecentEmojis(prev => {
      const next = [{ emoji, label }, ...prev.filter(r => r.emoji !== emoji)].slice(0, 12);
      localStorage.setItem('ws-recent-stickers', JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorite = (emoji, label) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.emoji === emoji);
      const next = exists ? prev.filter(f => f.emoji !== emoji) : [{ emoji, label }, ...prev].slice(0, 24);
      localStorage.setItem('ws-fav-stickers', JSON.stringify(next));
      return next;
    });
  };

  const activeImageStickers = imageStickers.filter(s => s.is_active !== false);
  const filteredImageStickers = activeImageStickers.filter(s => {
    const matchCat = activeCat === 'all' || s.category === activeCat;
    const matchSearch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const emojiCat = emojiStickerCategories.find(c => c.id === activeCat);
  const allEmojiStickers = emojiStickerCategories.flatMap(c => c.stickers);
  const filteredEmojiStickers = activeCat === 'all'
    ? allEmojiStickers.filter(s => !searchTerm || s.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : (emojiCat?.stickers || []).filter(s => !searchTerm || s.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const isSelectedSticker = selectedLayer?.type === 'stickerImage';
  const isSelectedEmoji = selectedLayer?.type === 'sticker';

  return (
    <div className="editor-panel-content">
      <h3 className="editor-panel-title">🧷 Stickers</h3>

      <div className="sticker-source-tabs">
        <button className={`sticker-source-tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => { setActiveTab('image'); setActiveCat('all'); }}>
          🖼️ Image
        </button>
        <button className={`sticker-source-tab ${activeTab === 'emoji' ? 'active' : ''}`} onClick={() => { setActiveTab('emoji'); setActiveCat('all'); }}>
          😊 Emoji
        </button>
      </div>

      <div className="sticker-search-bar">
        <span>🔍</span>
        <input type="text" placeholder="Search stickers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>✕</button>}
      </div>

      {activeTab === 'image' ? (
        <div className="scroll-x sticker-cat-row">
          {imgCategories.map(c => (
            <button key={c.id} className={`chip ${activeCat === c.id ? 'chip-active' : ''}`} onClick={() => setActiveCat(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="scroll-x sticker-cat-row">
          <button className={`chip ${activeCat === 'all' ? 'chip-active' : ''}`} onClick={() => setActiveCat('all')}>🌟 All</button>
          {emojiStickerCategories.map(c => (
            <button key={c.id} className={`chip ${activeCat === c.id ? 'chip-active' : ''}`} onClick={() => setActiveCat(c.id)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'image' && (
        isLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-tertiary)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-2)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Loading stickers...</p>
          </div>
        ) : filteredImageStickers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🧷</div>
            <p style={{ fontSize: 'var(--text-sm)' }}>{searchTerm ? 'No results found.' : 'No image stickers yet. Upload via Admin → Sticker Manager.'}</p>
          </div>
        ) : (
          <>
            {filteredImageStickers.some(s => s.is_featured) && !searchTerm && activeCat === 'all' && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>⭐ Featured</label>
                <div className="sticker-image-grid">
                  {filteredImageStickers.filter(s => s.is_featured).map(s => (
                    <button key={`feat-${s.id}`} className="sticker-image-btn" onClick={() => addImageSticker(s)} title={s.name}>
                      <img src={s.image_url} alt={s.name} loading="lazy" />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="sticker-image-grid">
              {filteredImageStickers.map(s => (
                <button key={s.id} className="sticker-image-btn" onClick={() => addImageSticker(s)} title={s.name}>
                  <img src={s.image_url} alt={s.name} loading="lazy" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </>
        )
      )}

      {activeTab === 'emoji' && (
        <>
          {recentEmojis.length > 0 && !searchTerm && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>🕐 Recently Used</label>
              <div className="sticker-grid">
                {recentEmojis.map(r => (
                  <button key={r.emoji} className="sticker-btn sticker-recent" onClick={() => handleAddEmoji(r.emoji, r.label)} title={r.label}>{r.emoji}</button>
                ))}
              </div>
            </div>
          )}
          {favorites.length > 0 && !searchTerm && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>⭐ Favorites</label>
              <div className="sticker-grid">
                {favorites.map(f => (
                  <div key={f.emoji} className="sticker-fav-item">
                    <button className="sticker-btn" onClick={() => handleAddEmoji(f.emoji, f.label)} title={f.label}>{f.emoji}</button>
                    <button className="sticker-fav-remove" onClick={() => toggleFavorite(f.emoji, f.label)} title="Unfavorite">★</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="sticker-grid">
            {filteredEmojiStickers.map(s => (
              <div key={s.id} className="sticker-item-wrap">
                <button className="sticker-btn" onClick={() => handleAddEmoji(s.emoji, s.label)} title={s.label}>{s.emoji}</button>
                <button className={`sticker-fav-star ${favorites.find(f => f.emoji === s.emoji) ? 'active' : ''}`} onClick={() => toggleFavorite(s.emoji, s.label)} title="Favorite">★</button>
              </div>
            ))}
          </div>
        </>
      )}

      {(isSelectedSticker || isSelectedEmoji) && (
        <div className="sticker-style-panel">
          <h4 className="section-divider">🎨 Sticker Style</h4>
          <div className="input-group">
            <label className="input-label">Opacity — {Math.round((selectedLayer.opacity ?? 1) * 100)}%</label>
            <input type="range" className="slider" min={0} max={1} step={0.05} value={selectedLayer.opacity ?? 1}
              onChange={e => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>
          {isSelectedEmoji && (
            <div className="input-group">
              <label className="input-label">Size — {selectedLayer.fontSize || 64}px</label>
              <input type="range" className="slider" min={12} max={300} value={selectedLayer.fontSize || 64}
                onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
            </div>
          )}
          {isSelectedSticker && (
            <>
              <div className="input-group">
                <label className="input-label">Size — {selectedLayer.width || 120}px</label>
                <input type="range" className="slider" min={20} max={600} value={selectedLayer.width || 120}
                  onChange={e => updateLayer(selectedLayer.id, { width: parseInt(e.target.value), height: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
              </div>
              <h4 className="section-divider">Shadow</h4>
              <div className="editor-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Color</label>
                  <input type="color" className="input-color-large" value={selectedLayer.shadowColor || '#000000'}
                    onChange={e => { updateLayer(selectedLayer.id, { shadowColor: e.target.value }); commitUpdate(); }} />
                </div>
                <div className="input-group" style={{ flex: 2 }}>
                  <label className="input-label">Blur — {selectedLayer.shadowBlur || 0}</label>
                  <input type="range" className="slider" min={0} max={40} value={selectedLayer.shadowBlur || 0}
                    onChange={e => updateLayer(selectedLayer.id, { shadowBlur: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                </div>
              </div>
              <div className="editor-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Offset X</label>
                  <input type="range" className="slider" min={-30} max={30} value={selectedLayer.shadowOffsetX || 0}
                    onChange={e => updateLayer(selectedLayer.id, { shadowOffsetX: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Offset Y</label>
                  <input type="range" className="slider" min={-30} max={30} value={selectedLayer.shadowOffsetY || 0}
                    onChange={e => updateLayer(selectedLayer.id, { shadowOffsetY: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                </div>
              </div>
              <h4 className="section-divider">Glow</h4>
              <div className="editor-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Color</label>
                  <input type="color" className="input-color-large" value={selectedLayer.glowColor || '#ffffff'}
                    onChange={e => { updateLayer(selectedLayer.id, { glowColor: e.target.value }); commitUpdate(); }} />
                </div>
                <div className="input-group" style={{ flex: 2 }}>
                  <label className="input-label">Intensity — {selectedLayer.glowBlur || 0}</label>
                  <input type="range" className="slider" min={0} max={40} value={selectedLayer.glowBlur || 0}
                    onChange={e => updateLayer(selectedLayer.id, { glowBlur: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                </div>
              </div>
              <h4 className="section-divider">Border</h4>
              <div className="editor-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Color</label>
                  <input type="color" className="input-color-large" value={selectedLayer.borderColor || '#ffffff'}
                    onChange={e => { updateLayer(selectedLayer.id, { borderColor: e.target.value }); commitUpdate(); }} />
                </div>
                <div className="input-group" style={{ flex: 2 }}>
                  <label className="input-label">Width — {selectedLayer.borderWidth || 0}</label>
                  <input type="range" className="slider" min={0} max={20} value={selectedLayer.borderWidth || 0}
                    onChange={e => updateLayer(selectedLayer.id, { borderWidth: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
                </div>
              </div>
            </>
          )}
          <h4 className="section-divider">Transform</h4>
          <div className="input-group">
            <label className="input-label">Rotation — {Math.round(selectedLayer.rotation || 0)}°</label>
            <input type="range" className="slider" min={-180} max={180} value={selectedLayer.rotation || 0}
              onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })} onMouseUp={commitUpdate} onTouchEnd={commitUpdate} />
          </div>
          <div className="editor-row" style={{ marginTop: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { updateLayer(selectedLayer.id, { scaleX: -(selectedLayer.scaleX || 1) }); commitUpdate(); }}>
              ↔ Flip H
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { updateLayer(selectedLayer.id, { scaleY: -(selectedLayer.scaleY || 1) }); commitUpdate(); }}>
              ↕ Flip V
            </button>
          </div>
        </div>
      )}
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
    if (layer.type === 'stickerImage') return layer.name || 'Image Sticker';
    if (layer.type === 'shape') return layer.shapeType || 'Shape';
    if (layer.type === 'themeLayer') return layer.name || 'Theme Layer';
    return '?';
  };
  const getLayerIcon = (layer) => {
    if (layer.type === 'text') return 'Aa';
    if (layer.type === 'sticker') return layer.emoji;
    if (layer.type === 'stickerImage') return '🧷';
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
