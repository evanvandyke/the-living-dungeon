export enum TileType {
  VOID = 0,
  FLOOR = 1,
  WALL = 2,
  DOOR = 3,
  STAIRS_DOWN = 4,
  STAIRS_UP = 5,
  WATER = 6,
  LAVA = 7,
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  connected: boolean;
}

export interface DungeonLevel {
  tiles: TileType[][];
  rooms: Room[];
  width: number;
  height: number;
  depth: number;
  seed: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateDungeon(
  width: number,
  height: number,
  depth: number,
  seed: number
): DungeonLevel {
  const rng = seededRandom(seed + depth * 7919);
  const tiles: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill(TileType.VOID)
  );

  const rooms: Room[] = [];
  const roomCount = 6 + Math.floor(rng() * 5) + Math.floor(depth * 0.5);
  const minRoomSize = 4;
  const maxRoomSize = Math.min(10, 6 + Math.floor(depth * 0.3));

  for (let attempt = 0; attempt < roomCount * 10; attempt++) {
    if (rooms.length >= roomCount) break;

    const w = minRoomSize + Math.floor(rng() * (maxRoomSize - minRoomSize));
    const h = minRoomSize + Math.floor(rng() * (maxRoomSize - minRoomSize));
    const x = 1 + Math.floor(rng() * (width - w - 2));
    const y = 1 + Math.floor(rng() * (height - h - 2));

    const overlaps = rooms.some(
      (r) =>
        x < r.x + r.width + 2 &&
        x + w + 2 > r.x &&
        y < r.y + r.height + 2 &&
        y + h + 2 > r.y
    );

    if (overlaps) continue;

    rooms.push({ x, y, width: w, height: h, connected: false });

    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) {
        tiles[ry][rx] = TileType.FLOOR;
      }
    }
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i];
    const b = rooms[i + 1];

    const ax = Math.floor(a.x + a.width / 2);
    const ay = Math.floor(a.y + a.height / 2);
    const bx = Math.floor(b.x + b.width / 2);
    const by = Math.floor(b.y + b.height / 2);

    let cx = ax;
    let cy = ay;

    if (rng() > 0.5) {
      while (cx !== bx) {
        tiles[cy][cx] = TileType.FLOOR;
        cx += cx < bx ? 1 : -1;
      }
      while (cy !== by) {
        tiles[cy][cx] = TileType.FLOOR;
        cy += cy < by ? 1 : -1;
      }
    } else {
      while (cy !== by) {
        tiles[cy][cx] = TileType.FLOOR;
        cy += cy < by ? 1 : -1;
      }
      while (cx !== bx) {
        tiles[cy][cx] = TileType.FLOOR;
        cx += cx < bx ? 1 : -1;
      }
    }

    a.connected = true;
    b.connected = true;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] !== TileType.FLOOR) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (
            ny >= 0 &&
            ny < height &&
            nx >= 0 &&
            nx < width &&
            tiles[ny][nx] === TileType.VOID
          ) {
            tiles[ny][nx] = TileType.WALL;
          }
        }
      }
    }
  }

  if (rooms.length >= 2) {
    const lastRoom = rooms[rooms.length - 1];
    const sx = Math.floor(lastRoom.x + lastRoom.width / 2);
    const sy = Math.floor(lastRoom.y + lastRoom.height / 2);
    tiles[sy][sx] = TileType.STAIRS_DOWN;
  }

  if (depth > 0 && rooms.length > 0) {
    const firstRoom = rooms[0];
    const sx = Math.floor(firstRoom.x + firstRoom.width / 2);
    const sy = Math.floor(firstRoom.y + firstRoom.height / 2);
    tiles[sy][sx] = TileType.STAIRS_UP;
  }

  if (depth >= 3) {
    const hazardRoom = rooms[Math.floor(rng() * rooms.length)];
    const hazardType = rng() > 0.5 ? TileType.WATER : TileType.LAVA;
    for (let ry = hazardRoom.y + 1; ry < hazardRoom.y + hazardRoom.height - 1; ry++) {
      for (let rx = hazardRoom.x + 1; rx < hazardRoom.x + hazardRoom.width - 1; rx++) {
        if (rng() < 0.4 && tiles[ry][rx] === TileType.FLOOR) {
          tiles[ry][rx] = hazardType;
        }
      }
    }
  }

  return { tiles, rooms, width, height, depth, seed };
}

export function computeFOV(
  tiles: TileType[][],
  cx: number,
  cy: number,
  radius: number
): Set<string> {
  const visible = new Set<string>();
  const height = tiles.length;
  const width = tiles[0].length;

  for (let angle = 0; angle < 360; angle += 1) {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    let x = cx + 0.5;
    let y = cy + 0.5;

    for (let step = 0; step < radius; step++) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);

      if (ix < 0 || ix >= width || iy < 0 || iy >= height) break;

      visible.add(`${ix},${iy}`);

      if (tiles[iy][ix] === TileType.WALL) break;

      x += dx;
      y += dy;
    }
  }

  return visible;
}
