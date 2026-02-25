import { Session } from "./session.js";
import { Renderer } from "./renderer.js";
import { Minimap } from "./minimap.js";
import { TileType } from "./tile.js";
import { Infobox } from "./infobox.js";
import { FOV } from "./fov.js";
import { Keyboard } from "./keyboard.js";
import { Astar } from "./astar.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.renderer = new Renderer();
    this.minimap = new Minimap(document.querySelector("#minimap"));
    this.session = new Session();
    this.infobox = new Infobox(document.querySelector("#infobox"));
    this.repeatTimeout = null;
    this.repeatInterval = null;
    this.targeting = null;
    this.handleBtn = document.querySelector("#btn-handle");

    this.renderer.load().then(() => this.render());

    const compass = document.querySelector(".compass");

    compass.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".btn[data-dx]");
      if (!btn) return;
      e.preventDefault();
      const dx = parseInt(btn.dataset.dx);
      const dy = parseInt(btn.dataset.dy);

      this.handleCompass(dx, dy);
      this.stopRepeat();
      this.repeatTimeout = setTimeout(() => {
        this.repeatInterval = setInterval(() => this.handleCompass(dx, dy), 100);
      }, 500);
    });

    compass.addEventListener("pointerup", () => this.stopRepeat());
    compass.addEventListener("pointerleave", () => this.stopRepeat());

    this.handleBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.handleHandle();
    });

    this.keyboard = new Keyboard({
      onCompass: (dx, dy) => this.handleCompass(dx, dy),
      onHandle: () => this.handleHandle(),
      onMenu: () => document.querySelector("#btn-menu").click(),
      isActive: () => !document.querySelector("#game-screen").hidden,
    });

    // Mouse cursor overlay
    this.overlay = document.createElement("canvas");
    this.overlay.width = 360;
    this.overlay.height = 360;
    this.overlay.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;background:transparent";
    this.overlay.getContext("2d").imageSmoothingEnabled = false;
    canvas.parentElement.appendChild(this.overlay);
    this.cursorImg = new Image();
    this.cursorImg.src = "./gfx/gui/cursor.png";

    canvas.addEventListener("mousemove", (e) => {
      const sx = Math.floor(e.offsetX / 24);
      const sy = Math.floor(e.offsetY / 24);
      const ctx = this.overlay.getContext("2d");
      ctx.clearRect(0, 0, 360, 360);
      if (this.cursorImg.complete) {
        ctx.drawImage(this.cursorImg, sx * 24, sy * 24);
      }
    });

    canvas.addEventListener("mouseleave", () => {
      this.overlay.getContext("2d").clearRect(0, 0, 360, 360);
    });

    canvas.addEventListener("click", (e) => {
      const sx = Math.floor(e.offsetX / 24);
      const sy = Math.floor(e.offsetY / 24);
      const player = this.session.player;
      const camX = player.x - 7;
      const camY = player.y - 7;
      const wx = camX + sx;
      const wy = camY + sy;

      if (wx === player.x && wy === player.y) {
        this.handleCompass(0, 0);
        return;
      }

      const path = Astar.findPath(this.session.scene, player.x, player.y, wx, wy);
      if (path && path.length > 0) {
        const dx = path[0].x - player.x;
        const dy = path[0].y - player.y;
        this.handleCompass(dx, dy);
      }
    });
  }

  stopRepeat() {
    clearTimeout(this.repeatTimeout);
    clearInterval(this.repeatInterval);
    this.repeatTimeout = null;
    this.repeatInterval = null;
  }

  handleCompass(dx, dy) {
    if (this.targeting) {
      const entry = this.targeting.find(t => t.dx === dx && t.dy === dy);
      this.cancelTargeting();
      if (entry) {
        this.useTile(entry);
      }
      return;
    }
    this.movePlayer(dx, dy);
  }

  handleHandle() {
    if (this.targeting) {
      this.cancelTargeting();
      return;
    }
    const usable = this.getUsableTiles();
    if (usable.length === 0) return;
    if (usable.length === 1) {
      this.useTile(usable[0]);
    } else {
      this.enterTargeting(usable);
    }
  }

  movePlayer(dx, dy) {
    if (this.targeting) this.cancelTargeting();
    this.infobox.hide();
    const player = this.session.player;
    const scene = this.session.scene;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (dx === 0 && dy === 0) {
      this.render();
      return;
    }

    if (scene.inBounds(nx, ny) && scene.get(nx, ny).type === TileType.DOOR_CLOSED) {
      scene.set(nx, ny, TileType.DOOR_OPEN);
      this.infobox.show("You open the door.");
      this.render();
      return;
    }

    if (!scene.isPassable(nx, ny)) return;

    const fromType = scene.get(player.x, player.y).type;
    scene.get(player.x, player.y).critter = null;
    player.x = nx;
    player.y = ny;
    scene.get(nx, ny).critter = player;

    const toType = scene.get(nx, ny).type;
    if (toType === TileType.WATER_SHALLOW && fromType !== TileType.WATER_SHALLOW) {
      this.infobox.show("You wade into the water.");
    } else if (fromType === TileType.WATER_SHALLOW && toType !== TileType.WATER_SHALLOW) {
      this.infobox.show("You step out of the water.");
    } else if (toType === TileType.GRAVE) {
      this.infobox.show("You stand over a grave.");
    } else if (toType === TileType.STAIRS_DOWN) {
      this.infobox.show("A stairway descends into the darkness below.");
    }

    this.render();
  }

  getUsableTiles() {
    const player = this.session.player;
    const scene = this.session.scene;
    const usable = [];
    const STAND_ON = [TileType.STAIRS_DOWN, TileType.GRAVE];
    const ADJACENT = [TileType.DOOR_OPEN, TileType.DOOR_CLOSED];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = player.x + dx;
        const y = player.y + dy;
        if (!scene.inBounds(x, y)) continue;
        const type = scene.get(x, y).type;
        if (dx === 0 && dy === 0) {
          if (STAND_ON.includes(type)) usable.push({ dx, dy, type });
        } else {
          if (ADJACENT.includes(type)) usable.push({ dx, dy, type });
        }
      }
    }
    return usable;
  }

  enterTargeting(usable) {
    this.targeting = usable;
    this.infobox.showPersistent("Which direction?");
    const buttons = document.querySelectorAll(".compass .btn[data-dx]");
    for (const btn of buttons) {
      const dx = parseInt(btn.dataset.dx);
      const dy = parseInt(btn.dataset.dy);
      const match = usable.some(t => t.dx === dx && t.dy === dy);
      btn.classList.remove("blocked");
      btn.classList.toggle("target", match);
      btn.classList.toggle("target-disabled", !match);
    }
  }

  cancelTargeting() {
    this.targeting = null;
    this.infobox.hide();
    const buttons = document.querySelectorAll(".compass .btn[data-dx]");
    for (const btn of buttons) {
      btn.classList.remove("target", "target-disabled");
    }
    this.updateControls();
  }

  useTile({ dx, dy, type }) {
    const player = this.session.player;
    const scene = this.session.scene;
    const tx = player.x + dx;
    const ty = player.y + dy;

    switch (type) {
      case TileType.STAIRS_DOWN:
        this.session.dungeonLevel++;
        this.session.newLevel();
        this.infobox.show(`You descend to level ${this.session.dungeonLevel}.`);
        this.render();
        break;
      case TileType.DOOR_OPEN:
        scene.set(tx, ty, TileType.DOOR_CLOSED);
        this.infobox.show("You close the door.");
        this.render();
        break;
      case TileType.DOOR_CLOSED:
        scene.set(tx, ty, TileType.DOOR_OPEN);
        this.infobox.show("You open the door.");
        this.render();
        break;
      case TileType.GRAVE:
        this.infobox.show("To dig the grave you need a shovel.");
        break;
    }
  }

  render() {
    FOV.compute(this.session.scene, this.session.player.x, this.session.player.y, 8);
    this.renderer.draw(this.ctx, this.session.scene, this.session.player);
    this.minimap.draw(this.session.scene, this.session.player);
    this.updateControls();
  }

  updateControls() {
    const player = this.session.player;
    const scene = this.session.scene;
    const buttons = document.querySelectorAll(".compass .btn[data-dx]");
    for (const btn of buttons) {
      const dx = parseInt(btn.dataset.dx);
      const dy = parseInt(btn.dataset.dy);
      const nx = player.x + dx;
      const ny = player.y + dy;
      const t = scene.inBounds(nx, ny) ? scene.get(nx, ny).type : null;
      const isBlocked = !t || t === TileType.WALL || t === TileType.WATER_DEEP;
      btn.classList.toggle("blocked", isBlocked);
    }
    this.handleBtn.classList.toggle("active", this.getUsableTiles().length > 0);
  }
}
