/* Vice Cover Studio — canvas renderer. drawCoverToCanvas repaints the whole
   poster (sky, sun, skyline, four slanted panels, chrome title, subtitle bar,
   seal, callouts, billing, grain and vignette) onto a canvas at any export
   size, so Export PNG is a pixel-true copy of the preview. All art is
   original; the only font is Anton, loaded from the app's own files. */

import { SHOT_SIZES } from './shots.js';

/** Colour grade palettes, matching the CSS variables in style.css. */
export const GRADE_PALETTES = {
  sunset: {
    skyTop: '#2b1055', skyMid: '#7597de', skyLow: '#ff7e5f', horizon: '#feb47b',
    sunCore: '#fff3b0', sunRing: '#ff9a3d',
    chrome: ['#fff7d6', '#ffd23e', '#ff5e3a', '#7b2ff7'],
    accent: '#ff5e3a', accent2: '#ffd23e',
  },
  neon: {
    skyTop: '#050514', skyMid: '#1b0f4a', skyLow: '#c026d3', horizon: '#22d3ee',
    sunCore: '#fdf4ff', sunRing: '#e879f9',
    chrome: ['#fdf4ff', '#e879f9', '#22d3ee', '#7c3aed'],
    accent: '#e879f9', accent2: '#22d3ee',
  },
  gold: {
    skyTop: '#1d0f3a', skyMid: '#7c2d12', skyLow: '#f59e0b', horizon: '#fde68a',
    sunCore: '#fffbeb', sunRing: '#fbbf24',
    chrome: ['#fffbeb', '#fbbf24', '#b45309', '#7c2d12'],
    accent: '#f59e0b', accent2: '#fde68a',
  },
};

/** Fallback gradient art per panel, used when no photo is loaded. */
export const PANEL_FALLBACKS = [
  ['#ff9a5a', '#ff5e78', '#7b2ff7'],
  ['#12082e', '#7c3aed', '#22d3ee'],
  ['#fde68a', '#f59e0b', '#7c2d12'],
  ['#7597de', '#ff7e5f', '#2b1055'],
];

/** The three callout labels, as fractions of the cover size. */
export const CALLOUTS = [
  { text: '01  Golden-hour grade', x: 0.05, y: 0.22, stem: 'down' },
  { text: '02  Four-panel slant', x: 0.38, y: 0.70, stem: 'down' },
  { text: '03  Retro-chrome title', x: 0.72, y: 0.13, stem: 'up' },
];

/** A tiny deterministic random generator, so grain and skyline never flicker. */
export function seededRandom(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Load the Anton title font from the app's own files before drawing text. */
export async function loadCoverFont() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch (err) {
    // The title still draws in the fallback sans; the export must not fail.
  }
}

/** Fit one line of text to a width by shrinking the font, down to a floor. */
function fitFont(ctx, text, maxWidth, startPx, family, minPx) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > minPx && ctx.measureText(text).width > maxWidth) {
    px -= 1;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

/** Draw one panel's photo (or its fallback gradient) inside a slanted clip. */
function drawPanelArt(ctx, panel, x0, x1, y0, y1, index) {
  const w = x1 - x0;
  const h = y1 - y0;
  const shear = Math.tan((9 * Math.PI) / 180) * (h / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0 + shear, y0);
  ctx.lineTo(x1 + shear, y0);
  ctx.lineTo(x1 - shear, y1);
  ctx.lineTo(x0 - shear, y1);
  ctx.closePath();
  ctx.clip();

  const bx0 = x0 - shear;
  const bx1 = x1 + shear;
  const bw = bx1 - bx0;
  if (panel.image && panel.image.naturalWidth > 0) {
    const iw = panel.image.naturalWidth;
    const ih = panel.image.naturalHeight;
    const zoom = panel.zoom || 1;
    const scale = Math.max(bw / iw, h / ih) * zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = bx0 + (bw - dw) / 2 + (panel.x || 0) * 0.01 * bw * 0.5;
    const dy = y0 + (h - dh) / 2 + (panel.y || 0) * 0.01 * h * 0.5;
    ctx.drawImage(panel.image, dx, dy, dw, dh);
  } else {
    const stops = PANEL_FALLBACKS[index % PANEL_FALLBACKS.length];
    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(0.55, stops[1]);
    grad.addColorStop(1, stops[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(bx0, y0, bw, h);
    // A fallback sun disc, so an empty panel still reads as a scene.
    ctx.fillStyle = 'rgba(255, 243, 176, 0.9)';
    ctx.beginPath();
    ctx.arc(bx0 + bw * 0.62, y0 + h * 0.3, Math.min(bw, h) * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warm grade wash over the art, then a dark foot for the caption.
  const wash = ctx.createLinearGradient(0, y0, 0, y1);
  wash.addColorStop(0, 'rgba(255, 94, 58, 0)');
  wash.addColorStop(0.72, 'rgba(255, 94, 58, 0.16)');
  wash.addColorStop(1, 'rgba(10, 4, 24, 0.55)');
  ctx.fillStyle = wash;
  ctx.fillRect(bx0, y0, bw, h);
  ctx.restore();

  // Slant edge lines, like the CSS panel borders.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(x0 + shear, y0);
  ctx.lineTo(x0 - shear, y1);
  ctx.moveTo(x1 + shear, y0);
  ctx.lineTo(x1 - shear, y1);
  ctx.stroke();
  ctx.restore();
}

/** Draw a panel caption bar near the foot of its panel. */
function drawPanelCaption(ctx, panel, x0, x1, y0, y1, width) {
  const caption = (panel.caption || '').trim();
  if (!caption) return;
  const cx = (x0 + x1) / 2;
  const barH = Math.max(18, width * 0.028);
  const barW = (x1 - x0) * 0.86;
  const barY = y1 - barH - (y1 - y0) * 0.05;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 10, 30, 0.72)';
  ctx.fillRect(cx - barW / 2, barY, barW, barH);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(cx - barW / 2, barY, Math.max(3, barW * 0.02), barH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const px = fitFont(ctx, caption.toUpperCase(), barW * 0.88, barH * 0.52, 'Anton, "Arial Black", sans-serif', 8);
  ctx.fillText(caption.toUpperCase(), cx - barW / 2 + barW * 0.05, barY + barH / 2 + px * 0.04);
  ctx.restore();
}

/** Draw text around a circle, one character at a time. */
function drawCircularText(ctx, text, cx, cy, radius, startAngle, px, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.font = `${px}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    const a = startAngle + i * step;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/** Draw the circular seal stamp in the lower-right of the cover. */
function drawSeal(ctx, palette, width, height) {
  const r = width * 0.075;
  const cx = width * 0.885;
  const cy = height * 0.76;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-12 * Math.PI / 180);
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = 'rgba(20, 8, 32, 0.55)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  drawCircularText(ctx, 'VICE COVER STUDIO * SUNSET CITY * EST. 2026 * ', cx, cy, r * 0.78, -Math.PI / 2, Math.max(9, r * 0.16), '#fff3d6');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-12 * Math.PI / 180);
  ctx.fillStyle = '#ffd23e';
  ctx.font = `${Math.max(12, r * 0.28)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2605', 0, -r * 0.16);
  ctx.fillStyle = '#fff3d6';
  ctx.font = `${Math.max(10, r * 0.22)}px Anton, sans-serif`;
  ctx.fillText('2026', 0, r * 0.2);
  ctx.restore();
}

/** Draw the skyline silhouette along the bottom of the sky. */
function drawSkyline(ctx, width, height, palette) {
  const rand = seededRandom(20260704);
  const base = height * 0.88;
  const top = height * 0.74;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 8, 40, 0.85)';
  let x = 0;
  while (x < width) {
    const bw = width * (0.02 + rand() * 0.035);
    const bh = top + rand() * (base - top) * 0.9;
    ctx.fillRect(x, bh, bw, base - bh + 2);
    x += bw + width * 0.004;
  }
  ctx.fillRect(0, base, width, height - base);
  ctx.restore();
}

/**
 * Repaint the whole poster onto `canvas` at `width` x `height`, from the
 * editor state. The canvas is resized first, which also clears it.
 */
export function drawCoverToCanvas(canvas, state, width, height) {
  const palette = GRADE_PALETTES[state.grade] || GRADE_PALETTES.sunset;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.42, palette.skyMid);
  sky.addColorStop(0.68, palette.skyLow);
  sky.addColorStop(1, palette.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Sun disc and glow.
  const sunR = width * 0.13;
  const sunX = width * 0.5;
  const sunY = height * 0.2;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  glow.addColorStop(0, 'rgba(255, 170, 80, 0.45)');
  glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  const sun = ctx.createRadialGradient(sunX, sunY - sunR * 0.08, sunR * 0.1, sunX, sunY, sunR);
  sun.addColorStop(0, palette.sunCore);
  sun.addColorStop(0.72, palette.sunRing);
  sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  drawSkyline(ctx, width, height, palette);

  // Four slanted panels.
  const py0 = height * 0.16;
  const py1 = height * 0.88;
  const px0 = width * 0.025;
  const px1 = width * 0.975;
  const panelW = (px1 - px0) / 4;
  for (let i = 0; i < 4; i++) {
    const panel = state.panels[i] || { image: null, zoom: 1, x: 0, y: 0, caption: '' };
    const x0 = px0 + panelW * i;
    const x1 = x0 + panelW;
    drawPanelArt(ctx, panel, x0, x1, py0, py1, i);
  }
  for (let i = 0; i < 4; i++) {
    const panel = state.panels[i] || { image: null, zoom: 1, x: 0, y: 0, caption: '' };
    const x0 = px0 + panelW * i;
    const x1 = x0 + panelW;
    drawPanelCaption(ctx, panel, x0, x1, py0, py1, width);
  }

  // Retro-chrome title.
  const title = (state.title || 'VICE COVER').toUpperCase();
  const titlePx = Math.min(width * 0.115, height * 0.115);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const titleSize = fitFont(ctx, title, width * 0.94, titlePx, 'Anton, "Arial Black", sans-serif', 24);
  const chrome = ctx.createLinearGradient(0, height * 0.025, 0, height * 0.025 + titleSize);
  chrome.addColorStop(0, palette.chrome[0]);
  chrome.addColorStop(0.34, palette.chrome[1]);
  chrome.addColorStop(0.55, palette.chrome[2]);
  chrome.addColorStop(0.78, palette.chrome[3]);
  chrome.addColorStop(1, palette.chrome[0]);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.max(6, width * 0.008);
  ctx.shadowOffsetY = Math.max(3, height * 0.006);
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeStyle = 'rgba(40, 8, 50, 0.85)';
  ctx.strokeText(title, width / 2, height * 0.025);
  ctx.fillStyle = chrome;
  ctx.fillText(title, width / 2, height * 0.025);
  ctx.restore();

  // Subtitle bar.
  const subtitle = (state.subtitle || '').toUpperCase();
  if (subtitle) {
    ctx.save();
    const subPx = Math.max(10, Math.min(width * 0.016, height * 0.02));
    ctx.font = `700 ${subPx}px "Trebuchet MS", sans-serif`;
    const subW = Math.min(ctx.measureText(subtitle).width + subPx * 2.4, width * 0.92);
    const subH = subPx * 2.1;
    const subX = (width - subW) / 2;
    const subY = height * 0.025 + titleSize * 0.98;
    ctx.fillStyle = palette.accent2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowOffsetY = 3;
    ctx.fillRect(subX, subY, subW, subH);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1a0b00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, subtitle, subW * 0.94, subPx, '"Trebuchet MS", sans-serif', 8);
    ctx.fillText(subtitle, width / 2, subY + subH / 2 + subPx * 0.05);
    ctx.restore();
  }

  drawSeal(ctx, palette, width, height);

  // Callout pills with leader stems.
  ctx.save();
  ctx.textBaseline = 'middle';
  for (const callout of CALLOUTS) {
    const px = Math.max(9, Math.min(width * 0.0135, height * 0.016));
    ctx.font = `700 ${px}px "Trebuchet MS", sans-serif`;
    const tw = ctx.measureText(callout.text).width;
    const padX = px * 1.1;
    const pillW = tw + padX * 2;
    const pillH = px * 2.1;
    const cx = callout.x * width;
    const cy = callout.y * height;
    const stemLen = height * 0.022;
    ctx.strokeStyle = palette.accent2;
    ctx.lineWidth = Math.max(1, width * 0.001);
    ctx.beginPath();
    if (callout.stem === 'down') {
      ctx.moveTo(cx, cy + pillH / 2);
      ctx.lineTo(cx, cy + pillH / 2 + stemLen);
    } else {
      ctx.moveTo(cx, cy - pillH / 2);
      ctx.lineTo(cx, cy - pillH / 2 - stemLen);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(20, 10, 32, 0.78)';
    ctx.strokeStyle = palette.accent2;
    roundRect(ctx, cx - pillW / 2, cy - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(callout.text, cx, cy + px * 0.06);
  }
  ctx.restore();

  // Billing block.
  const billing = (state.billing || '').toUpperCase();
  if (billing) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 244, 220, 0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    const billPx = fitFont(ctx, billing, width * 0.92, Math.max(9, Math.min(width * 0.013, height * 0.016)), '"Trebuchet MS", sans-serif', 7);
    ctx.fillText(billing, width / 2, height * 0.978);
    ctx.restore();
  }

  // Poster ink: grain, then vignette.
  const rand = seededRandom(99);
  ctx.save();
  ctx.globalAlpha = 0.05;
  const dotCount = Math.floor((width * height) / 2600);
  for (let i = 0; i < dotCount; i++) {
    const g = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${g}, ${g}, ${g})`;
    ctx.fillRect(rand() * width, rand() * height, 1.4, 1.4);
  }
  ctx.restore();
  const vig = ctx.createRadialGradient(width / 2, height * 0.46, Math.min(width, height) * 0.42, width / 2, height * 0.46, Math.max(width, height) * 0.75);
  vig.addColorStop(0, 'rgba(8, 2, 18, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 18, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  return true;
}

/** Rounded-rectangle path helper (avoids relying on ctx.roundRect). */
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Export the cover at a named size. Returns the PNG blob, or null when the
 * canvas cannot produce one.
 */
export async function exportCoverPng(canvas, state, sizeKey) {
  const size = SHOT_SIZES[sizeKey] || SHOT_SIZES['1080x1080'];
  await loadCoverFont();
  const ok = drawCoverToCanvas(canvas, state, size.width, size.height);
  if (!ok) return null;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
