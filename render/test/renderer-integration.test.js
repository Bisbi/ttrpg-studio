import { describe, it, expect } from "vitest";
import { createRenderer } from "../renderer.js";

const hasBrowser = await (async () => {
  try {
    const { chromium } = await import("playwright");
    const b = await chromium.launch();
    await b.close();
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasBrowser)("render reale (chromium)", () => {
  it("produce un PNG non vuoto", async () => {
    const r = createRenderer();
    const html = "<!doctype html><div class='canvas' style='width:100px;height:100px;background:#000'></div>";
    const png = await r.render(html, { width: 100, height: 100 });
    expect(png.length).toBeGreaterThan(100);
    expect(png.slice(1, 4).toString()).toBe("PNG"); // firma file PNG
  });
});
