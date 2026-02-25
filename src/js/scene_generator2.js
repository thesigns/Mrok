import { Scene } from "./scene.js";
import { TileType } from "./tile.js";
import { Critter } from "./critter.js";

const MIN_ROOM_W = 3;
const MAX_ROOM_W = 8;
const MIN_ROOM_H = 3;
const MAX_ROOM_H = 8;
const ROOM_MARGIN = 3;
const EDGE_MARGIN = 2;
const MAX_CONSECUTIVE_FAILS = 100;
const MAX_DOORS = 3;

export class SceneGenerator2 {
  generate(width = 70, height = 46) {
    this.width = width;
    this.height = height;
    this.rooms = [];
    this.corridors = [];
    this.nextRegionId = 1;
    this.regionGrid = Array.from({ length: height }, () => new Int32Array(width));

    const scene = new Scene(width, height);

    // Fill with wall (rock)
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        scene.set(x, y, TileType.WALL);

    this.generateRooms(scene);
    this.connectRooms(scene);
    this.removeDisconnectedRooms(scene);
    this.specializeRooms(scene);
    this.specializeRoomFeatures(scene);
    this.processDoors(scene);
    this.placeStairs(scene);

    const player = this.placePlayer(scene);
    return { scene, player };
  }

  // --- Phase 1: Room Generation ---

  generateRooms(scene) {
    let fails = 0;
    while (fails < MAX_CONSECUTIVE_FAILS) {
      if (this.tryPlaceRoom(scene))
        fails = 0;
      else
        fails++;
    }
  }

  tryPlaceRoom(scene) {
    let roomW = MAX_ROOM_W;
    let roomH = MAX_ROOM_H;

    const minX = EDGE_MARGIN;
    const minY = EDGE_MARGIN;
    const maxX = this.width - MIN_ROOM_W - EDGE_MARGIN;
    const maxY = this.height - MIN_ROOM_H - EDGE_MARGIN;

    if (maxX < minX || maxY < minY) return false;

    const roomX = randInt(minX, maxX);
    const roomY = randInt(minY, maxY);

    let shrinkW = true;

    while (roomW >= MIN_ROOM_W && roomH >= MIN_ROOM_H) {
      if (this.canPlaceRoom(scene, roomX, roomY, roomW, roomH)) {
        this.carveRoom(scene, roomX, roomY, roomW, roomH);
        return true;
      }

      if (shrinkW) {
        roomW--;
        if (roomX + roomW > this.width - EDGE_MARGIN)
          roomW = this.width - EDGE_MARGIN - roomX;
      } else {
        roomH--;
        if (roomY + roomH > this.height - EDGE_MARGIN)
          roomH = this.height - EDGE_MARGIN - roomY;
      }
      shrinkW = !shrinkW;
    }

    return false;
  }

  canPlaceRoom(scene, rx, ry, rw, rh) {
    if (rx < EDGE_MARGIN || ry < EDGE_MARGIN ||
        rx + rw > this.width - EDGE_MARGIN ||
        ry + rh > this.height - EDGE_MARGIN)
      return false;

    const checkMinX = Math.max(0, rx - ROOM_MARGIN);
    const checkMinY = Math.max(0, ry - ROOM_MARGIN);
    const checkMaxX = Math.min(this.width - 1, rx + rw + ROOM_MARGIN - 1);
    const checkMaxY = Math.min(this.height - 1, ry + rh + ROOM_MARGIN - 1);

    for (let y = checkMinY; y <= checkMaxY; y++)
      for (let x = checkMinX; x <= checkMaxX; x++)
        if (scene.get(x, y).type !== TileType.WALL)
          return false;

    return true;
  }

  carveRoom(scene, rx, ry, rw, rh) {
    const regionId = this.nextRegionId++;
    const room = {
      index: this.rooms.length,
      x: rx, y: ry, w: rw, h: rh,
      regionId,
      connected: false,
      doorCount: 0,
    };
    this.rooms.push(room);

    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) {
        scene.set(x, y, TileType.FLOOR);
        this.regionGrid[y][x] = regionId;
      }

    return room;
  }

  // --- Phase 2: Corridor Generation ---

  connectRooms(scene) {
    if (this.rooms.length < 2) return;

    let fails = 0;
    while (fails < 500) {
      if (this.rooms.every(r => r.connected)) break;

      if (this.tryCreateCorridor(scene))
        fails = 0;
      else
        fails++;
    }
  }

  tryCreateCorridor(scene) {
    // Pick source room
    const connectedRooms = this.rooms.filter(r => r.connected && r.doorCount < MAX_DOORS);
    let sourceRoom;

    if (connectedRooms.length === 0) {
      if (this.rooms.some(r => r.connected)) return false;
      const available = this.rooms.filter(r => r.doorCount < MAX_DOORS);
      if (available.length === 0) return false;
      sourceRoom = available[randInt(0, available.length - 1)];
    } else {
      sourceRoom = connectedRooms[randInt(0, connectedRooms.length - 1)];
    }

    // Get wall candidate
    const candidate = this.getRandomValidWallCandidate(sourceRoom, scene);
    if (!candidate) return false;

    const { sx, sy, dx, dy } = candidate;

    // Dig corridor
    const path = [];
    let x = sx;
    let y = sy;

    while (true) {
      if (x < 1 || x >= this.width - 1 || y < 1 || y >= this.height - 1)
        return false;

      const tile = scene.get(x, y);

      // Hit floor — check what it is
      if (tile.type !== TileType.WALL) {
        const hitRegion = this.regionGrid[y][x];

        // Don't connect back to source room
        if (hitRegion === sourceRoom.regionId) return false;

        // Find target
        const targetRoomIdx = this.rooms.findIndex(r => r.regionId === hitRegion);
        const targetCorridorIdx = this.corridors.findIndex(c => c.regionId === hitRegion);

        if (targetRoomIdx < 0 && targetCorridorIdx < 0) return false;

        // Min length 3: door-corridor-door
        if (path.length < 3) return false;

        // Carve corridor middle
        const corridorRegionId = this.nextRegionId++;
        for (let i = 1; i < path.length - 1; i++) {
          const [px, py] = path[i];
          scene.set(px, py, TileType.FLOOR);
          this.regionGrid[py][px] = corridorRegionId;
        }

        // Place doors at both ends
        const [startDx, startDy] = path[0];
        scene.set(startDx, startDy, TileType.DOOR_CLOSED);
        this.regionGrid[startDy][startDx] = this.nextRegionId++;

        const [endDx, endDy] = path[path.length - 1];
        scene.set(endDx, endDy, TileType.DOOR_CLOSED);
        this.regionGrid[endDy][endDx] = this.nextRegionId++;

        // Track corridor
        this.corridors.push({
          index: this.corridors.length,
          regionId: corridorRegionId,
          connected: true,
        });

        // Mark connected
        sourceRoom.connected = true;
        sourceRoom.doorCount++;

        if (targetRoomIdx >= 0) {
          this.rooms[targetRoomIdx].connected = true;
          this.rooms[targetRoomIdx].doorCount++;
        } else {
          this.corridors[targetCorridorIdx].connected = true;
        }

        return true;
      }

      // Check diagonal adjacency (prevent corridor running along room)
      if (dx !== 0) {
        if (this.isFloor(scene, x, y - 1) || this.isFloor(scene, x, y + 1))
          return false;
      } else {
        if (this.isFloor(scene, x - 1, y) || this.isFloor(scene, x + 1, y))
          return false;
      }

      path.push([x, y]);
      x += dx;
      y += dy;

      if (path.length > 50) return false;
    }
  }

  getRandomValidWallCandidate(room, scene) {
    const candidates = [];

    // Top wall (excluding corners)
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const wy = room.y - 1;
      if (wy >= 1 && this.isValidWallPosition(scene, x, wy))
        candidates.push({ sx: x, sy: wy, dx: 0, dy: -1 });
    }

    // Bottom wall
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      const wy = room.y + room.h;
      if (wy < this.height - 1 && this.isValidWallPosition(scene, x, wy))
        candidates.push({ sx: x, sy: wy, dx: 0, dy: 1 });
    }

    // Left wall (excluding corners)
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      const wx = room.x - 1;
      if (wx >= 1 && this.isValidWallPosition(scene, wx, y))
        candidates.push({ sx: wx, sy: y, dx: -1, dy: 0 });
    }

    // Right wall
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      const wx = room.x + room.w;
      if (wx < this.width - 1 && this.isValidWallPosition(scene, wx, y))
        candidates.push({ sx: wx, sy: y, dx: 1, dy: 0 });
    }

    if (candidates.length === 0) return null;
    return candidates[randInt(0, candidates.length - 1)];
  }

  isValidWallPosition(scene, x, y) {
    if (this.isFloor(scene, x, y)) return false;

    // Not within 2 tiles of existing doors
    for (let dist = 1; dist <= 2; dist++) {
      if (this.isDoor(scene, x - dist, y) || this.isDoor(scene, x + dist, y) ||
          this.isDoor(scene, x, y - dist) || this.isDoor(scene, x, y + dist))
        return false;
    }

    return true;
  }

  // --- Phase 3: Remove Disconnected Rooms ---

  removeDisconnectedRooms(scene) {
    const disconnected = this.rooms.filter(r => !r.connected);

    for (const room of disconnected) {
      for (let y = room.y; y < room.y + room.h; y++)
        for (let x = room.x; x < room.x + room.w; x++) {
          scene.set(x, y, TileType.WALL);
          this.regionGrid[y][x] = 0;
        }
    }

    this.rooms = this.rooms.filter(r => r.connected);
  }

  // --- Phase 4: Room Shape Specialization ---

  specializeRooms(scene) {
    for (const room of this.rooms) {
      if (Math.random() >= 0.5) continue;

      const roll = Math.random();
      if (roll < 0.25)
        this.applyCornerColumns(scene, room);
      else if (roll < 0.5)
        this.applyRoundedCorners(scene, room);
      else if (roll < 0.75)
        this.applyCenterCross(scene, room);
      else
        this.applyCenterCrossRoundedCorners(scene, room);
    }
  }

  applyCornerColumns(scene, room) {
    if (room.w < 4 || room.h < 4) return;
    const positions = [
      [room.x + 1, room.y + 1],
      [room.x + room.w - 2, room.y + 1],
      [room.x + 1, room.y + room.h - 2],
      [room.x + room.w - 2, room.y + room.h - 2],
    ];
    for (const [x, y] of positions)
      scene.set(x, y, TileType.WALL);
  }

  applyRoundedCorners(scene, room) {
    const corners = [
      [room.x, room.y],
      [room.x + room.w - 1, room.y],
      [room.x, room.y + room.h - 1],
      [room.x + room.w - 1, room.y + room.h - 1],
    ];
    for (const [x, y] of corners) {
      if (!this.isAdjacentToDoor(scene, x, y))
        scene.set(x, y, TileType.WALL);
    }
  }

  applyCenterCross(scene, room) {
    if (room.w < 5 || room.h < 5) return;

    let cx1, cx2;
    if (room.w % 2 === 1) {
      cx1 = cx2 = room.x + Math.floor(room.w / 2);
    } else {
      cx1 = room.x + room.w / 2 - 1;
      cx2 = room.x + room.w / 2;
    }

    let cy1, cy2;
    if (room.h % 2 === 1) {
      cy1 = cy2 = room.y + Math.floor(room.h / 2);
    } else {
      cy1 = room.y + room.h / 2 - 1;
      cy2 = room.y + room.h / 2;
    }

    const tiles = new Set();

    // Vertical arm
    for (let x = cx1; x <= cx2; x++)
      for (let y = cy1 - 1; y <= cy2 + 1; y++)
        tiles.add(`${x},${y}`);

    // Horizontal arm
    for (let y = cy1; y <= cy2; y++)
      for (let x = cx1 - 1; x <= cx2 + 1; x++)
        tiles.add(`${x},${y}`);

    for (const key of tiles) {
      const [x, y] = key.split(",").map(Number);
      scene.set(x, y, TileType.WALL);
    }
  }

  applyCenterCrossRoundedCorners(scene, room) {
    if (room.w < 5 || room.h < 5) return;
    this.applyCenterCross(scene, room);
    this.applyRoundedCorners(scene, room);
  }

  isAdjacentToDoor(scene, x, y) {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      if (this.isDoor(scene, x + dx, y + dy)) return true;
    }
    return false;
  }

  // --- Phase 4b: Room Feature Specialization ---

  specializeRoomFeatures(scene) {
    for (const room of this.rooms) {
      if (Math.random() >= 0.2) continue;
      if (Math.random() < 0.5)
        this.applyWaterContainer(scene, room);
      else
        this.applyGraveyard(scene, room);
    }
  }

  applyWaterContainer(scene, room) {
    // Pass 1: floor → deep water
    for (let y = room.y; y < room.y + room.h; y++)
      for (let x = room.x; x < room.x + room.w; x++)
        if (scene.get(x, y).type === TileType.FLOOR)
          scene.set(x, y, TileType.WATER_DEEP);

    // Pass 2: deep water adjacent to solid → shallow water
    for (let y = room.y; y < room.y + room.h; y++)
      for (let x = room.x; x < room.x + room.w; x++)
        if (scene.get(x, y).type === TileType.WATER_DEEP && this.isAdjacentToSolid(scene, x, y))
          scene.set(x, y, TileType.WATER_SHALLOW);
  }

  applyGraveyard(scene, room) {
    for (let y = room.y; y < room.y + room.h; y++)
      for (let x = room.x; x < room.x + room.w; x++)
        if (scene.get(x, y).type === TileType.FLOOR && Math.random() < 0.2)
          scene.set(x, y, TileType.GRAVE);
  }

  isAdjacentToSolid(scene, x, y) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!scene.inBounds(nx, ny)) continue;
        if (scene.get(nx, ny).type === TileType.WALL)
          return true;
      }
    return false;
  }

  // --- Phase 6: Process Doors ---

  processDoors(scene) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = scene.get(x, y);
        if (tile.type !== TileType.DOOR_CLOSED && tile.type !== TileType.DOOR_OPEN)
          continue;

        if (this.checkAllAdjacentFloorsAreCorridor(scene, x, y)) {
          // Door between corridors — replace with floor
          scene.set(x, y, TileType.FLOOR);
        } else {
          // Randomize: 30% open, 70% closed
          if (Math.random() < 0.3)
            scene.set(x, y, TileType.DOOR_OPEN);
          else
            scene.set(x, y, TileType.DOOR_CLOSED);
        }
      }
    }
  }

  checkAllAdjacentFloorsAreCorridor(scene, x, y) {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

      if (scene.get(nx, ny).type !== TileType.WALL) {
        const regionId = this.regionGrid[ny][nx];
        if (this.rooms.some(r => r.regionId === regionId))
          return false; // Adjacent to a room
      }
    }

    return true;
  }

  // --- Stairs Placement ---

  placeStairs(scene) {
    while (true) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (scene.get(x, y).type === TileType.FLOOR) {
        scene.set(x, y, TileType.STAIRS_DOWN);
        return;
      }
    }
  }

  // --- Player Placement ---

  placePlayer(scene) {
    while (true) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      const tile = scene.get(x, y);
      if (tile.type === TileType.FLOOR && !tile.critter) {
        const player = new Critter(x, y, true);
        tile.critter = player;
        return player;
      }
    }
  }

  // --- Helpers ---

  isFloor(scene, x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return scene.get(x, y).type !== TileType.WALL;
  }

  isDoor(scene, x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const t = scene.get(x, y).type;
    return t === TileType.DOOR_OPEN || t === TileType.DOOR_CLOSED;
  }
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
