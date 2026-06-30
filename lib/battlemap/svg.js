export function mapToSvg(map, { cellSize = 40 } = {}) {
  const w = map.cols * cellSize;
  const h = map.rows * cellSize;
  const floors = [];
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.cols; x++) {
      if (map.cells[y][x] === 1) {
        floors.push(`<rect class="floor" x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#f4f1e8" stroke="#111" stroke-width="1"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect class="bg" x="0" y="0" width="${w}" height="${h}" fill="#111"/>
${floors.join("\n")}
</svg>`;
}
