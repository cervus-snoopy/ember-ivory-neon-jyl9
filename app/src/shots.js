// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// photo loaded; ?shot=cover shows the cover alone, full-bleed.
// `photo` picks the sample (pier / boulevard), `caption` the title,
// `size` the export size, `grade` the colour grade.
// window.__shotReady is set once the scene has painted.
export async function runShot(query, editor) {
  const shot = query.get('shot') ?? 'editor';
  const photo = query.get('photo') ?? 'pier';
  const title = query.get('caption') ?? 'Sunset Heist';
  const size = query.get('size') ?? '1920x1080';
  const grade = query.get('grade') ?? 'sunset';

  if (shot === 'cover') document.body.classList.add('shot-cover');

  editor.state.title = title;
  editor.state.grade = grade;
  editor.state.sizeKey = size;
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === size));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === grade));

  await editor.loadSamples();
  // Alternate the two samples across panels so the cover shows variety.
  const other = photo === 'pier' ? 'boulevard' : 'pier';
  editor.state.panels.forEach((p, i) => { p.src = i % 2 === 0 ? photo : other; });
  editor.fitCanvas();
  editor.render();

  await document.fonts.ready;
  editor.render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
