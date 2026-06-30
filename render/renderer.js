export function createRenderer({ launch } = {}) {
  const launcher = launch ?? (async (opts) => {
    const { chromium } = await import("playwright");
    return chromium.launch(opts);
  });

  async function launchWithTimeout(opts, timeoutMs) {
    let timer;
    const timeout = new Promise((_, rej) => {
      timer = setTimeout(() => rej(new Error("timeout di avvio del browser")), timeoutMs);
    });
    try {
      return await Promise.race([launcher(opts), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function attempt(html, opts) {
    const { width, height, selector, format, noSandbox, timeoutMs } = opts;
    let browser;
    try {
      browser = await launchWithTimeout({ args: noSandbox ? ["--no-sandbox"] : [] }, timeoutMs);
      const page = await browser.newPage();
      await page.setViewportSize({ width, height });
      await page.setContent(html, { waitUntil: "load", timeout: timeoutMs });
      if (format === "pdf") {
        return await page.pdf({ width: `${width}px`, height: `${height}px`, printBackground: true });
      }
      const el = selector ? await page.waitForSelector(selector, { timeout: timeoutMs }) : null;
      return el ? await el.screenshot({ type: "png" }) : await page.screenshot({ type: "png" });
    } finally {
      if (browser) await browser.close();
    }
  }

  return {
    async render(html, opts = {}) {
      const o = {
        width: 800, height: 1200, selector: ".canvas", format: "png",
        noSandbox: false, timeoutMs: 30000, retries: 1, ...opts,
      };
      let lastErr;
      for (let i = 0; i <= o.retries; i++) {
        try {
          return await attempt(html, o);
        } catch (e) {
          lastErr = e;
        }
      }
      throw new Error(`render fallito dopo ${o.retries + 1} tentativi: ${lastErr?.message}`);
    },
  };
}
