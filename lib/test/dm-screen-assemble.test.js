import { describe, it, expect } from "vitest";
import { assembleScreen } from "../dm-screen/assemble.js";

describe("assembleScreen", () => {
  it("costruisce i pannelli dall'avventura e dai mostri", () => {
    const screen = assembleScreen({
      adventure: {
        title: "La Cripta", strong_start: "Il pavimento cede.",
        encounters: [{ name: "Agguato" }], hooks: ["g1", "g2"],
      },
      monsters: [{ name: "Muffa", xp: 100 }],
    });
    expect(screen.title).toBe("La Cripta");
    const headings = screen.panels.map((p) => p.heading);
    expect(headings).toContain("Strong start");
    expect(headings).toContain("Incontri");
    expect(headings).toContain("Mostri");
    const mostri = screen.panels.find((p) => p.heading === "Mostri");
    expect(mostri.items[0]).toContain("Muffa");
    expect(mostri.items[0]).toContain("100");
  });
});
