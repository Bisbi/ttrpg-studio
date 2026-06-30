import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildServer } from "../index.js";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");

describe("buildServer", () => {
  it("costruisce il server e i tool sono invocabili via handler interni", async () => {
    const { handlers } = buildServer({ GAME_DATA_PATH: dataPath, GAME_DATA_LANG: "it" });
    const got = await handlers.get({ type: "monster", idOrName: "guardiano-ottone-homebrew" });
    expect(got.hp).toBe(45);
    const found = await handlers.search({ query: "cantante" });
    expect(found.total).toBeGreaterThanOrEqual(1);
  });
});
