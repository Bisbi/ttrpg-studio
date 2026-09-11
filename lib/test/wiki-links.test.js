import { describe, it, expect } from "vitest";
import { extractLinks } from "../wiki/links.js";

describe("extractLinks", () => {
  it("trova i link relativi", () => {
    expect(extractLinks("see [a](a.md) and [b](sub/b.md)")).toEqual(["a.md", "sub/b.md"]);
  });

  it("esclude i link assoluti e le mail", () => {
    expect(extractLinks("[x](https://e.com) [y](mailto:a@b.c) [z](z.md)")).toEqual(["z.md"]);
  });

  it("esclude le ancore interne alla pagina", () => {
    expect(extractLinks("[top](#intro)")).toEqual([]);
  });

  it("rimuove l'ancora dal target relativo", () => {
    expect(extractLinks("[a](a.md#section)")).toEqual(["a.md"]);
  });

  it("rimuove i duplicati preservando l'ordine", () => {
    expect(extractLinks("[a](b.md) [c](a.md) [d](b.md)")).toEqual(["b.md", "a.md"]);
  });

  it("corpo senza link", () => {
    expect(extractLinks("plain text")).toEqual([]);
  });
});
