// Vice Cover Studio — canvas renderer.
// Draws a multi-panel GTA-style cover: slanted panels, Vice City sunset / neon /
// twilight-gold grades, sky glow, retro-chrome 3D title over the art, billing
// block, seal and callouts, plus optional grain and vignette ("Poster Ink").
// Written from scratch for the gta6-cover-art-01 entry. No Rockstar assets.

export const SIZES = {
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#2b1055', '#7b2d8b', '#e84a7a', '#ff7e3d', '#ffc46b'],
    glow: 'rgba(255, 150, 60, 0.55)',
    tint: 'rgba(255, 90, 60, 0.16)',
    accent: '#ff5e8a',
    chrome: ['#fff7d6', '#ffd166', '#ff5e8a', '#ff8a3d'],
  },
  neon: {
    name: 'Neon Night',
    sky: ['#05001f', '#12004d', '#3d0a6e', '#ff2e88', '#00e5ff'],
    glow: 'rgba(0, 229, 255, 0.45)',
    tint: 'rgba(0, 180, 255, 0.18)',
    accent: '#00e5ff',
    chrome: ['#eafcff', '#7df9ff', '#ff2e88', '#7a5cff'],
  },
  gold: {
    name: 'Twilight Gold',
    sky: ['#1c0f00', '#4d2c00', '#8a5a00', '#ffb347', '#ffe9a8'],
    glow: 'rgba(255, 190, 80, 0.5)',
    tint: 'rgba(255, 170, 40, 0.14)',
    accent: '#ffc46b',
    chrome: ['#fffbe8', '#ffe9a8', '#ffb347', '#c97b12'],
  },
};

// Panel polygons in normalised coordinates (0..1). Every shared edge slants the
// same way so the poster reads as one cut sheet, not a grid.
const LAYOUTS = {
  '1920x1080': [
    [[0, 0], [0.57, 0], [0.53, 1], [0, 1]],
    [[0.57, 0], [1, 0], [1, 0.5], [0.535, 0.5]],
    [[0.535, 0.5], [0.775, 0.5], [0.775, 1], [0.53, 1]],
    [[0.775, 0.5], [1, 0.5], [1, 1], [0.775, 1]],
  ],
  '1080x1350': [
    [[0, 0], [1, 0], [1, 0.58], [0, 0.62]],
    [[0, 0.62], [0.52, 0.58], [0.52, 0.82], [0, 0.82]],
    [[0.52, 0.58], [1, 0.58], [1, 0.82], [0.52, 0.82]],
    [[0, 0.82], [1, 0.82], [1, 1], [0, 1]],
  ],
  '1080x1080': [
    [[0, 0], [0.56, 0], [0.52, 1], [0, 1]],
    [[0.56, 0], [1, 0], [1, 0.5], [0.53, 0.5]],
    [[0.53, 0.5], [1, 0.5], [1, 0.76], [0.525, 0.76]],
    [[0.525, 0.76], [1, 0.76], [1, 1], [0.52, 1]],
  ],
};

// Where the title band sits (fraction of height) per size.
const TITLE_Y = { '1920x1080': 0.8, '1080x1350': 0.68, '1080x1080': 0.78 };

export function layoutFor(sizeKey) {
  return LAYOUTS[sizeKey] ?? LAYOUTS['1920x1080'];
}

/** Shrinks a polygon toward its centroid so a dark gutter shows between panels. */
function insetPolygon(points, inset) {
  const cx = points.reduce((a, p) => a + p[0], 0) / points.length;
  const cy = points.reduce((a, p) => a + p[1], 0) / points.length;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x - (dx / len) * inset, y - (dy / len) * inset];
  });
}

function pathPolygon(ctx, points, w, h) {
  ctx.beginPath();
  ctx.moveTo(points[0][0] * w, points[0][1] * h);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * w, points[i][1] * h);
  ctx.closePath();
}

/** Draws one photo into a slanted panel, cover-fit, with zoom and pan offsets. */
function drawPanelPhoto(ctx, img, polygon, w, h, zoom, ox, oy) {
  const xs = polygon.map((p) => p[0] * w);
  const ys = polygon.map((p) => p[1] * h);
  const bx = Math.min(...xs);
  const by = Math.min(...ys);
  const bw = Math.max(...xs) - bx;
  const bh = Math.max(...ys) - by;
  const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const px = bx + (bw - pw) / 2 + ox * bw;
  const py = by + (bh - ph) / 2 + oy * bh;
  ctx.save();
  pathPolygon(ctx, polygon, w, h);
  ctx.clip();
  ctx.drawImage(img, px, py, pw, ph);
  ctx.restore();
}

function drawSkyGlow(ctx, w, h, grade, sizeKey) {
  const glow = ctx.createRadialGradient(w * 0.62, h * 0.18, 0, w * 0.62, h * 0.18, w * 0.55);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  // Sun disc in open sky: top-left for the wide/tall layouts, top-centre for
  // the square (its hero panel is a tight face crop, so the disc stays clear).
  const sunPos = { '1920x1080': [0.3, 0.22], '1080x1350': [0.3, 0.22], '1080x1080': [0.58, 0.09] }[sizeKey] ?? [0.3, 0.22];
  const sun = ctx.createRadialGradient(w * sunPos[0], h * sunPos[1], 0, w * sunPos[0], h * sunPos[1], h * 0.22);
  sun.addColorStop(0, 'rgba(255, 240, 180, 0.85)');
  sun.addColorStop(0.35, 'rgba(255, 170, 80, 0.5)');
  sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
}

function drawGradeWash(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  const stops = grade.sky;
  stops.forEach((c, i) => wash.addColorStop(i / (stops.length - 1), c));
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
}

/** Bold retro-chrome title: dark 3D depth layers, gradient chrome fill, hard outline. */
function drawChromeTitle(ctx, text, cx, cy, size, grade, maxWidth) {
  const upper = text.toUpperCase();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, 0, -0.1, 1, 0, 0); // slight forward lean
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let s = size;
  ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(upper).width > maxWidth && s > 12) {
    s -= 2;
    ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`;
  }
  const step = s * 0.016;
  for (let i = 7; i >= 1; i--) {
    ctx.fillStyle = i % 2 ? '#160a24' : '#3d0f3f';
    ctx.fillText(upper, i * step * 0.7, i * step);
  }
  const chrome = ctx.createLinearGradient(0, -s * 0.55, 0, s * 0.55);
  const stops = grade.chrome;
  stops.forEach((c, i) => chrome.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = chrome;
  ctx.fillText(upper, 0, 0);
  ctx.lineWidth = Math.max(2, s * 0.022);
  ctx.strokeStyle = 'rgba(18, 4, 28, 0.9)';
  ctx.strokeText(upper, 0, 0);
  // Hot top edge highlight.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(upper, 0, -s * 0.045);
  ctx.restore();
  ctx.restore();
  return s;
}

function drawLetterSpaced(ctx, text, cx, y, size, color, spacing) {
  ctx.save();
  ctx.font = `700 ${size}px 'Arial Narrow', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, cx, y);
    ctx.letterSpacing = '0px';
  } else {
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let x = cx - total / 2;
    ctx.textAlign = 'left';
    chars.forEach((c, i) => {
      ctx.fillText(c, x, y);
      x += widths[i] + spacing;
    });
  }
  ctx.restore();
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 140;
  c.height = 140;
  const g = c.getContext('2d');
  const data = g.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

/** Draws a round seal/badge with a star and the given ring text. */
function drawSeal(ctx, cx, cy, r, text, accent) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 4, 20, 0.82)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.stroke();
  // Star.
  ctx.fillStyle = accent;
  ctx.beginPath();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r * 0.34 : r * 0.15;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Ring text along the bottom arc, shrunk to fit inside the circle.
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fs = Math.max(8, r * 0.15);
  ctx.font = `700 ${fs}px 'Arial Narrow', Arial, sans-serif`;
  while (ctx.measureText(text).width > r * 1.1 && fs > 6) {
    fs -= 0.5;
    ctx.font = `700 ${fs}px 'Arial Narrow', Arial, sans-serif`;
  }
  ctx.fillText(text, 0, r * 0.48);
  ctx.restore();
}

/** Small tag label pinned to a panel corner, with a leader line. */
function drawCallout(ctx, label, x, y, w, h, accent) {
  ctx.save();
  ctx.font = `700 ${Math.max(11, h * 0.016)}px 'Arial Narrow', Arial, sans-serif`;
  const pad = h * 0.012;
  const tw = ctx.measureText(label).width + pad * 2;
  const th = h * 0.032;
  ctx.fillStyle = 'rgba(8, 3, 16, 0.85)';
  ctx.fillRect(x, y, tw, th);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, Math.max(3, h * 0.005), th);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + pad + Math.max(3, h * 0.005), y + th / 2);
  ctx.restore();
}

/**
 * Renders the whole cover onto `canvas` (its own width/height are the output
 * size). `state` carries size, grade, texts, toggles and per-panel crops.
 * `images` maps a photo key to a loaded HTMLImageElement (or null).
 */
export function renderCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  // letterSpacing is sticky on the context across renders in some builds;
  // reset it here so only the subtitle bar ever gets tracked-out type.
  ctx.letterSpacing = '0px';
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const s = Math.min(w, h) / 1000; // scale unit for type sizes

  // Base: deep violet-black, then the sky wash behind everything.
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);
  drawGradeWash(ctx, w, h, grade);

  // Panels with gutters.
  const polys = layoutFor(state.sizeKey);
  const inset = 0.006;
  polys.forEach((poly, i) => {
    const panel = state.panels[i];
    const img = panel ? images[panel.src] : null;
    const clipped = insetPolygon(poly, inset);
    if (img) {
      drawPanelPhoto(ctx, img, clipped, w, h, panel.zoom, panel.ox, panel.oy);
      // Per-panel sunset wash so photos sit in the same grade.
      ctx.save();
      pathPolygon(ctx, clipped, w, h);
      ctx.clip();
      const wash = ctx.createLinearGradient(0, 0, 0, h);
      wash.addColorStop(0, 'rgba(255, 140, 60, 0.05)');
      wash.addColorStop(1, grade.tint);
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else {
      ctx.save();
      pathPolygon(ctx, clipped, w, h);
      ctx.clip();
      ctx.fillStyle = '#241533';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    // Panel edge highlight.
    ctx.save();
    pathPolygon(ctx, clipped, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = Math.max(1, s * 1.2);
    ctx.stroke();
    ctx.restore();
  });

  drawSkyGlow(ctx, w, h, grade, state.sizeKey);

  // Callouts on the smaller panels.
  const callouts = state.callouts ?? [];
  const spots = [
    [0.585, 0.06],
    [0.545, 0.53],
    [0.785, 0.53],
  ];
  if (state.sizeKey === '1080x1350') {
    spots[0] = [0.03, 0.63];
    spots[1] = [0.53, 0.59];
    spots[2] = [0.03, 0.83];
  }
  callouts.forEach((label, i) => {
    if (!label || !spots[i]) return;
    drawCallout(ctx, label.toUpperCase(), spots[i][0] * w, spots[i][1] * h, w, h, grade.accent);
  });

  // Seal, top right.
  if (state.sealText) {
    const r = Math.min(w, h) * 0.055;
    drawSeal(ctx, w - r * 1.35, r * 1.35, r, state.sealText.toUpperCase(), grade.accent);
  }

  // Title over the art, subtitle beneath it, billing block at the foot.
  const titleSize = h * 0.16;
  const ty = h * (TITLE_Y[state.sizeKey] ?? 0.8);
  drawChromeTitle(ctx, state.title || 'VICE CITY', w / 2, ty, titleSize, grade, w * 0.94);

  if (state.subtitle) {
    const barY = ty + h * 0.085;
    const barH = h * 0.038;
    ctx.fillStyle = 'rgba(8, 3, 16, 0.78)';
    ctx.fillRect(w * 0.18, barY - barH / 2, w * 0.64, barH);
    drawLetterSpaced(ctx, state.subtitle.toUpperCase(), w / 2, barY, h * 0.021, '#ffe9a8', h * 0.006);
  }

  if (state.billing) {
    ctx.save();
    ctx.font = `600 ${Math.max(9, h * 0.013)}px 'Arial Narrow', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const lines = wrapBilling(ctx, state.billing.toUpperCase(), w * 0.86);
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, h - h * 0.028 - (lines.length - 1 - i) * h * 0.016);
    });
    ctx.restore();
  }

  // Poster Ink: grain + vignette.
  if (state.grain) {
    const pattern = ctx.createPattern(grainTile(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vg.addColorStop(1, 'rgba(5, 0, 12, 0.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Wraps billing text to the given pixel width, returning at most two lines. */
function wrapBilling(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

/** Point-in-polygon test, used to pick a panel under the pointer. */
export function panelAt(sizeKey, nx, ny) {
  const polys = layoutFor(sizeKey);
  for (let i = 0; i < polys.length; i++) {
    const p = polys[i];
    let inside = false;
    for (let a = 0, b = p.length - 1; a < p.length; b = a++) {
      const [ax, ay] = p[a];
      const [bx, by] = p[b];
      if (ay > ny !== by > ny && nx < ((bx - ax) * (ny - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}
