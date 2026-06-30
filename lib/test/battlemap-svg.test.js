import { describe, it, expect } from "vitest";
import { mapToSvg } from "../battlemap/svg.js";

const map = { cols: 2, rows: 2, cells: [[1, 0], [0, 1]] };

describe("mapToSvg", () => {
  it("produce un SVG con dimensioni corrette e rect dei pavimenti", () => {
    const svg = mapToSvg(map, { cellSize: 10 });
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="20"');
    expect(svg).toContain('height="20"');
    expect(svg.match(/<rect[^>]*class="floor"/g)?.length).toBe(2);
  });
});
