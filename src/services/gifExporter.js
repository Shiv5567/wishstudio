/**
 * GIF Export Engine — Frame-by-frame animated GIF generator
 * Uses an offscreen canvas to composite background + Konva layers + animated particles
 * Produces a real animated GIF file for download.
 */

// Particle simulation for GIF frames
class ParticleSystem {
  constructor(effectType, width, height, colors, count) {
    this.effectType = effectType;
    this.width = width;
    this.height = height;
    this.colors = colors;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomPhase = false) {
    const p = {
      x: Math.random() * this.width,
      y: 0,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      size: 3 + Math.random() * 8,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      opacity: 0.5 + Math.random() * 0.5,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      phase: randomPhase ? Math.random() * Math.PI * 2 : 0,
      life: 0,
      maxLife: 60 + Math.random() * 120,
    };

    switch (this.effectType) {
      case 'confetti':
        p.y = randomPhase ? Math.random() * this.height : -10;
        p.vy = 1.5 + Math.random() * 2;
        p.vx = (Math.random() - 0.5) * 3;
        p.size = 4 + Math.random() * 6;
        p.shape = 'rect';
        break;
      case 'hearts':
        p.y = randomPhase ? Math.random() * this.height : this.height + 10;
        p.vy = -(1 + Math.random() * 1.5);
        p.vx = (Math.random() - 0.5) * 1;
        p.char = '❤';
        p.size = 8 + Math.random() * 14;
        p.shape = 'char';
        break;
      case 'sparkle':
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vy = 0;
        p.vx = 0;
        p.shape = 'star';
        p.size = 3 + Math.random() * 6;
        p.maxLife = 30 + Math.random() * 60;
        break;
      case 'snow':
        p.y = randomPhase ? Math.random() * this.height : -10;
        p.vy = 0.5 + Math.random() * 1;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.shape = 'circle';
        p.size = 2 + Math.random() * 5;
        break;
      case 'firefly':
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vy = (Math.random() - 0.5) * 0.5;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.shape = 'glow';
        p.size = 3 + Math.random() * 5;
        p.maxLife = 80 + Math.random() * 80;
        break;
      case 'bubbles':
        p.y = randomPhase ? Math.random() * this.height : this.height + 10;
        p.vy = -(0.5 + Math.random() * 1);
        p.vx = (Math.random() - 0.5) * 0.5;
        p.shape = 'ring';
        p.size = 6 + Math.random() * 16;
        break;
      case 'rain':
        p.y = randomPhase ? Math.random() * this.height : -10;
        p.vy = 4 + Math.random() * 3;
        p.vx = 0.5;
        p.shape = 'line';
        p.size = 10 + Math.random() * 12;
        break;
      case 'petals':
        p.y = randomPhase ? Math.random() * this.height : -15;
        p.vy = 0.8 + Math.random() * 1;
        p.vx = (Math.random() - 0.5) * 1.5;
        p.char = '✿';
        p.size = 8 + Math.random() * 10;
        p.shape = 'char';
        break;
      case 'embers':
        p.y = randomPhase ? Math.random() * this.height : this.height + 10;
        p.vy = -(1 + Math.random() * 1.5);
        p.vx = (Math.random() - 0.5) * 1;
        p.shape = 'glow';
        p.size = 2 + Math.random() * 5;
        break;
      case 'stars':
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vy = 0;
        p.vx = 0;
        p.shape = 'star';
        p.size = 2 + Math.random() * 5;
        p.maxLife = 40 + Math.random() * 80;
        break;
      default:
        p.y = -10;
        p.vy = 1 + Math.random() * 2;
        p.shape = 'circle';
    }
    return p;
  }

  step() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life++;
      p.vx += (Math.random() - 0.5) * 0.1; // slight drift

      // Sparkle/star/firefly: pulse opacity
      if (p.shape === 'star' || p.shape === 'glow') {
        p.opacity = 0.3 + 0.7 * Math.abs(Math.sin((p.life + p.phase * 30) * 0.08));
      }

      // Recycle if out of bounds or expired
      const shouldRecycle =
        p.y > this.height + 20 || p.y < -20 ||
        p.x > this.width + 20 || p.x < -20 ||
        p.life > p.maxLife;

      if (shouldRecycle) {
        this.particles[i] = this.createParticle(false);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      switch (p.shape) {
        case 'rect':
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star':
          drawStar(ctx, 0, 0, 4, p.size, p.size / 2);
          ctx.fill();
          break;
        case 'glow':
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'ring':
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'line':
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, p.size);
          ctx.stroke();
          break;
        case 'char':
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.char || '●', 0, 0);
          break;
      }
      ctx.restore();
    }
  }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

/**
 * Parse a CSS gradient string into a canvas gradient
 */
function applyGradientToCtx(ctx, gradientStr, w, h) {
  if (!gradientStr || !gradientStr.includes('gradient')) {
    ctx.fillStyle = gradientStr || '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    return;
  }
  // Parse linear-gradient(angle, color1 stop1, color2 stop2, ...)
  const match = gradientStr.match(/linear-gradient\(([^,]+),\s*(.+)\)/);
  if (!match) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const angleStr = match[1].trim();
  const stopsStr = match[2];

  let angleDeg = 135;
  if (angleStr.endsWith('deg')) angleDeg = parseFloat(angleStr);

  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = w / 2, cy = h / 2;
  const diag = Math.sqrt(w * w + h * h) / 2;
  const x0 = cx - Math.cos(angleRad) * diag;
  const y0 = cy - Math.sin(angleRad) * diag;
  const x1 = cx + Math.cos(angleRad) * diag;
  const y1 = cy + Math.sin(angleRad) * diag;

  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  // Parse color stops
  const stopRegex = /((?:rgba?\([^)]+\))|(?:#[0-9a-fA-F]{3,8})|(?:\w+))\s*(\d+%)?/g;
  let m;
  const stops = [];
  while ((m = stopRegex.exec(stopsStr)) !== null) {
    const color = m[1];
    const pos = m[2] ? parseFloat(m[2]) / 100 : null;
    stops.push({ color, pos });
  }
  stops.forEach((s, i) => {
    const pos = s.pos !== null ? s.pos : i / Math.max(1, stops.length - 1);
    try { grad.addColorStop(pos, s.color); } catch (e) {}
  });
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Export animated GIF
 * @param {Object} options
 * @param {HTMLCanvasElement|Object} options.stageRef - Konva stage ref
 * @param {Object} options.background
 * @param {Object} options.overlay
 * @param {Object} options.bgFilter
 * @param {Object} options.activeEffect
 * @param {number} options.width
 * @param {number} options.height
 * @param {Function} options.onProgress - (progress: 0-1) => void
 * @returns {Promise<Blob>}
 */
export async function exportAnimatedGIF({
  stageRef,
  background,
  overlay,
  bgFilter,
  activeEffect,
  width,
  height,
  onProgress,
  frameCount = 40,
  fps = 12,
  quality = 10,
}) {
  const GifModule = await import('gif.js');
  const GIF = GifModule.default || GifModule;

  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality,
      width,
      height,
      workerScript: undefined, // use default
    });

    // Create offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');

    // Get static Konva layer image (we'll composite it on each frame)
    const konvaCanvas = stageRef.current?.toCanvas({ pixelRatio: 1 });

    // Particle system
    let particleSys = null;
    if (activeEffect) {
      const effectColors = ['#FF6B6B', '#FFD93D', '#51CF66', '#339AF0', '#CC5DE8', '#FF922B', '#FFFFFF'];
      // Try to find effect preset for colors
      const effectMap = {
        confetti: ['#FF6B6B', '#FFD93D', '#51CF66', '#339AF0', '#CC5DE8', '#FF922B'],
        hearts: ['#FF6B6B', '#EC4899', '#F43F5E', '#FB7185'],
        sparkle: ['#FFD93D', '#FBBF24', '#FFFFFF', '#FEF3C7'],
        snow: ['#FFFFFF', '#E0F2FE', '#BAE6FD'],
        firefly: ['#FFD93D', '#FDE68A', '#FEF3C7'],
        bubbles: ['rgba(99,179,237,0.6)', 'rgba(147,197,253,0.5)'],
        rain: ['rgba(147,197,253,0.8)', 'rgba(191,219,254,0.6)'],
        petals: ['#FBCFE8', '#F9A8D4', '#F472B6'],
        embers: ['#FF6B35', '#F59E0B', '#DC2626', '#FFD93D'],
        stars: ['#FFFFFF', '#FDE68A', '#DBEAFE'],
      };
      const colors = effectMap[activeEffect.type] || effectColors;
      const count = { confetti: 35, hearts: 18, sparkle: 25, snow: 30, firefly: 12, bubbles: 14, rain: 40, petals: 16, embers: 20, stars: 30 };
      particleSys = new ParticleSystem(activeEffect.type, width, height, colors, count[activeEffect.type] || 25);
      // Warm up particles
      for (let i = 0; i < 30; i++) particleSys.step();
    }

    // Build CSS filter string for background
    const buildFilter = (f) => {
      if (!f) return 'none';
      const parts = [];
      if (f.blur) parts.push(`blur(${f.blur}px)`);
      if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
      if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
      if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
      if (f.hueRotate) parts.push(`hue-rotate(${f.hueRotate}deg)`);
      if (f.sepia) parts.push(`sepia(${f.sepia}%)`);
      if (f.grayscale) parts.push(`grayscale(${f.grayscale}%)`);
      return parts.length ? parts.join(' ') : 'none';
    };

    // Pre-render background with filter onto a temp canvas
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext('2d');
    const filterStr = buildFilter(bgFilter);

    // Draw background
    if (background.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        bgCtx.filter = filterStr;
        bgCtx.drawImage(img, 0, 0, width, height);
        bgCtx.filter = 'none';
        generateFrames();
      };
      img.onerror = () => {
        bgCtx.fillStyle = '#FFFFFF';
        bgCtx.fillRect(0, 0, width, height);
        generateFrames();
      };
      img.src = background.value;
    } else {
      bgCtx.filter = filterStr;
      applyGradientToCtx(bgCtx, background.value, width, height);
      bgCtx.filter = 'none';
      generateFrames();
    }

    function generateFrames() {
      for (let frame = 0; frame < frameCount; frame++) {
        // 1. Clear
        ctx.clearRect(0, 0, width, height);

        // 2. Background
        ctx.drawImage(bgCanvas, 0, 0);

        // 3. Color overlay
        if (overlay && overlay.type !== 'none' && overlay.color) {
          ctx.globalAlpha = overlay.opacity || 0.3;
          ctx.fillStyle = overlay.color;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1;
        }

        // 4. Konva layers (text, shapes, stickers)
        if (konvaCanvas) {
          ctx.drawImage(konvaCanvas, 0, 0, width, height);
        }

        // 5. Particles
        if (particleSys) {
          particleSys.step();
          particleSys.draw(ctx);
        }

        // Add frame to GIF
        // We must clone the ImageData because gif.js reuses the canvas
        const imageData = ctx.getImageData(0, 0, width, height);
        gif.addFrame(imageData, { delay: Math.round(1000 / fps), copy: true });

        if (onProgress) onProgress(frame / frameCount * 0.7); // 0-70% for frame generation
      }

      gif.on('progress', (p) => {
        if (onProgress) onProgress(0.7 + p * 0.3); // 70-100% for encoding
      });

      gif.on('finished', (blob) => {
        resolve(blob);
      });

      gif.on('error', (err) => {
        reject(err);
      });

      gif.render();
    }
  });
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
