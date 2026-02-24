import { TileType } from "./tile.js";

const TILE_SIZE = 16;
const SCALE = 2;
const DRAW_SIZE = TILE_SIZE * SCALE;
const VIEW = 11;

const TILE_IMAGE = {
  [TileType.FLOOR]: 1,
  [TileType.WALL]: 2,
  [TileType.DOOR_OPEN]: 3,
  [TileType.DOOR_CLOSED]: 4,
};

const TILE_TINT = {
  [TileType.FLOOR]: "#555",
  [TileType.WALL]: "#999",
  [TileType.DOOR_OPEN]: "#8B4513",
  [TileType.DOOR_CLOSED]: "#8B4513",
};

export class Renderer {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.stamp = document.createElement("canvas");
    this.stamp.width = DRAW_SIZE;
    this.stamp.height = DRAW_SIZE;
    this.stampCtx = this.stamp.getContext("2d");
    this.stampCtx.imageSmoothingEnabled = false;
  }

  load() {
    const ids = [0, 1, 2, 3, 4];
    const promises = ids.map(id => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.images[id] = img; resolve(); };
      img.onerror = reject;
      img.src = `./gfx/tiles/${id}.png`;
    }));
    return Promise.all(promises).then(() => { this.loaded = true; });
  }

  draw(ctx, scene, player) {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW * DRAW_SIZE, VIEW * DRAW_SIZE);

    const camX = player.x - 5;
    const camY = player.y - 5;

    for (let sy = 0; sy < VIEW; sy++) {
      for (let sx = 0; sx < VIEW; sx++) {
        const wx = camX + sx;
        const wy = camY + sy;

        if (wx < 0 || wy < 0 || wx >= scene.width || wy >= scene.height) continue;

        const tile = scene.get(wx, wy);
        const imgId = TILE_IMAGE[tile.type];
        this.drawTinted(ctx, this.images[imgId], sx * DRAW_SIZE, sy * DRAW_SIZE, TILE_TINT[tile.type]);

        if (tile.critter) {
          this.drawTinted(ctx, this.images[0], sx * DRAW_SIZE, sy * DRAW_SIZE, tile.critter.tint);
        }
      }
    }
  }

  drawTinted(ctx, img, x, y, tint) {
    const s = this.stampCtx;
    s.clearRect(0, 0, DRAW_SIZE, DRAW_SIZE);
    s.globalCompositeOperation = "source-over";
    s.drawImage(img, 0, 0, DRAW_SIZE, DRAW_SIZE);
    s.globalCompositeOperation = "source-atop";
    s.fillStyle = tint;
    s.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE);
    ctx.drawImage(this.stamp, x, y);
  }
}
