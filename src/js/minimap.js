import { TileType } from "./tile.js";

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

        const bright = tile.visible;
        const t = tile.type;

        if (t === TileType.FLOOR || t === TileType.GRAVE)
          ctx.fillStyle = bright ? "#666" : "#333";
        else if (t === TileType.WALL)
          ctx.fillStyle = bright ? "#999" : "#555";
        else if (t === TileType.DOOR_OPEN || t === TileType.DOOR_CLOSED)
          ctx.fillStyle = bright ? "#8B6530" : "#5a3a10";
        else if (t === TileType.WATER_SHALLOW)
          ctx.fillStyle = bright ? "#4488cc" : "#224466";
        else if (t === TileType.WATER_DEEP)
          ctx.fillStyle = bright ? "#224488" : "#112244";
        else if (t === TileType.STAIRS_DOWN)
          ctx.fillStyle = bright ? "#aa8855" : "#554428";

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
