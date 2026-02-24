import { SceneGenerator } from "./scene_generator.js";

export class Session {
  constructor() {
    const generator = new SceneGenerator();
    const { scene, player } = generator.generate();
    this.scene = scene;
    this.player = player;
  }
}
