import { describe, it, expect } from "vitest";
import { escapeHtml, htmlDocument } from "../render/html.js";

describe("escapeHtml", () => {
  it("esegue l'escape dei caratteri speciali", () => {
    expect(escapeHtml('<a href="x">&\'')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

describe("htmlDocument", () => {
  it("imposta dimensioni canvas e inserisce il body", () => {
    const html = htmlDocument({ title: "T", css: ".x{}", body: "<p>ciao</p>", width: 800, height: 1200 });
    expect(html).toContain("width:800px");
    expect(html).toContain("height:1200px");
    expect(html).toContain("<p>ciao</p>");
    expect(html).toContain('content="800"');
  });
  it("esegue l'escape del title", () => {
    expect(htmlDocument({ title: "<x>", width: 1, height: 1 })).toContain("&lt;x&gt;");
  });
});
