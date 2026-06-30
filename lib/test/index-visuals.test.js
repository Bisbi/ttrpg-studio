import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index — visuals", () => {
  it("riesporta le API deterministiche di visuals", () => {
    for (const name of ["selectProvider", "imageGenDisclaimer", "apiGenerate",
      "browserGenerate", "generateDungeon", "mapToSvg", "addGridToSvg",
      "wrapImageWithGrid"]) {
      expect(typeof api[name]).toBe("function");
    }
  });
});
