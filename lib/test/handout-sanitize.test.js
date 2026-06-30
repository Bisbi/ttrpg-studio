import { describe, it, expect } from "vitest";
import { playerSafe } from "../handout/sanitize.js";

describe("playerSafe", () => {
  it("rimuove i campi segreti annidati", () => {
    const src = {
      title: "Lettera",
      npc: { name: "Vera", secret: "è una spia", note_dm: "tradirà" },
      list: [{ text: "ok", secret: "no" }],
      secrets_and_clues: ["x"],
    };
    const out = playerSafe(src);
    expect(out.title).toBe("Lettera");
    expect(out.npc).toEqual({ name: "Vera" });
    expect(out.list).toEqual([{ text: "ok" }]);
    expect(out.secrets_and_clues).toBeUndefined();
  });
  it("non muta l'originale", () => {
    const src = { secret: "x", keep: 1 };
    playerSafe(src);
    expect(src.secret).toBe("x");
  });
});
