import { describe, it, expect } from "vitest";
import { checkBoundary } from "../wiki/boundary.js";

const tracked = new Set(["wiki/a.md", "wiki/b.md"]);

describe("checkBoundary", () => {
  it("nessuna violazione quando tutto e coerente", () => {
    const nodes = [
      { file: "wiki/a.md", data: { scope: "public" } },
      { file: "local/wiki/x.md", data: { scope: "local" } },
    ];
    expect(checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true })).toEqual([]);
  });

  it("segnala un nodo local che risulta tracciato da git", () => {
    const nodes = [{ file: "wiki/b.md", data: { scope: "local" } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("wiki/b.md");
    expect(v[0]).toMatch(/local/);
  });

  it("segnala un nodo public non versionato", () => {
    const nodes = [{ file: "wiki/missing.md", data: { scope: "public" } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("wiki/missing.md");
  });

  it("segnala local/ non ignorato", () => {
    const v = checkBoundary({ nodes: [], trackedFiles: tracked, localIgnored: false });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/gitignore/i);
  });

  it("accumula piu violazioni insieme", () => {
    const nodes = [
      { file: "wiki/b.md", data: { scope: "local" } },
      { file: "wiki/missing.md", data: { scope: "public" } },
    ];
    expect(checkBoundary({ nodes, trackedFiles: tracked, localIgnored: false })).toHaveLength(3);
  });
});
