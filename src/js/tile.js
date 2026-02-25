export const TileType = {
  FLOOR: "floor",
  WALL: "wall",
  DOOR_OPEN: "door_open",
  DOOR_CLOSED: "door_closed",
  WATER_SHALLOW: "water_shallow",
  WATER_DEEP: "water_deep",
  GRAVE: "grave",
  STAIRS_DOWN: "stairs_down",
};

export class Tile {
  constructor() {
    // Type identity
    this.type = TileType.FLOOR;
    // Visual — renderer
    this.image = 1;
    this.tint = "#555";
    // Visual — minimap
    this.minimapBright = "#666";
    this.minimapDark = "#333";
    // Physical
    this.opaque = false;
    this.passable = true;
    // Instance state
    this.critter = null;
    this.visible = false;
    this.revealed = false;
  }

  isOpaque() {
    return this.opaque;
  }

  // --- Factory methods ---

  static floor() {
    return new Tile();
  }

  static wall() {
    const t = new Tile();
    t.type = TileType.WALL;
    t.image = 2;
    t.tint = "#999";
    t.minimapBright = "#999";
    t.minimapDark = "#555";
    t.opaque = true;
    t.passable = false;
    return t;
  }

  static doorOpen() {
    const t = new Tile();
    t.type = TileType.DOOR_OPEN;
    t.image = 3;
    t.tint = "#8B4513";
    t.minimapBright = "#8B6530";
    t.minimapDark = "#5a3a10";
    return t;
  }

  static doorClosed() {
    const t = new Tile();
    t.type = TileType.DOOR_CLOSED;
    t.image = 4;
    t.tint = "#8B4513";
    t.minimapBright = "#8B6530";
    t.minimapDark = "#5a3a10";
    t.opaque = true;
    t.passable = false;
    return t;
  }

  static waterShallow() {
    const t = new Tile();
    t.type = TileType.WATER_SHALLOW;
    t.image = 5;
    t.tint = "#4488cc";
    t.minimapBright = "#4488cc";
    t.minimapDark = "#224466";
    return t;
  }

  static waterDeep() {
    const t = new Tile();
    t.type = TileType.WATER_DEEP;
    t.image = 5;
    t.tint = "#224488";
    t.minimapBright = "#224488";
    t.minimapDark = "#112244";
    t.passable = false;
    return t;
  }

  static grave() {
    const t = new Tile();
    t.type = TileType.GRAVE;
    t.image = 6;
    return t;
  }

  static stairsDown() {
    const t = new Tile();
    t.type = TileType.STAIRS_DOWN;
    t.image = 7;
    t.tint = "#aa8855";
    t.minimapBright = "#aa8855";
    t.minimapDark = "#554428";
    return t;
  }

  static create(type) {
    switch (type) {
      case TileType.FLOOR: return Tile.floor();
      case TileType.WALL: return Tile.wall();
      case TileType.DOOR_OPEN: return Tile.doorOpen();
      case TileType.DOOR_CLOSED: return Tile.doorClosed();
      case TileType.WATER_SHALLOW: return Tile.waterShallow();
      case TileType.WATER_DEEP: return Tile.waterDeep();
      case TileType.GRAVE: return Tile.grave();
      case TileType.STAIRS_DOWN: return Tile.stairsDown();
    }
  }
}
