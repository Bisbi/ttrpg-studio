import { describe, it, expect, vi } from "vitest";
import { browserGenerate } from "../image/browser-provider.js";
import { ToolError } from "../common/errors.js";

describe("browserGenerate", () => {
  it("delega al pilot e ritorna il buffer", async () => {
    const buf = Buffer.from("ART");
    const pilot = vi.fn(async () => buf);
    const out = await browserGenerate({ url: "https://y", prompt: "drago" }, { pilot });
    expect(out).toBe(buf);
    expect(pilot).toHaveBeenCalledWith(expect.objectContaining({ url: "https://y", prompt: "drago" }));
  });
  it("errore se manca url o prompt", async () => {
    await expect(browserGenerate({ prompt: "x" }, { pilot: async () => Buffer.from("") })).rejects.toThrow(ToolError);
  });
});
