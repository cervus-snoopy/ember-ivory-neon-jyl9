// Vice Cover Studio — entry point. Loads the display font and the built-in
// samples, wires the editor, and hands ?shot= scenes to shots.js.
// Every asset is a file under app/; the app makes no network request.
import { createEditor } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');

const editor = createEditor(canvas, {
  status: document.getElementById('status'),
  panelLabel: document.getElementById('panel-label'),
  panelButtons: document.getElementById('panel-buttons'),
  photoSelect: document.getElementById('photo-select'),
  uploadInput: document.getElementById('upload-input'),
  zoom: document.getElementById('zoom'),
  zoomOut: document.getElementById('zoom-out'),
  resetCrop: document.getElementById('reset-crop'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  billing: document.getElementById('billing'),
  sealText: document.getElementById('seal-text'),
  callout0: document.getElementById('callout-0'),
  callout1: document.getElementById('callout-1'),
  callout2: document.getElementById('callout-2'),
  grain: document.getElementById('grain'),
  vignette: document.getElementById('vignette'),
  gradeButtons: document.getElementById('grade-buttons'),
  sizeButtons: document.getElementById('size-buttons'),
  exportButtons: document.getElementById('export-buttons'),
  samplePier: document.getElementById('sample-pier'),
  sampleBoulevard: document.getElementById('sample-boulevard'),
});

const query = new URLSearchParams(location.search);

async function start() {
  try {
    await document.fonts.load('100px Anton');
  } catch {
    // Anton falls back to the condensed system stack; the cover still draws.
  }
  if (query.get('shot')) {
    await runShot(query, editor);
  } else {
    await editor.loadSamples();
    editor.fitCanvas();
    editor.syncPanelControls();
  }
}

// The screenshot script calls this to get the app's own exported PNG.
window.__exportPNG = (w, h) => editor.exportDataURL(w, h);
window.__editorReady = start();
