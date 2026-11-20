// Vice Cover Studio — editor state, panel cropping and PNG export.
// Own code for the gta6-cover-art-01 entry. Photos come from the user's own
// files or the built-in samples; nothing is ever uploaded.
import { renderCover, panelAt, SIZES } from './render.js';

export const SAMPLES = ['pier', 'boulevard'];

export function defaultState() {
  return {
    sizeKey: '1920x1080',
    grade: 'sunset',
    title: 'VICE CITY',
    subtitle: 'One last score',
    billing: 'Palmlines Pictures presents  •  A story of sun, sand and stolen gold',
    sealText: 'Vice • Est. 2026',
    grain: true,
    vignette: true,
    callouts: ['Palm Boulevard', 'The Pier', 'Neon Nights'],
    selected: 0,
    panels: [
      { src: 'pier', zoom: 1.18, ox: 0, oy: 0 },
      { src: 'boulevard', zoom: 1.12, ox: 0, oy: 0 },
      { src: 'pier', zoom: 1.35, ox: 0.04, oy: -0.04 },
      { src: 'boulevard', zoom: 1.25, ox: 0, oy: 0.03 },
    ],
  };
}

/** Loads an image from a URL; resolves once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/**
 * Creates the editor: wires the controls in `els` to the preview `canvas`.
 * Returns the live state plus render / export helpers the page and the
 * screenshot scenes use.
 */
export function createEditor(canvas, els) {
  const state = defaultState();
  const images = { pier: null, boulevard: null };
  const customImages = new Map(); // key -> loaded image for user uploads
  let customCount = 0;
  let drag = null;

  function imageFor(key) {
    return images[key] ?? customImages.get(key) ?? null;
  }

  function allImages() {
    const out = {};
    for (const key of Object.keys(images)) out[key] = images[key];
    for (const [key, img] of customImages) out[key] = img;
    return out;
  }

  function render() {
    renderCover(canvas, state, allImages());
  }

  function fitCanvas() {
    const size = SIZES[state.sizeKey];
    canvas.width = size.w;
    canvas.height = size.h;
    render();
  }

  /** Renders the cover at full export size and returns a PNG data URL. */
  async function exportDataURL(w, h) {
    await document.fonts.ready;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    renderCover(off, state, allImages());
    return off.toDataURL('image/png');
  }

  async function exportPNG(sizeKey) {
    const size = SIZES[sizeKey];
    const url = await exportDataURL(size.w, size.h);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    els.status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
  }

  async function loadSamples() {
    const [pier, boulevard] = await Promise.all([
      loadImage('samples/pier.jpg'),
      loadImage('samples/boulevard.jpg'),
    ]);
    images.pier = pier;
    images.boulevard = boulevard;
    render();
  }

  // ---- panel picking + drag-to-crop on the preview canvas ----
  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      nx: (e.clientX - rect.left) / rect.width,
      ny: (e.clientY - rect.top) / rect.height,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const { nx, ny } = canvasPoint(e);
    const hit = panelAt(state.sizeKey, nx, ny);
    if (hit >= 0) {
      state.selected = hit;
      syncPanelControls();
      drag = { nx, ny, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
      canvas.setPointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { nx, ny } = canvasPoint(e);
    const panel = state.panels[state.selected];
    panel.ox = drag.ox + (nx - drag.nx);
    panel.oy = drag.oy + (ny - drag.ny);
    render();
  });

  canvas.addEventListener('pointerup', () => {
    drag = null;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    els.zoom.value = panel.zoom.toFixed(2);
    render();
  }, { passive: false });

  // ---- controls ----
  function syncPanelControls() {
    const panel = state.panels[state.selected];
    els.panelLabel.textContent = `Panel ${state.selected + 1} of 4`;
    els.zoom.value = panel.zoom.toFixed(2);
    els.zoomOut.textContent = `${panel.zoom.toFixed(2)}x`;
    [...els.panelButtons.children].forEach((b, i) => b.classList.toggle('active', i === state.selected));
  }

  els.panelButtons.querySelectorAll('button').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      state.selected = i;
      syncPanelControls();
      render();
    });
  });

  els.photoSelect.addEventListener('change', () => {
    const panel = state.panels[state.selected];
    if (els.photoSelect.value === '__upload__') {
      els.uploadInput.click();
      return;
    }
    panel.src = els.photoSelect.value;
    render();
  });

  els.uploadInput.addEventListener('change', async () => {
    const file = els.uploadInput.files[0];
    if (!file) return;
    const key = `custom-${++customCount}`;
    const img = await loadImage(URL.createObjectURL(file));
    customImages.set(key, img);
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `Your photo: ${file.name}`;
    els.photoSelect.appendChild(opt);
    els.photoSelect.value = key;
    state.panels[state.selected].src = key;
    render();
  });

  els.zoom.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(els.zoom.value);
    els.zoomOut.textContent = `${Number(els.zoom.value).toFixed(2)}x`;
    render();
  });

  els.resetCrop.addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1.15;
    panel.ox = 0;
    panel.oy = 0;
    syncPanelControls();
    render();
  });

  els.title.addEventListener('input', () => { state.title = els.title.value; render(); });
  els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; render(); });
  els.billing.addEventListener('input', () => { state.billing = els.billing.value; render(); });
  els.sealText.addEventListener('input', () => { state.sealText = els.sealText.value; render(); });
  els.callout0.addEventListener('input', () => { state.callouts[0] = els.callout0.value; render(); });
  els.callout1.addEventListener('input', () => { state.callouts[1] = els.callout1.value; render(); });
  els.callout2.addEventListener('input', () => { state.callouts[2] = els.callout2.value; render(); });

  els.grain.addEventListener('change', () => { state.grain = els.grain.checked; render(); });
  els.vignette.addEventListener('change', () => { state.vignette = els.vignette.checked; render(); });

  els.gradeButtons.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      [...els.gradeButtons.children].forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });

  els.sizeButtons.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sizeKey = btn.dataset.size;
      [...els.sizeButtons.children].forEach((b) => b.classList.toggle('active', b === btn));
      canvas.classList.toggle('portrait', state.sizeKey === '1080x1350');
      canvas.classList.toggle('square', state.sizeKey === '1080x1080');
      fitCanvas();
    });
  });

  els.exportButtons.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => exportPNG(btn.dataset.size));
  });

  els.samplePier.addEventListener('click', () => {
    state.panels[state.selected].src = 'pier';
    els.photoSelect.value = 'pier';
    render();
  });
  els.sampleBoulevard.addEventListener('click', () => {
    state.panels[state.selected].src = 'boulevard';
    els.photoSelect.value = 'boulevard';
    render();
  });

  return {
    state,
    render,
    fitCanvas,
    loadSamples,
    exportPNG,
    exportDataURL,
    syncPanelControls,
  };
}
