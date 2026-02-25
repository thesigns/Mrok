const TILE_SIZE = 24;
const SCALE = 1;
const DRAW_SIZE = TILE_SIZE * SCALE;
const VIEW = 15;

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
    const ids = [0, 1, 2, 3, 4, 5, 6, 7];
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

        const dx = sx * DRAW_SIZE;
        const dy = sy * DRAW_SIZE;
        if (tile.visible && tile.critter) {
          this.drawTinted(ctx, this.images[0], dx, dy, tile.critter.tint);
        } else {
          this.drawTinted(ctx, this.images[tile.image], dx, dy, tile.tint);
        }

        if (!tile.visible) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.67)";
          ctx.fillRect(dx, dy, DRAW_SIZE, DRAW_SIZE);
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
