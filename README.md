# Mrok

Mrok is a traditional roguelike game you can fit in your pocket... if you want to.

Written as a progressive web app using vanilla JavaScript and HTML5 Canvas. No frameworks, no build tools — just static files.

## Features

- Tile-based roguelike with 8-directional movement
- 70x46 procedurally generated dungeons (rooms, corridors, doors)
- Room shape specializations (columns, rounded corners, center cross)
- Room features (water pools with shallow/deep water, graveyards)
- Multiple tile types: floors, walls, doors, water, graves, stairs
- Multi-level dungeon descent via stairs
- Handle button for tile interactions (open/close doors, descend stairs, dig graves)
- Direction targeting when multiple interactable tiles are nearby
- Field of view with fog of war (recursive shadowcasting)
- Minimap showing explored areas
- Infobox overlay with context-aware messages
- Touch controls via on-screen compass rose with hold-to-repeat
- Menu screen with title art
- Mobile-first (landscape orientation, fullscreen PWA)
- Pixel art with color tinting
- Works offline

## Development

Serve the `src/` directory with any static HTTP server:

```
python -m http.server 8000 --directory src
```

## License

[PolyForm Noncommercial License 1.0.0](LICENSE.txt)
