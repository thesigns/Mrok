function transformOctant(ox, oy, dx, dy, octant) {
  switch (octant) {
    case 0: return [ox + dx, oy + dy];
    case 1: return [ox + dy, oy + dx];
    case 2: return [ox - dy, oy + dx];
    case 3: return [ox - dx, oy + dy];
    case 4: return [ox - dx, oy - dy];
    case 5: return [ox - dy, oy - dx];
    case 6: return [ox + dy, oy - dx];
    case 7: return [ox + dx, oy - dy];
  }
}

function isTransparent(scene, x, y) {
  if (!scene.inBounds(x, y)) return false;
  return !scene.get(x, y).isOpaque();
}

function castLight(scene, ox, oy, radius, row, startSlope, endSlope, octant) {
  if (startSlope < endSlope) return;

  let nextStartSlope = startSlope;

  for (let distance = row; distance <= radius; distance++) {
    let blocked = false;
    const deltaY = -distance;

    for (let deltaX = -distance; deltaX <= 0; deltaX++) {
      const leftSlope = (deltaX - 0.5) / (deltaY + 0.5);
      const rightSlope = (deltaX + 0.5) / (deltaY - 0.5);

      if (startSlope < rightSlope) continue;
      if (endSlope > leftSlope) break;

      const [mapX, mapY] = transformOctant(ox, oy, deltaX, deltaY, octant);

      const distSq = deltaX * deltaX + deltaY * deltaY;
      if (scene.inBounds(mapX, mapY) && distSq <= radius * radius) {
        const tile = scene.get(mapX, mapY);
        tile.visible = true;
        tile.revealed = true;
      }

      const isBlocking = !isTransparent(scene, mapX, mapY);

      if (blocked) {
        if (isBlocking) {
          nextStartSlope = rightSlope;
        } else {
          blocked = false;
          startSlope = nextStartSlope;
        }
      } else if (isBlocking && distance < radius) {
        blocked = true;
        castLight(scene, ox, oy, radius, distance + 1, startSlope, leftSlope, octant);
        nextStartSlope = rightSlope;
      }
    }

    if (blocked) break;
  }
}

export class FOV {
  static compute(scene, ox, oy, radius) {
    for (let y = 0; y < scene.height; y++)
      for (let x = 0; x < scene.width; x++)
        scene.get(x, y).visible = false;

    const origin = scene.get(ox, oy);
    origin.visible = true;
    origin.revealed = true;

    for (let octant = 0; octant < 8; octant++) {
      castLight(scene, ox, oy, radius, 1, 1.0, 0.0, octant);
    }
  }
}
