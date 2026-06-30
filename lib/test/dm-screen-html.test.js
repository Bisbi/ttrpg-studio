import { describe, it, expect } from "vitest";
import { renderScreenHtml } from "../dm-screen/render-html.js";

describe("renderScreenHtml", () => {
  it("rende i pannelli e gli item", () => {
    const html = renderScreenHtml({
      title: "Schermo", panels: [{ heading: "Mostri", items: ["Muffa (100 XP)"] }],
    });
    expect(html).toContain("Schermo");
    expect(html).toContain("Mostri");
    expect(html).toContain("Muffa (100 XP)");
    expect(html).toContain("width:1920px");
  });
  it("esegue l'escape di heading e item", () => {
    const html = renderScreenHtml({ title: "t", panels: [{ heading: "<h>", items: ["<i>"] }] });
    expect(html).toContain("&lt;h&gt;");
    expect(html).toContain("&lt;i&gt;");
  });
});
