import { SceneGenerator2 } from "./scene_generator2.js";

export class Session {
  constructor() {
    this.dungeonLevel = 1;
    this.newLevel();
  }

  newLevel() {
    const generator = new SceneGenerator2();
    const { scene, player } = generator.generate();
    this.scene = scene;
    this.player = player;
  }
}
