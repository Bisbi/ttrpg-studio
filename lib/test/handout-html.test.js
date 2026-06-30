import { describe, it, expect } from "vitest";
import { renderHandoutHtml } from "../handout/render-html.js";

describe("renderHandoutHtml", () => {
  it("compone titolo e contenuto con la classe del tipo", () => {
    const html = renderHandoutHtml({ kind: "letter", title: "Avviso", content: "Venite all'alba.", width: 800, height: 1200 });
    expect(html).toContain("handout letter");
    expect(html).toContain("Avviso");
    expect(html).toContain("Venite all&#39;alba."); // l'apostrofo è escapato
  });
  it("esegue l'escape del contenuto", () => {
    const html = renderHandoutHtml({ content: "<script>", title: "t" });
    expect(html).toContain("&lt;script&gt;");
  });
});
