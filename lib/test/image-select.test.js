import { describe, it, expect } from "vitest";
import { selectProvider } from "../image/select.js";
import { imageGenDisclaimer } from "../image/disclaimer.js";

describe("selectProvider", () => {
  it("api se IMAGE_API_URL", () => {
    expect(selectProvider({ IMAGE_API_URL: "https://x" })).toBe("api");
  });
  it("browser se solo IMAGE_GEN_URL", () => {
    expect(selectProvider({ IMAGE_GEN_URL: "https://y" })).toBe("browser");
  });
  it("api ha priorità su browser", () => {
    expect(selectProvider({ IMAGE_API_URL: "https://x", IMAGE_GEN_URL: "https://y" })).toBe("api");
  });
  it("null se nessuna env", () => {
    expect(selectProvider({})).toBe(null);
  });
});

describe("imageGenDisclaimer", () => {
  it("cita ToS e licenze", () => {
    const d = imageGenDisclaimer();
    expect(d).toMatch(/Termini di Servizio|ToS/i);
    expect(d).toMatch(/licenz/i);
  });
});
