import { describe, it, expect } from "vitest";
import { buildIndex, buildLogEntry } from "../wiki/index-gen.js";

const entries = [
  { file: "z.md", data: { type: "Gotcha", title: "Zebra", description: "d1" } },
  { file: "a.md", data: { type: "Gotcha", title: "Alpha", description: "d2" } },
  { file: "d.md", data: { type: "Decision", title: "Delta", description: "d3" } },
];

describe("buildIndex", () => {
  it("raggruppa per type nell'ordine canonico", () => {
    const md = buildIndex(entries);
    expect(md.indexOf("## Gotcha")).toBeLessThan(md.indexOf("## Decision"));
  });

  it("ordina per title dentro il gruppo", () => {
    const md = buildIndex(entries);
    expect(md.indexOf("Alpha")).toBeLessThan(md.indexOf("Zebra"));
  });

  it("scrive link e descrizione", () => {
    expect(buildIndex(entries)).toContain("- [Alpha](a.md) — d2");
  });

  it("omette i tipi senza nodi", () => {
    expect(buildIndex(entries)).not.toContain("## Module");
  });

  it("termina con un solo newline", () => {
    const md = buildIndex(entries);
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
  });

  it("lista vuota produce un indice vuoto ma valido", () => {
    expect(buildIndex([])).toBe("# Index\n");
  });
});

describe("buildLogEntry", () => {
  it("elenca le sezioni non vuote", () => {
    const e = buildLogEntry({ timestamp: "2026-09-11T10:00:00Z", added: ["a.md"], updated: ["b.md"], removed: [] });
    expect(e).toContain("## 2026-09-11T10:00:00Z");
    expect(e).toContain("- added: a.md");
    expect(e).toContain("- updated: b.md");
  });

  it("omette le sezioni vuote", () => {
    const e = buildLogEntry({ timestamp: "2026-09-11T10:00:00Z", added: ["a.md"], updated: [], removed: [] });
    expect(e).not.toContain("updated");
    expect(e).not.toContain("removed");
  });

  it("termina con un newline", () => {
    const e = buildLogEntry({ timestamp: "2026-09-11T10:00:00Z", added: ["a.md"], updated: [], removed: [] });
    expect(e.endsWith("\n")).toBe(true);
  });
});
