import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index — production", () => {
  it("riesporta le API deterministiche di produzione", () => {
    for (const name of ["resolveOutputPath", "localizeField", "escapeHtml", "htmlDocument",
      "cardModel", "renderItemCardHtml", "playerSafe", "renderHandoutHtml",
      "assembleScreen", "renderScreenHtml"]) {
      expect(typeof api[name]).toBe("function");
    }
  });
});
