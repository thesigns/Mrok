# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mrok is a traditional roguelike game built as a Progressive Web App (PWA) using vanilla JavaScript and HTML5 Canvas. It targets mobile browsers in landscape orientation with offline capability.

## Development

There is no build system, package manager, or bundler. The app is static files served directly.

To develop locally, serve the `src/` directory with any static HTTP server (e.g. `python -m http.server 8000 --directory src`).

## Architecture

All JavaScript uses ES6 modules (`<script type="module">`), no frameworks or dependencies.

- **`src/index.html`** — entry point: landscape layout with `#panel-left` (stats + 3x3 buttons), 360x360 canvas, `#panel-right` (minimap + 3x3 compass)
- **`src/js/main.js`** — creates `Game` instance, handles PWA install screen
- **`src/js/game.js`** — `Game` class: owns canvas, minimap canvas, `Session`, `Renderer`; handles player input from compass buttons; opens closed doors on bump; calls FOV and renderer each frame
- **`src/js/session.js`** — `Session` class: holds current `Scene` and `player` (Critter), uses `SceneGenerator2`
- **`src/js/scene.js`** — `Scene` class: 70x46 grid of `Tile` objects; methods `get()`, `set()`, `inBounds()`, `isPassable()`
- **`src/js/scene_generator2.js`** — `SceneGenerator2`: procedural dungeon with rooms (3-8 tiles), corridors, doors; room shape specializations (CornerColumns, RoundedCorners, CenterCross, CenterCrossRoundedCorners); removes disconnected rooms; processes doors (corridor-corridor → floor, room entrance → 30% open / 70% closed)
- **`src/js/tile.js`** — `Tile` class (has `type`, `critter`, `visible`, `revealed` fields, `isOpaque()` method) + `TileType` enum (FLOOR, WALL, DOOR_OPEN, DOOR_CLOSED)
- **`src/js/critter.js`** — `Critter` class: `x`, `y`, `isPlayer`, `tint`; player and enemies are the same class
- **`src/js/renderer.js`** — `Renderer` class: loads tile PNGs, draws 15x15 viewport centered on player; uses offscreen stamp canvas for `source-atop` color tinting; draws minimap (whole map at 3px/tile)
- **`src/js/fov.js`** — `FOV` class: recursive shadowcasting across 8 octants; sets `tile.visible` and `tile.revealed`

### Rendering

- Tile sprites are 24x24px in `src/gfx/tiles/` (0=player, 1=floor, 2=wall, 3=door_open, 4=door_closed), drawn at native size
- Canvas is 360x360px = 15x15 visible tiles, player always at center
- Each tile/critter is tinted via `source-atop` compositing on an offscreen canvas; tile colors defined in `TILE_TINT`, critter color in `critter.tint`
- `imageSmoothingEnabled = false` on both main and stamp canvas for crisp pixel art
- FOV: unrevealed tiles are black, revealed-but-not-visible get `rgba(0,0,0,0.67)` overlay, visible tiles drawn normally
- Minimap: 210x138px canvas (3px per tile), shows revealed tiles with viewport frame

### Controls

Landscape layout: `[#panel-left] [canvas] [#panel-right]` in a flex row. Left panel: `#stats` div (210x138, placeholder) + `.button-grid` 3x3. Right panel: `#minimap` canvas (210x138) + `.compass` 3x3. Both panels are 210x360px.

Input uses `pointerdown`/`pointerup`/`pointerleave` events on `.compass` with auto-repeat: first move fires immediately, repeat starts after 500ms, then every 100ms. Bumping into closed doors opens them without moving. Compass buttons blocked by walls get the `.blocked` CSS class. Text selection is disabled globally.

### Assets

- `assets/Tiles.aseprite` — source design file
- `assets/DungeonGenerator3.cs` — reference C# dungeon generator (Erg project)
- `src/gfx/tiles/*.png` — exported tile sprites (24x24px)
- `src/fonts/NotoSansSymbols2.woff2` — subset font for Unicode arrows on Android

## License

PolyForm Noncommercial License 1.0.0 — no commercial use permitted.
