export const TileType = {
  FLOOR: "floor",
  WALL: "wall",
  DOOR_OPEN: "door_open",
  DOOR_CLOSED: "door_closed",
};

export class Tile {
  constructor(type = TileType.FLOOR) {
    this.type = type;
    this.critter = null;
  }
}
