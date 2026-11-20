[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/cervus-snoopy/ember-ivory-neon-jyl9/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/cervus-snoopy/ember-ivory-neon-jyl9/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio

A GTA-style multi-panel cover maker. Load your photos, crop and position each one in four slanted panels, edit the captions and the poster words, pick a colour grade — Sunset, Neon Night or Twilight Gold — and export a PNG to share in the common post sizes: 1080 × 1080, 1080 × 1350 and 1920 × 1080.

## What it makes

A four-panel sunset poster: a gradient sky with a sun disc and skyline, four skewed panels filled with your photos, a retro-chrome 3D title across the top, a subtitle bar, a circular seal stamp, three callout labels pointing at details, a billing block along the bottom, and poster-ink grain plus a vignette over everything.

## How to use it

1. Serve the app — `node serve.ts` — and open http://localhost:8080.
2. Photos: click a sample scene, or load your own photo into any panel with its file picker. Drag a panel to move its photo; the zoom and position sliders crop it precisely; the caption box renames it.
3. Words: edit the cover title, the subtitle bar and the billing block in step 3 of the editor.
4. Grade: Sunset, Neon Night or Twilight Gold, from the top bar.
5. Export: pick a size (1080 × 1080, 1080 × 1350 or 1920 × 1080) and press Export PNG. The cover is drawn on a canvas at full size and downloaded as a PNG.

Photos are read on your own machine and never uploaded. The app works fully offline: every script, style, image and font it loads is a file under `app/`.

## Files

- `app/index.html` — the page: top bar, cover stage, editor sidebar.
- `app/style.css` — all of the look: grades as CSS variables, slanted panels, chrome title, seal, grain and vignette.
- `app/src/main.js` — entry: starts the editor.
- `app/src/editor.js` — state, panel controls, drag-to-pan, photo loading, export wiring, self-test.
- `app/src/render.js` — canvas renderer: repaints the whole poster at export size.
- `app/src/shots.js` — export sizes, grades, sample scenes and screenshot presets.
- `app/samples/` — four sample scenes made for this entry (gradient + skyline art).
- `app/fonts/Anton-Regular.ttf` — Anton, SIL Open Font License 1.1 (see `app/fonts/OFL.txt`).
- `screenshots/` — the cover and the editor, rendered from this app.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.
- `serve.ts` — local static server for trying the app.
- `vendor/makefun-app.ts` — make.fun's dossier library (the kit's copy, unchanged).

## Originality

All art is original CSS, SVG and canvas work made for this entry. No Rockstar Games logos, artwork, characters or fonts are used anywhere.

## Competition

Built for [make.fun's GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## License

MIT — see [LICENSE](LICENSE).
