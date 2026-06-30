import { describe, it, expect } from "vitest";
import { parseRelations, serializeRelations } from "../relations/parse.js";

const md = [
  "# Relazioni",
  "",
  "```relations",
  "lega-del-sale --ostile--> corte-d-ottone",
  "# commento",
  "divinita-cenere --patrona--> lega-del-sale",
  "```",
  "",
  "testo dopo",
].join("\n");

describe("parseRelations", () => {
  it("estrae gli archi dal blocco relations", () => {
    const edges = parseRelations(md);
    expect(edges).toEqual([
      { source: "lega-del-sale", type: "ostile", target: "corte-d-ottone" },
      { source: "divinita-cenere", type: "patrona", target: "lega-del-sale" },
    ]);
  });
  it("ritorna [] senza blocco", () => {
    expect(parseRelations("nessun blocco")).toEqual([]);
  });
});

describe("serializeRelations", () => {
  it("round-trip ordinato", () => {
    const edges = parseRelations(md);
    const out = serializeRelations(edges);
    const reparsed = parseRelations(out);
    expect(reparsed.sort((a,b)=>a.source.localeCompare(b.source)))
      .toEqual(edges.sort((a,b)=>a.source.localeCompare(b.source)));
  });
});
