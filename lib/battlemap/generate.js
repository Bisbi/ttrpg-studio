function carveRoom(cells, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) cells[y][x] = 1;
  }
}
function carveCorridor(cells, ax, ay, bx, by) {
  let x = ax, y = ay;
  while (x !== bx) { cells[y][x] = 1; x += x < bx ? 1 : -1; }
  while (y !== by) { cells[y][x] = 1; y += y < by ? 1 : -1; }
  cells[y][x] = 1;
}
function overlaps(a, b) {
  return a.x < b.x + b.w + 1 && a.x + a.w + 1 > b.x && a.y < b.y + b.h + 1 && a.y + a.h + 1 > b.y;
}

export function generateDungeon({ cols = 12, rows = 12, roomAttempts = 10, rng = Math.random } = {}) {
  const cells = Array.from({ length: rows }, () => Array(cols).fill(0));
  const rooms = [];
  const ri = (min, max) => min + Math.floor(rng() * (max - min + 1));
  for (let i = 0; i < roomAttempts; i++) {
    const w = ri(2, Math.max(2, Math.floor(cols / 3)));
    const h = ri(2, Math.max(2, Math.floor(rows / 3)));
    const x = ri(1, cols - w - 1);
    const y = ri(1, rows - h - 1);
    if (x < 1 || y < 1) continue;
    const room = { x, y, w, h };
    if (rooms.some((r) => overlaps(r, room))) continue;
    carveRoom(cells, room);
    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      carveCorridor(cells,
        Math.floor(prev.x + prev.w / 2), Math.floor(prev.y + prev.h / 2),
        Math.floor(room.x + room.w / 2), Math.floor(room.y + room.h / 2));
    }
    rooms.push(room);
  }
  return { cols, rows, cells, rooms };
}
