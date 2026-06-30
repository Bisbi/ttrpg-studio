import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index", () => {
  it("riesporta le API pubbliche worldbuilding", () => {
    for (const name of ["slugify", "writeFileSafe", "validateSettingConfig",
      "parseRelations", "serializeRelations", "mergeEdges", "scaffoldSetting",
      "applyGeneration", "checkCanon"]) {
      expect(typeof api[name]).toBe("function");
    }
  });
});
