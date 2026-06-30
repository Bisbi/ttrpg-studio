import { describe, it, expect, vi } from "vitest";
import { createRenderer } from "../renderer.js";

function fakeBrowser(screenshotBuf) {
  const page = {
    setViewportSize: vi.fn(async () => {}),
    setContent: vi.fn(async () => {}),
    waitForSelector: vi.fn(async () => ({ screenshot: vi.fn(async () => screenshotBuf) })),
    pdf: vi.fn(async () => Buffer.from("PDF")),
    screenshot: vi.fn(async () => screenshotBuf),
  };
  return { newPage: vi.fn(async () => page), close: vi.fn(async () => {}), _page: page };
}

describe("createRenderer.render", () => {
  it("ritorna il buffer dello screenshot e chiude il browser", async () => {
    const buf = Buffer.from("PNG");
    const browser = fakeBrowser(buf);
    const r = createRenderer({ launch: async () => browser });
    const out = await r.render("<div class='canvas'></div>", { width: 800, height: 1200 });
    expect(out).toBe(buf);
    expect(browser.close).toHaveBeenCalled();
  });

  it("ritenta una volta e poi propaga l'errore", async () => {
    let calls = 0;
    const r = createRenderer({ launch: async () => { calls++; throw new Error("boom"); } });
    await expect(r.render("<div></div>", {})).rejects.toThrow(/render fallito/);
    expect(calls).toBe(2); // 1 + 1 retry
  });

  it("formato pdf usa page.pdf", async () => {
    const browser = fakeBrowser(Buffer.from("PNG"));
    const r = createRenderer({ launch: async () => browser });
    const out = await r.render("<div class='canvas'></div>", { format: "pdf" });
    expect(out.toString()).toBe("PDF");
  });
});
