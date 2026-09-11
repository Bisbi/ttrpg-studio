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

  it("segnala uno scope con maiuscola errata anche se il file e tracciato", () => {
    const nodes = [{ file: "wiki/b.md", data: { scope: "Local" } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("wiki/b.md");
  });

  it("segnala un nodo senza scope", () => {
    const nodes = [{ file: "wiki/b.md", data: {} }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
  });

  it("segnala uno scope che non e una stringa", () => {
    const nodes = [{ file: "wiki/b.md", data: { scope: 42 } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("wiki/b.md");
  });

  // Su un filesystem che ignora le maiuscole, una directory chiesta con una grafia diversa da quella
  // versionata viene letta senza errori, e i nodi raccolti portano quella grafia. Git invece
  // distingue le maiuscole: il percorso non risulta tracciato. Il confronto e volutamente esatto,
  // perche l'elenco dei file tracciati e l'unica autorita su cosa e pubblicato davvero, e un
  // confronto tollerante trasformerebbe questo controllo in una supposizione.
  it("segnala un nodo public la cui grafia non coincide con quella tracciata", () => {
    const nodes = [{ file: "WIKI/a.md", data: { scope: "public" } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("WIKI/a.md");
    expect(v[0]).toMatch(/not tracked/);
  });

  // Limite noto, documentato qui perche resti visibile: nella direzione opposta la grafia divergente
  // nasconde la violazione invece di crearla. Un nodo local il cui file e davvero tracciato, ma con
  // un'altra grafia, non viene segnalato. Il controllo resta comunque conservativo lato public, dove
  // un errore costerebbe una pubblicazione irreversibile.
  it("non rileva un nodo local tracciato con una grafia diversa (limite noto)", () => {
    const nodes = [{ file: "WIKI/a.md", data: { scope: "local" } }];
    expect(checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true })).toEqual([]);
  });
});
