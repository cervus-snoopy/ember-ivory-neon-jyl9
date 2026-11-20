/* Vice Cover Studio — editor. Owns the cover state (grade, size, words and
   one photo + crop per panel), wires every control in index.html, drags
   panels to reposition their photos, loads photos from the user's machine or
   the built-in samples, and exports the PNG through render.js. */

import { drawCoverToCanvas, exportCoverPng, loadCoverFont } from './render.js';
import {
  GRADES, GRADE_LABELS, SAMPLE_SCENES, SHOT_SIZES,
  applyShotPreset, gradeFromUrl, queryValue, selftestRequested,
  shotPresetFromUrl, sizeFromUrl,
} from './shots.js';

/** A fresh panel: no photo yet, gentle zoom, centred, with its caption. */
function freshPanel(caption) {
  return { image: null, src: '', zoom: 1, x: 0, y: 0, caption };
}

/** The editor state, in panel order. */
export function createState() {
  return {
    grade: 'sunset',
    size: '1080x1080',
    title: 'VICE COVER',
    subtitle: 'WELCOME TO THE SUNSET CITY \u00B7 A FOUR-PANEL POSTER',
    billing: 'A VICE COVER STUDIO ORIGINAL \u00B7 STARRING YOU \u00B7 MUSIC BY THE NEON PALMS \u00B7 SHOT ON THE SUNSET STRIP \u00B7 NO PALMS WERE HARMED',
    panels: [
      freshPanel('Ocean Drive'),
      freshPanel('Neon Nights'),
      freshPanel('Palm Highway'),
      freshPanel('Skyline Run'),
    ],
  };
}

/** Load an image from a URL or data URL. Resolves with the element, or null. */
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The short DOM helpers the editor uses everywhere. */
function el(id) { return document.getElementById(id); }
function all(selector) { return Array.from(document.querySelectorAll(selector)); }

/**
 * Paint one panel's preview art: its photo (or the gradient fallback), its
 * zoom and its drag offset, plus its caption.
 */
function paintPanel(state, index) {
  const panel = state.panels[index];
  const art = el(`panelArt-${index}`);
  const captionEl = el(`panelCaption-${index}`);
  if (!art || !captionEl) return;
  if (panel.src) {
    art.style.setProperty('--photo', `url("${panel.src}")`);
    art.classList.add('has-photo');
  } else {
    art.classList.remove('has-photo');
  }
  art.style.backgroundPosition = `${50 - panel.x}% ${50 - panel.y}%`;
  art.style.transform = `scale(${panel.zoom})`;
  captionEl.textContent = panel.caption;
  const cardName = document.querySelector(`#panelCard-${index} .panel-card-name`);
  if (cardName) cardName.textContent = panel.caption;
  const zoomOut = document.querySelector(`[data-panel-zoom-out="${index}"]`);
  if (zoomOut) zoomOut.textContent = `${Math.round(panel.zoom * 100)}%`;
  const xOut = document.querySelector(`[data-panel-x-out="${index}"]`);
  if (xOut) xOut.textContent = String(panel.x);
  const yOut = document.querySelector(`[data-panel-y-out="${index}"]`);
  if (yOut) yOut.textContent = String(panel.y);
}

/** Paint the whole preview from the state: grade, size, words, all panels. */
function paintAll(state) {
  document.body.dataset.grade = state.grade;
  document.body.dataset.size = state.size;
  el('coverTitle').textContent = state.title;
  el('coverSubtitle').textContent = state.subtitle;
  el('coverBilling').textContent = state.billing;
  for (let i = 0; i < 4; i++) paintPanel(state, i);
  all('.grade-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.grade === state.grade));
  all('.size-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.size === state.size));
}

/** Put a loaded photo into a panel and repaint it. */
async function setPanelPhoto(state, index, src) {
  const img = await loadImage(src);
  if (!img) return false;
  state.panels[index].image = img;
  state.panels[index].src = src;
  paintPanel(state, index);
  return true;
}

/** Load the four built-in sample scenes, one per panel. */
async function loadSamples(state) {
  let loaded = 0;
  for (let i = 0; i < SAMPLE_SCENES.length; i++) {
    const scene = SAMPLE_SCENES[i];
    state.panels[i].caption = scene.caption;
    const captionInput = document.querySelector(`[data-panel-caption="${i}"]`);
    if (captionInput) captionInput.value = scene.caption;
    if (await setPanelPhoto(state, i, scene.src)) loaded++;
  }
  return loaded;
}

/** Clear every panel back to its gradient fallback. */
function clearPhotos(state) {
  for (let i = 0; i < 4; i++) {
    state.panels[i].image = null;
    state.panels[i].src = '';
    paintPanel(state, i);
  }
  all('.sample-thumb').forEach((t) => t.classList.remove('is-picked'));
}

/** Mark one panel as the active one (outline + its card highlighted). */
function setActivePanel(index) {
  all('.panel').forEach((p) => p.classList.toggle('is-active', Number(p.dataset.panel) === index));
}

/** Drag-to-pan: pointer drags on a panel move that panel's photo. */
function bindPanelDrag(state) {
  all('.panel').forEach((panelEl) => {
    const index = Number(panelEl.dataset.panel);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    panelEl.addEventListener('pointerdown', (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      setActivePanel(index);
      panelEl.setPointerCapture(event.pointerId);
    });
    panelEl.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const rect = panelEl.getBoundingClientRect();
      const panel = state.panels[index];
      panel.x = Math.max(-50, Math.min(50, panel.x + ((event.clientX - lastX) / rect.width) * 120));
      panel.y = Math.max(-50, Math.min(50, panel.y + ((event.clientY - lastY) / rect.height) * 120));
      lastX = event.clientX;
      lastY = event.clientY;
      paintPanel(state, index);
      syncSliders(index, panel);
    });
    const stop = () => { dragging = false; };
    panelEl.addEventListener('pointerup', stop);
    panelEl.addEventListener('pointercancel', stop);
  });
}

/** Keep a panel card's sliders in step with a drag. */
function syncSliders(index, panel) {
  const zoom = document.querySelector(`[data-panel-zoom="${index}"]`);
  if (zoom) zoom.value = String(Math.round(panel.zoom * 100));
  const x = document.querySelector(`[data-panel-x="${index}"]`);
  if (x) x.value = String(Math.round(panel.x));
  const y = document.querySelector(`[data-panel-y="${index}"]`);
  if (y) y.value = String(Math.round(panel.y));
}

/** Wire every panel card: file input, zoom and position sliders, caption. */
function bindPanelCards(state) {
  for (let i = 0; i < 4; i++) {
    const fileInput = document.querySelector(`[data-panel-file="${i}"]`);
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          await setPanelPhoto(state, i, String(reader.result));
        };
        reader.readAsDataURL(file);
      });
    }
    const zoom = document.querySelector(`[data-panel-zoom="${i}"]`);
    if (zoom) {
      zoom.addEventListener('input', () => {
        state.panels[i].zoom = Number(zoom.value) / 100;
        paintPanel(state, i);
      });
    }
    const x = document.querySelector(`[data-panel-x="${i}"]`);
    if (x) {
      x.addEventListener('input', () => {
        state.panels[i].x = Number(x.value);
        paintPanel(state, i);
      });
    }
    const y = document.querySelector(`[data-panel-y="${i}"]`);
    if (y) {
      y.addEventListener('input', () => {
        state.panels[i].y = Number(y.value);
        paintPanel(state, i);
      });
    }
    const caption = document.querySelector(`[data-panel-caption="${i}"]`);
    if (caption) {
      caption.addEventListener('input', () => {
        state.panels[i].caption = caption.value;
        paintPanel(state, i);
      });
    }
    const card = el(`panelCard-${i}`);
    if (card) card.addEventListener('click', () => setActivePanel(i));
  }
}

/** Wire the grade buttons, size buttons and the words on the poster. */
function bindTopControls(state, onExport) {
  all('.grade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!GRADES.includes(btn.dataset.grade)) return;
      state.grade = btn.dataset.grade;
      paintAll(state);
    });
  });
  all('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!Object.hasOwn(SHOT_SIZES, btn.dataset.size)) return;
      state.size = btn.dataset.size;
      paintAll(state);
    });
  });
  const titleInput = el('titleInput');
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      state.title = titleInput.value.toUpperCase();
      el('coverTitle').textContent = state.title;
    });
  }
  const subtitleInput = el('subtitleInput');
  if (subtitleInput) {
    subtitleInput.addEventListener('input', () => {
      state.subtitle = subtitleInput.value;
      el('coverSubtitle').textContent = state.subtitle;
    });
  }
  const billingInput = el('billingInput');
  if (billingInput) {
    billingInput.addEventListener('input', () => {
      state.billing = billingInput.value;
      el('coverBilling').textContent = state.billing;
    });
  }
  const exportBtn = el('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', onExport);
  const exportBtn2 = el('exportBtn2');
  if (exportBtn2) exportBtn2.addEventListener('click', onExport);
}

/** Wire the sample strip: a thumb fills its matching panel. */
function bindSamples(state) {
  all('.sample-thumb').forEach((thumb, index) => {
    thumb.addEventListener('click', async () => {
      const scene = SAMPLE_SCENES[index];
      if (!scene) return;
      state.panels[index].caption = scene.caption;
      const captionInput = document.querySelector(`[data-panel-caption="${index}"]`);
      if (captionInput) captionInput.value = scene.caption;
      if (await setPanelPhoto(state, index, scene.src)) {
        all('.sample-thumb').forEach((t) => t.classList.remove('is-picked'));
        thumb.classList.add('is-picked');
      }
    });
  });
  const loadBtn = el('loadSamplesBtn');
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const n = await loadSamples(state);
      setStatus(`Loaded ${n} sample photos — drag a panel to reposition, then export.`);
    });
  }
  const clearBtn = el('clearPhotosBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearPhotos(state);
      setStatus('Photos cleared — gradient scenes are showing. Load your own photos to fill the panels.');
    });
  }
}

/** One-line status under the stage, for export results and hints. */
function setStatus(message) {
  const status = el('exportStatus');
  if (status) status.textContent = message;
}

/** Export the current cover at the chosen size and offer the PNG download. */
async function exportNow(state) {
  const canvas = el('exportCanvas');
  const size = SHOT_SIZES[state.size] || SHOT_SIZES['1080x1080'];
  setStatus(`Drawing your ${size.width} x ${size.height} cover…`);
  const blob = await exportCoverPng(canvas, state, state.size);
  if (!blob) {
    setStatus('Export failed — the canvas could not make a PNG. Try again.');
    return null;
  }
  const url = URL.createObjectURL(blob);
  const link = el('downloadLink');
  link.href = url;
  link.download = `vice-cover-${state.size}.png`;
  link.hidden = false;
  link.textContent = `Download your cover PNG (${size.width} x ${size.height}, ${(blob.size / 1024).toFixed(0)} KB)`;
  link.click();
  setStatus(`Exported ${size.width} x ${size.height} PNG (${(blob.size / 1024).toFixed(0)} KB) — ${GRADE_LABELS[state.grade]} grade.`);
  return blob;
}

/**
 * Built-in self test (?selftest=1): renders every export size off-screen and
 * reports the outcome into #selftest, so a headless run can prove the app
 * works with no console errors.
 */
async function runSelftest(state, errors) {
  const box = el('selftest');
  const canvas = el('exportCanvas');
  const results = [];
  await loadCoverFont();
  for (const sizeKey of Object.keys(SHOT_SIZES)) {
    const size = SHOT_SIZES[sizeKey];
    try {
      const ok = drawCoverToCanvas(canvas, state, size.width, size.height);
      results.push(`${sizeKey}:${ok ? 'draw-ok' : 'draw-fail'}:${canvas.width}x${canvas.height}`);
    } catch (err) {
      results.push(`${sizeKey}:error:${String(err && err.message ? err.message : err)}`);
    }
  }
  const blob = await exportCoverPng(canvas, state, '1080x1080');
  const text = `SELFTEST sizes=${results.join(',')} export=${blob ? `png-ok-${blob.size}b` : 'png-fail'} errors=${errors.length} grade=${state.grade} panels=${state.panels.filter((p) => p.image).length}/4-photos`;
  if (box) {
    box.hidden = false;
    box.textContent = text;
  }
  document.title = text;
  return text;
}

/** Start the editor: wire the controls, honour the URL, load the samples. */
export async function initEditor() {
  const errors = [];
  window.addEventListener('error', (event) => {
    errors.push(String(event.message || 'window error'));
  });
  const state = createState();

  const preset = shotPresetFromUrl();
  if (preset) applyShotPreset(preset);
  const size = sizeFromUrl();
  if (size) state.size = size;
  const grade = gradeFromUrl();
  if (grade) state.grade = grade;
  if (preset) {
    state.size = preset.size;
    state.grade = preset.grade;
  }

  bindPanelDrag(state);
  bindPanelCards(state);
  bindSamples(state);
  bindTopControls(state, () => exportNow(state));
  paintAll(state);

  // Photos on first paint, so the cover is alive before any click — unless
  // the URL opts out (?samples=0).
  let loaded = 0;
  if (queryValue('samples') !== '0') {
    loaded = await loadSamples(state);
    // A screenshot preset may art-direct each panel (which slice of its
    // photo shows in a tall panel) — apply its tweaks after the photos load.
    if (preset && preset.tweaks) {
      for (let i = 0; i < 4; i++) {
        const tweak = preset.tweaks[i];
        if (!tweak) continue;
        if (typeof tweak.x === 'number') state.panels[i].x = tweak.x;
        if (typeof tweak.y === 'number') state.panels[i].y = tweak.y;
        if (typeof tweak.zoom === 'number') state.panels[i].zoom = tweak.zoom;
        syncSliders(i, state.panels[i]);
      }
    }
    paintAll(state);
  }

  window.__viceCover = {
    state,
    exportNow: () => exportNow(state),
    loadSamples: () => loadSamples(state),
    errors,
  };

  if (selftestRequested()) {
    await runSelftest(state, errors);
  } else if (loaded > 0) {
    setStatus(`Sample photos loaded (${loaded}/4) — drag a panel, tweak a caption, then export.`);
  }
  return state;
}
