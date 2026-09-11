import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../wiki/frontmatter.js";

const doc = `---
type: Gotcha
title: CRLF breaks vitest
description: "A colon: inside quotes stays put"
scope: public
covers: [lib/bin/, .gitattributes]
tags: []
timestamp: 2026-09-11T10:00:00Z
---

Body line one.
`;

describe("parseFrontmatter", () => {
  it("estrae gli scalari", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.type).toBe("Gotcha");
    expect(data.scope).toBe("public");
  });

  it("rimuove le virgolette che racchiudono l'intero valore", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.description).toBe("A colon: inside quotes stays put");
  });

  it("estrae le liste inline e trimma gli elementi", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.covers).toEqual(["lib/bin/", ".gitattributes"]);
  });

  it("una lista vuota resta un array vuoto", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.tags).toEqual([]);
  });

  it("restituisce il corpo senza newline iniziali", () => {
    const { body } = parseFrontmatter(doc);
    expect(body).toBe("Body line one.\n");
  });

  it("ignora righe vuote e commenti", () => {
    const { data } = parseFrontmatter("---\n\n# nota\ntype: Decision\n---\nx\n");
    expect(data.type).toBe("Decision");
  });

  it("errore se manca il blocco di apertura", () => {
    expect(() => parseFrontmatter("type: Gotcha\n")).toThrow(/frontmatter/i);
  });

  it("errore se il blocco non viene chiuso", () => {
    expect(() => parseFrontmatter("---\ntype: Gotcha\n")).toThrow(/closing/i);
  });

  it("errore su sintassi fuori dal sottoinsieme", () => {
    expect(() => parseFrontmatter("---\ncovers:\n  - a\n---\nx\n")).toThrow(/unsupported/i);
  });

  it("errore su chiave non valida", () => {
    expect(() => parseFrontmatter("---\n9bad: x\n---\ny\n")).toThrow(/unsupported/i);
  });
});
