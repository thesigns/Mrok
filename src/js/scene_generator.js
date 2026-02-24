import { Scene } from "./scene.js";
import { TileType } from "./tile.js";
import { Critter } from "./critter.js";

export class SceneGenerator {
  generate(width = 64, height = 64) {
    const scene = new Scene(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < 0.15) {
          scene.set(x, y, TileType.WALL);
        }
      }
    }

    const player = this.placePlayer(scene);
    return { scene, player };
  }

  placePlayer(scene) {
    while (true) {
      const x = Math.floor(Math.random() * scene.width);
      const y = Math.floor(Math.random() * scene.height);
      const tile = scene.get(x, y);
      if (tile.type === TileType.FLOOR && !tile.critter) {
        const player = new Critter(x, y, true);
        tile.critter = player;
        return player;
      }
    }
  }
}
