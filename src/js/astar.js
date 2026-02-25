import { TileType } from "./tile.js";

const SQRT2 = Math.sqrt(2);

export class Astar {
  static findPath(scene, sx, sy, tx, ty) {
    if (sx === tx && sy === ty) return [];
    if (!scene.inBounds(tx, ty)) return null;

    const target = scene.get(tx, ty);
    if (!target.passable && target.type !== TileType.DOOR_CLOSED) return null;

    const w = scene.width;
    const key = (x, y) => y * w + x;
    const open = [{ x: sx, y: sy, g: 0, f: 0 }];
    const gScore = new Map();
    const cameFrom = new Map();
    gScore.set(key(sx, sy), 0);

    while (open.length > 0) {
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[bestIdx].f) bestIdx = i;
      }
      const cur = open[bestIdx];
      open[bestIdx] = open[open.length - 1];
      open.pop();

      if (cur.x === tx && cur.y === ty) {
        const path = [];
        let k = key(tx, ty);
        while (k !== key(sx, sy)) {
          const px = k % w;
          const py = (k - px) / w;
          path.push({ x: px, y: py });
          k = cameFrom.get(k);
        }
        path.reverse();
        return path;
      }

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cur.x + dx;
          const ny = cur.y + dy;
          if (!scene.inBounds(nx, ny)) continue;

          const tile = scene.get(nx, ny);
          if (!tile.passable && tile.type !== TileType.DOOR_CLOSED) continue;

          const cost = (dx !== 0 && dy !== 0) ? SQRT2 : 1;
          const ng = cur.g + cost;
          const nk = key(nx, ny);

          if (!gScore.has(nk) || ng < gScore.get(nk)) {
            gScore.set(nk, ng);
            cameFrom.set(nk, key(cur.x, cur.y));
            const h = octile(nx, ny, tx, ty);
            open.push({ x: nx, y: ny, g: ng, f: ng + h });
          }
        }
      }
    }

    return null;
  }
}

function octile(ax, ay, bx, by) {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
}
