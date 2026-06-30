import { describe, it, expect, vi } from "vitest";
import { createLogger } from "../lib/logger.js";
import { ToolError, CODES } from "../lib/errors.js";

describe("logger", () => {
  it("scrive su stderr, mai su stdout", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const log = createLogger({});
    log.info("ciao");
    expect(err).toHaveBeenCalled();
    expect(out).not.toHaveBeenCalled();
    err.mockRestore(); out.mockRestore();
  });

  it("debug è no-op senza TTRPG_DEBUG", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createLogger({}).debug("x");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("debug attivo con TTRPG_DEBUG", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createLogger({ TTRPG_DEBUG: "1" }).debug("x");
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("ToolError", () => {
  it("serializza in {code,message,retriable}", () => {
    const e = new ToolError(CODES.NOT_FOUND, "non trovato", false);
    expect(e.toJSON()).toEqual({ code: "NOT_FOUND", message: "non trovato", retriable: false });
  });
});
