/* Vice Cover Studio — shot presets: export sizes, colour grades and the
   named screenshot states the app can open in (?shot=cover, ?shot=editor,
   ?shot=portrait, ?shot=square). Everything here is plain data plus the
   small helpers that apply a preset to the page. No network, no imports. */

/** The three post sizes the app exports, in pixels. */
export const SHOT_SIZES = {
  '1080x1080': { width: 1080, height: 1080, label: 'Square post' },
  '1080x1350': { width: 1080, height: 1350, label: 'Portrait post' },
  '1920x1080': { width: 1920, height: 1080, label: 'Landscape post' },
};

/** The colour grades, in the order the top bar shows them. */
export const GRADES = ['sunset', 'neon', 'gold'];

/** Human names for the grades, for buttons and the status line. */
export const GRADE_LABELS = {
  sunset: 'Sunset',
  neon: 'Neon Night',
  gold: 'Twilight Gold',
};

/** The four built-in sample scenes, one per panel, in panel order. */
export const SAMPLE_SCENES = [
  { src: 'samples/scene-beach.jpg', caption: 'Ocean Drive' },
  { src: 'samples/scene-neon.jpg', caption: 'Neon Nights' },
  { src: 'samples/scene-highway.jpg', caption: 'Palm Highway' },
  { src: 'samples/scene-skyline.jpg', caption: 'Skyline Run' },
];

/**
 * Named screenshot states. A state names the export size the cover shows,
 * the grade, and whether the page hides the editor chrome so the cover
 * fills the whole shot. `tweaks` art-directs each panel for the shot's
 * aspect: which slice of its photo shows, and at what zoom (x is the
 * position slider's value: positive shows the photo's left side).
 */
export const SHOT_PRESETS = {
  cover: { size: '1920x1080', grade: 'sunset', chrome: false, samples: true, tweaks: [{ x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }] },
  editor: { size: '1080x1080', grade: 'sunset', chrome: true, samples: true, tweaks: [{ x: 35, y: 0, zoom: 1 }, { x: 10, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: -15, y: 0, zoom: 1 }] },
  portrait: { size: '1080x1350', grade: 'gold', chrome: false, samples: true, tweaks: [{ x: 35, y: 0, zoom: 1 }, { x: 10, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: -15, y: 0, zoom: 1 }] },
  square: { size: '1080x1080', grade: 'neon', chrome: false, samples: true, tweaks: [{ x: 35, y: 0, zoom: 1 }, { x: 10, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: -15, y: 0, zoom: 1 }] },
};

/** Read one query value from the page URL, or null when it is absent. */
export function queryValue(name) {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(name);
  return value === null || value === '' ? null : value;
}

/** The shot preset named by ?shot=, or null when the URL names none. */
export function shotPresetFromUrl() {
  const name = queryValue('shot');
  if (name === null) return null;
  return Object.hasOwn(SHOT_PRESETS, name) ? SHOT_PRESETS[name] : null;
}

/**
 * Apply a shot preset to the page: set the grade and size attributes, and
 * hide the editor chrome when the preset is a cover-only shot.
 */
export function applyShotPreset(preset) {
  if (!preset) return;
  if (GRADES.includes(preset.grade)) document.body.dataset.grade = preset.grade;
  if (Object.hasOwn(SHOT_SIZES, preset.size)) document.body.dataset.size = preset.size;
  document.body.classList.toggle('shot-cover', preset.chrome === false);
}

/** The export size named by ?size=, or null when the URL names none. */
export function sizeFromUrl() {
  const size = queryValue('size');
  return size !== null && Object.hasOwn(SHOT_SIZES, size) ? size : null;
}

/** The grade named by ?grade=, or null when the URL names none. */
export function gradeFromUrl() {
  const grade = queryValue('grade');
  return grade !== null && GRADES.includes(grade) ? grade : null;
}

/** True when the URL asks for the built-in self test (?selftest=1). */
export function selftestRequested() {
  return queryValue('selftest') === '1';
}
