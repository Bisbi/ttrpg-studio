import { describe, it, expect } from "vitest";
import { renderItemCardHtml } from "../item-card/render-html.js";

describe("renderItemCardHtml", () => {
  it("inserisce nome, rarità e dimensioni 2x", () => {
    const html = renderItemCardHtml({ name: "Tonico", rarity: "non comune", attunement: true, description: "Cura.", image: null });
    expect(html).toContain("Tonico");
    expect(html).toContain("non comune");
    expect(html).toContain("width:800px");
    expect(html).toContain("height:1200px");
    expect(html).toContain("sintonia");
  });
  it("include l'immagine se presente, esegue l'escape", () => {
    const html = renderItemCardHtml({ name: "X", rarity: "", attunement: false, description: "", image: "a&b.png" });
    expect(html).toContain("a&amp;b.png");
  });
});
