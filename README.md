[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/xenopatijaya/gta6-cover-art-01-v4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/xenopatijaya/gta6-cover-art-01-v4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Key Art Studio

A GTA 6-style cover art maker. Drop in a photo, pick a key-art layout and a
cinematic grade, add your caption — and export a theatrical Leonida poster
as a PNG. It is a fully static web app: no build step, no network calls,
every script, style, font and image is a local file under `app/`, so it
works completely offline in desktop Chrome.

## Features

- **13 layouts** — Key Art Wide (7 panels), Key Art Ensemble, Pop-Out Hero,
  Diagonal Cut, Nine Grid, Hero + 3, Full Bleed, Duo Split, Triple Strip,
  Polaroid Snaps, Center Stage, Four Square and Hero Top.
- **Photos** — six built-in Leonida samples (four cast portraits, a
  boulevard and a pier) plus your own uploads, read locally in the browser
  only. Each panel can be assigned any photo, with per-photo shift X / Y
  and zoom controls and a deterministic face-aware crop heuristic
  (skin-tone + edge-density scoring in `app/src/focus.js`).
- **Chrome title & neon subtitle** — a giant striped-chrome Anton headline
  that overlaps the panels, with a Pacifico neon-glow script subtitle
  underneath. Both are editable.
- **Role tags** — per-panel character chips: THE BOSS, THE DRIVER,
  THE CREW, THE WILDCARD, THE INSIDER, THE GETAWAY and more.
- **Poster dressing** — a press strip with five stars and review quotes
  from the Leonida Gazette, a film-style billing block, a gold
  "EST. 2026 • LEONIDA" seal, and a barcode drawn on canvas.
- **9 cinematic grades** — gradient-map color grades (Vice Sunset,
  Neon Rain, Golden Hour, Midnight, Coral Heat, Chrome Noir, Palm Haze,
  Ocean Drive, Retro Print) finished with halftone, grain and vignette.
- **Editor** — four steps (Photos → Layout → Grade → Poster) with a live
  canvas preview and undo/redo.
- **Export** — one-click PNG at 1080×1080, 1080×1350 and 1920×1080, or
  export all three at once.
- **Shot modes** — `?shot=cover`, `?shot=story`, `?shot=square` and
  `?shot=editor` render fixed, deterministic states for screenshots.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in Chrome. (Any static file server pointed
at `app/` works just as well.)

## Layout of the repo

- `app/` — the static web app (`index.html`, `style.css`, `src/*.js`,
  local fonts in `app/fonts/`, sample photos in `app/samples/`).
- `screenshots/` — the four submission screenshots.
- `main.ts` — the make.fun entrypoint: copies `app/` and `screenshots/`
  into the output directory and writes `dossier.json` via the kit library.
- `shots.json` — the screenshot shot list (name, query, width, height).

## Bounty

Built for the make.fun bounty:
https://make.fun/bounty/gta6-cover-art-01

Fonts: Anton and Pacifico, SIL Open Font License 1.1 (license texts are
bundled in `app/fonts/`).
