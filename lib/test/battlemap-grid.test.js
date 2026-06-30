import { describe, it, expect } from "vitest";
import { gridGroup, addGridToSvg, wrapImageWithGrid } from "../battlemap/add-grid.js";

describe("gridGroup", () => {
  it("crea linee ogni cellSize", () => {
    const g = gridGroup({ width: 40, height: 20, cellSize: 20 });
    // verticali a x=0,20,40 (3) + orizzontali a y=0,20 (2) → 5 linee
    expect(g.match(/<line/g).length).toBe(5);
  });
});

describe("addGridToSvg", () => {
  it("inserisce la griglia prima di </svg>", () => {
    const out = addGridToSvg('<svg width="40" height="20"></svg>', { width: 40, height: 20, cellSize: 20 });
    expect(out).toContain('class="grid"');
    expect(out.trim().endsWith("</svg>")).toBe(true);
  });
});

describe("wrapImageWithGrid", () => {
  it("incapsula un'immagine con la griglia", () => {
    const svg = wrapImageWithGrid({ href: "map.png", width: 40, height: 20, cellSize: 20 });
    expect(svg).toContain("<image");
    expect(svg).toContain("map.png");
    expect(svg).toContain('class="grid"');
  });
  it("esegue l'escape dell'href (niente attribute breakout/injection)", () => {
    const svg = wrapImageWithGrid({ href: 'x"/><script>alert(1)</script>', width: 40, height: 20, cellSize: 20 });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&quot;");
  });
});
