# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mrok is a traditional roguelike game built as a Progressive Web App (PWA) using vanilla JavaScript and HTML5 Canvas. It targets mobile browsers in landscape orientation with offline capability.

## Development

There is no build system, package manager, or bundler. The app is static files served directly.

To develop locally, serve the `src/` directory with any static HTTP server (e.g. `python -m http.server 8000 --directory src`).

## Architecture

All JavaScript uses ES6 modules (`<script type="module">`), no frameworks or dependencies.

- **`src/index.html`** — entry point: landscape layout with `#panel-left` (3x5 buttons), 352x352 canvas, `#panel-right` (3x5 buttons with compass rose in center 3x3)
- **`src/js/main.js`** — creates `Game` instance
- **`src/js/game.js`** — `Game` class: owns canvas, `Session`, `Renderer`; handles player input from compass buttons via `data-dx`/`data-dy` attributes with auto-repeat (500ms delay, then 100ms interval); updates button states (wall-blocked directions get `.blocked` class)
- **`src/js/session.js`** — `Session` class: holds current `Scene` and `player` (Critter)
- **`src/js/scene.js`** — `Scene` class: 64x64 grid of `Tile` objects; methods `get()`, `set()`, `inBounds()`, `isPassable()`
- **`src/js/scene_generator.js`** — `SceneGenerator`: fills scene with floor + ~15% random walls, places player on a random floor tile
- **`src/js/tile.js`** — `Tile` class (has `type` and `critter` fields) + `TileType` enum (FLOOR, WALL, DOOR_OPEN, DOOR_CLOSED)
- **`src/js/critter.js`** — `Critter` class: `x`, `y`, `isPlayer`, `tint`; player and enemies are the same class
- **`src/js/renderer.js`** — `Renderer` class: loads tile PNGs, draws 11x11 viewport centered on player at 2x scale (32x32px tiles); uses offscreen stamp canvas for `source-atop` color tinting

### Rendering

- Tile sprites are 16x16px in `src/gfx/tiles/` (0=player, 1=floor, 2=wall, 3=door_open, 4=door_closed), drawn at 200% scale
- Canvas is 352x352px = 11x11 visible tiles, player always at center
- Each tile/critter is tinted via `source-atop` compositing on an offscreen canvas; tile colors defined in `TILE_TINT`, critter color in `critter.tint`
- `imageSmoothingEnabled = false` on both main and stamp canvas for crisp pixel art

### Controls

Landscape layout: `[#panel-left 3x5] [canvas] [#panel-right 3x5]` in a flex row. Both panels use CSS grid (3 columns, 5 rows) matching canvas height (352px). The inner 3x3 of `#panel-right` is the movement compass (buttons with `data-dx`/`data-dy`), all other buttons are `?` placeholders for future actions.

Input uses `pointerdown`/`pointerup`/`pointerleave` events with auto-repeat: first move fires immediately, repeat starts after 500ms, then every 100ms. Context menu is suppressed on the panel. Compass buttons blocked by walls get the `.blocked` CSS class. Text selection is disabled globally (`user-select: none`).

### Assets

- `assets/Tiles.aseprite` — source design file
- `src/gfx/tiles/*.png` — exported tile sprites
- `src/fonts/NotoSansSymbols2.woff2` — subset font for Unicode arrows on Android

## License

PolyForm Noncommercial License 1.0.0 — no commercial use permitted.
