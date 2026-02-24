export class Critter {
  constructor(x, y, isPlayer = false, tint = "#fff") {
    this.x = x;
    this.y = y;
    this.isPlayer = isPlayer;
    this.tint = tint;
  }
}
