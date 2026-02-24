import { Session } from "./session.js";
import { Renderer } from "./renderer.js";
import { TileType } from "./tile.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.renderer = new Renderer();
    this.session = new Session();

    this.renderer.load().then(() => this.render());

    document.querySelector("#controls").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-dx]");
      if (!btn) return;
      const dx = parseInt(btn.dataset.dx);
      const dy = parseInt(btn.dataset.dy);
      this.movePlayer(dx, dy);
    });
  }

  movePlayer(dx, dy) {
    const player = this.session.player;
    const scene = this.session.scene;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (dx === 0 && dy === 0) {
      this.render();
      return;
    }

    if (!scene.isPassable(nx, ny)) return;

    scene.get(player.x, player.y).critter = null;
    player.x = nx;
    player.y = ny;
    scene.get(nx, ny).critter = player;

    this.render();
  }

  render() {
    this.renderer.draw(this.ctx, this.session.scene, this.session.player);
    this.updateControls();
  }

  updateControls() {
    const player = this.session.player;
    const scene = this.session.scene;
    const buttons = document.querySelectorAll("#controls button[data-dx]");
    for (const btn of buttons) {
      const dx = parseInt(btn.dataset.dx);
      const dy = parseInt(btn.dataset.dy);
      const nx = player.x + dx;
      const ny = player.y + dy;
      const isWall = !scene.inBounds(nx, ny) ||
        scene.get(nx, ny).type === TileType.WALL;
      btn.classList.toggle("blocked", isWall);
    }
  }
}
