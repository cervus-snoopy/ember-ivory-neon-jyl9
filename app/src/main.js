/* Vice Cover Studio — app entry. One module script in index.html loads this
   file, which starts the editor once the page is ready. All of the work
   lives in editor.js (controls and state), render.js (canvas export) and
   shots.js (sizes, grades and screenshot presets). */

import { initEditor } from './editor.js';

/** Start the app as soon as the document is ready to be wired. */
function startViceCoverStudio() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEditor();
    });
  } else {
    initEditor();
  }
}

startViceCoverStudio();
