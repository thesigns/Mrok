import { Tile, TileType } from "./tile.js";

export class Scene {
  constructor(width = 64, height = 64) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new Tile(TileType.FLOOR))
    );
  }

  get(x, y) {
    return this.tiles[y][x];
  }

  set(x, y, type) {
    this.tiles[y][x].type = type;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isPassable(x, y) {
    if (!this.inBounds(x, y)) return false;
    const tile = this.get(x, y);
    if (tile.type === TileType.WALL || tile.type === TileType.DOOR_CLOSED || tile.type === TileType.WATER_DEEP) return false;
    if (tile.critter) return false;
    return true;
  }
}
