[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/cervus-snoopy/ember-ivory-neon-jyl9/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/cervus-snoopy/ember-ivory-neon-jyl9/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio — GTA-style multi-panel cover maker

Turn a photo and a caption into a Vice City sunset poster, in your browser,
offline, in three steps: pick a photo, write the title, export the PNG.

[make.fun bounty: gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01)

## What it does

- **Multi-panel poster** — four panels with slanted, cut-sheet edges (hero panel
  + three supporting panels), a different layout per export size.
- **Any photo** — upload your own photo per panel, or use the two built-in
  sample photos. Click a panel to select it, drag on the preview to move the
  photo inside it, scroll to zoom, or use the zoom slider. Each panel crops
  independently.
- **Bold lettering over the art** — a retro-chrome 3D title with a forward lean
  and hot top edge, a letter-spaced subtitle bar, a billing block, a round seal
  badge, and three callout labels you can edit.
- **Grades** — Sunset, Neon Night, and Twilight Gold, each with its own sky
  wash, sun glow and chrome palette, plus a Poster Ink grain + vignette toggle.
- **Fast export** — one click exports a PNG in 1920 × 1080, 1080 × 1350, or
  1080 × 1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Plain static files under `app/` — no build step, no network request at runtime.
The display font is Anton (SIL Open Font License, vendored under
`app/fonts/` with its `OFL.txt`). The two sample photos under `app/samples/`
were made with an image model for make.fun and are free to use. Photos you
upload are read on your own machine and never sent anywhere.

No Rockstar Games logo, artwork, character, or font is used anywhere.

## Screenshots

- `screenshots/1-cover.jpg` — exported landscape cover (1920 × 1080)
- `screenshots/2-editor.png` — the editor with a photo loaded
- `screenshots/3-cover-portrait.jpg` — exported portrait cover (1080 × 1350)
- `screenshots/4-cover-square.jpg` — exported square cover (1080 × 1080)

## License

MIT — see [LICENSE](LICENSE).
