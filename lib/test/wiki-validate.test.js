import { describe, it, expect } from "vitest";
import { validateNode, NODE_TYPES, SCOPES, RESERVED } from "../wiki/validate.js";

const good = {
  data: {
    type: "Gotcha",
    title: "T",
    description: "D",
    scope: "public",
    covers: ["lib/"],
    tags: [],
    timestamp: "2026-09-11T10:00:00Z",
  },
  body: "text",
};

const node = (over = {}, body = "text") => ({ data: { ...good.data, ...over }, body });

describe("vocabolari", () => {
  it("espone i tipi ammessi", () => {
    expect(NODE_TYPES).toEqual(["Gotcha", "Decision", "Invariant", "Module", "Workflow"]);
  });
  it("espone gli scope ammessi", () => {
    expect(SCOPES).toEqual(["public", "local"]);
  });
  it("espone i nomi riservati", () => {
    expect(RESERVED).toEqual(["index.md", "log.md"]);
  });
});

describe("validateNode", () => {
  it("un nodo valido non produce errori", () => {
    expect(validateNode(good, "wiki/a.md")).toEqual([]);
  });

  it("segnala ogni campo obbligatorio mancante", () => {
    const errs = validateNode({ data: {}, body: "x" }, "wiki/a.md");
    for (const f of ["type", "title", "description", "scope", "covers", "tags", "timestamp"]) {
      expect(errs.some((e) => e.includes(f))).toBe(true);
    }
  });

  it("prefissa ogni errore con il path", () => {
    const errs = validateNode({ data: {}, body: "x" }, "wiki/a.md");
    expect(errs.every((e) => e.startsWith("wiki/a.md: "))).toBe(true);
  });

  it("rifiuta un type fuori vocabolario", () => {
    const errs = validateNode(node({ type: "Note" }), "wiki/a.md");
    expect(errs.some((e) => /type/.test(e))).toBe(true);
  });

  it("rifiuta uno scope fuori vocabolario", () => {
    const errs = validateNode(node({ scope: "secret" }), "wiki/a.md");
    expect(errs.some((e) => /scope/.test(e))).toBe(true);
  });

  it("rifiuta covers vuoto", () => {
    const errs = validateNode(node({ covers: [] }), "wiki/a.md");
    expect(errs.some((e) => /covers/.test(e))).toBe(true);
  });

  it("rifiuta covers scalare", () => {
    const errs = validateNode(node({ covers: "lib/" }), "wiki/a.md");
    expect(errs.some((e) => /covers/.test(e))).toBe(true);
  });

  it("accetta tags vuoto", () => {
    expect(validateNode(node({ tags: [] }), "wiki/a.md")).toEqual([]);
  });

  it("rifiuta un timestamp non ISO 8601 UTC", () => {
    const errs = validateNode(node({ timestamp: "2026-09-11" }), "wiki/a.md");
    expect(errs.some((e) => /timestamp/.test(e))).toBe(true);
  });

  it("un Decision senza le tre sezioni obbligatorie e invalido", () => {
    const errs = validateNode(node({ type: "Decision" }, "just prose"), "wiki/d.md");
    expect(errs.some((e) => /Standard/.test(e))).toBe(true);
    expect(errs.some((e) => /Why not here/.test(e))).toBe(true);
    expect(errs.some((e) => /What breaks/.test(e))).toBe(true);
  });

  it("un Decision con le tre sezioni e valido", () => {
    const body = "## Standard\na\n\n## Why not here\nb\n\n## What breaks\nc\n";
    expect(validateNode(node({ type: "Decision" }, body), "wiki/d.md")).toEqual([]);
  });
});
