import { describe, it, expect } from "vitest";
import { findStale } from "../wiki/stale.js";

const node = (covers, timestamp = "2026-09-11T10:00:00Z") => ({
  file: "wiki/a.md",
  data: { timestamp, covers },
});

describe("findStale", () => {
  it("nessuna voce se il codice e piu vecchio del nodo", () => {
    const lm = () => "2026-09-01T00:00:00Z";
    expect(findStale([node(["lib/x.js"])], lm)).toEqual([]);
  });

  it("segnala il nodo se il codice e piu recente", () => {
    const lm = () => "2026-09-20T00:00:00Z";
    const out = findStale([node(["lib/x.js"])], lm);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      file: "wiki/a.md",
      path: "lib/x.js",
      nodeAt: "2026-09-11T10:00:00Z",
      coveredAt: "2026-09-20T00:00:00Z",
    });
  });

  it("una voce per ogni path superato", () => {
    const lm = () => "2026-09-20T00:00:00Z";
    expect(findStale([node(["lib/x.js", "lib/y.js"])], lm)).toHaveLength(2);
  });

  it("ignora i path di cui non si conosce la data", () => {
    expect(findStale([node(["lib/x.js"])], () => null)).toEqual([]);
  });

  it("timestamp identico non e stale", () => {
    const lm = () => "2026-09-11T10:00:00Z";
    expect(findStale([node(["lib/x.js"])], lm)).toEqual([]);
  });

  it("un nodo senza covers non produce voci", () => {
    expect(findStale([{ file: "wiki/a.md", data: { timestamp: "2026-09-11T10:00:00Z" } }], () => "2027-01-01T00:00:00Z")).toEqual([]);
  });
});
