import { TileType } from "./tile.js";

const TILE_SIZE = 24;
const SCALE = 1;
const DRAW_SIZE = TILE_SIZE * SCALE;
const VIEW = 15;

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

    const camX = player.x - 7;
    const camY = player.y - 7;

    for (let sy = 0; sy < VIEW; sy++) {
      for (let sx = 0; sx < VIEW; sx++) {
        const wx = camX + sx;
        const wy = camY + sy;

        if (wx < 0 || wy < 0 || wx >= scene.width || wy >= scene.height) continue;

        const tile = scene.get(wx, wy);

        if (!tile.revealed) continue;

        const imgId = TILE_IMAGE[tile.type];
        const dx = sx * DRAW_SIZE;
        const dy = sy * DRAW_SIZE;
        this.drawTinted(ctx, this.images[imgId], dx, dy, TILE_TINT[tile.type]);

        if (tile.visible && tile.critter) {
          this.drawTinted(ctx, this.images[0], dx, dy, tile.critter.tint);
        }

        if (!tile.visible) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.67)";
          ctx.fillRect(dx, dy, DRAW_SIZE, DRAW_SIZE);
        }
      }
    }
  }

  drawMinimap(ctx, scene, player) {
    const PX = 3;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, scene.width * PX, scene.height * PX);

    for (let y = 0; y < scene.height; y++) {
      for (let x = 0; x < scene.width; x++) {
        const tile = scene.get(x, y);
        if (!tile.revealed) continue;

        const bright = tile.visible;
        const t = tile.type;

        if (t === TileType.FLOOR)
          ctx.fillStyle = bright ? "#666" : "#333";
        else if (t === TileType.WALL)
          ctx.fillStyle = bright ? "#999" : "#555";
        else if (t === TileType.DOOR_OPEN || t === TileType.DOOR_CLOSED)
          ctx.fillStyle = bright ? "#8B6530" : "#5a3a10";

        ctx.fillRect(x * PX, y * PX, PX, PX);
      }
    }

    // Player dot
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x * PX, player.y * PX, PX, PX);

    // Viewport frame
    const vx = (player.x - 5) * PX;
    const vy = (player.y - 5) * PX;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(vx + 0.5, vy + 0.5, VIEW * PX - 1, VIEW * PX - 1);
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
