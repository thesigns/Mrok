import { Tile, TileType } from "./tile.js";

export class Scene {
  constructor(width = 64, height = 64) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Tile())
    );
  }

  get(x, y) {
    return this.tiles[y][x];
  }

  set(x, y, type) {
    const old = this.tiles[y][x];
    const tile = Tile.create(type);
    tile.critter = old.critter;
    tile.visible = old.visible;
    tile.revealed = old.revealed;
    this.tiles[y][x] = tile;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isPassable(x, y) {
    if (!this.inBounds(x, y)) return false;
    const tile = this.get(x, y);
    if (!tile.passable) return false;
    if (tile.critter) return false;
    return true;
  }
}
