import { escapeHtml } from "../render/html.js";

export function gridGroup({ width, height, cellSize, color = "#333" }) {
  const c = escapeHtml(color);
  const lines = [];
  for (let x = 0; x <= width; x += cellSize) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${c}" stroke-width="1"/>`);
  }
  for (let y = 0; y <= height; y += cellSize) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${c}" stroke-width="1"/>`);
  }
  return `<g class="grid">\n${lines.join("\n")}\n</g>`;
}

export function addGridToSvg(svg, opts) {
  const group = gridGroup(opts);
  return svg.replace(/<\/svg>\s*$/, `${group}\n</svg>`);
}

export function wrapImageWithGrid({ href, width, height, cellSize, color = "#333" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<image href="${escapeHtml(href)}" x="0" y="0" width="${width}" height="${height}"/>
${gridGroup({ width, height, cellSize, color })}
</svg>`;
}
