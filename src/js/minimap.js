const PX = 3;
const VIEW = 15;

export class Minimap {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
  }

  draw(scene, player) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, scene.width * PX, scene.height * PX);

    for (let y = 0; y < scene.height; y++) {
      for (let x = 0; x < scene.width; x++) {
        const tile = scene.get(x, y);
        if (!tile.revealed) continue;

        ctx.fillStyle = tile.visible ? tile.minimapBright : tile.minimapDark;
        ctx.fillRect(x * PX, y * PX, PX, PX);
      }
    }

    // Player dot
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x * PX, player.y * PX, PX, PX);

    // Viewport frame
    const vx = (player.x - 7) * PX;
    const vy = (player.y - 7) * PX;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(vx + 0.5, vy + 0.5, VIEW * PX - 1, VIEW * PX - 1);
  }
}
