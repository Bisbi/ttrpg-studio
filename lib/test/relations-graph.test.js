import { describe, it, expect } from "vitest";
import { neighbors, outgoing, mergeEdges } from "../relations/graph.js";

const edges = [
  { source: "a", type: "ostile", target: "b" },
  { source: "c", type: "patrona", target: "a" },
  { source: "a", type: "alleata", target: "d" },
];

describe("query", () => {
  it("neighbors include archi entranti e uscenti", () => {
    expect(neighbors(edges, "a").length).toBe(3);
  });
  it("outgoing filtra per tipo", () => {
    expect(outgoing(edges, "a", "alleata")).toEqual([{ source: "a", type: "alleata", target: "d" }]);
  });
});

describe("mergeEdges", () => {
  it("unisce senza duplicati esatti", () => {
    const out = mergeEdges(edges, [
      { source: "a", type: "ostile", target: "b" }, // dup
      { source: "b", type: "ostile", target: "a" }, // nuovo
    ]);
    expect(out.length).toBe(4);
  });
});
